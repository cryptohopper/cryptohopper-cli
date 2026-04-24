/**
 * OAuth2 "Authorization Code" flow for a public client (RFC 8252-ish).
 *
 * Sequence:
 *   1. Generate random state nonce.
 *   2. Start a localhost HTTP listener on the registered callback port.
 *   3. Open the user's default browser to /oauth2/authorize?...
 *   4. User clicks "Allow" on the Cryptohopper consent page.
 *   5. Cryptohopper redirects to http://127.0.0.1:<port>/callback?code=...&state=...
 *   6. Validate state (CSRF), exchange code for token at /oauth2/token.
 *   7. Return token (+ refresh token) to the caller, close the listener.
 *
 * The CLI is a public client — no client_secret is sent. Security comes from:
 *   - strict redirect-URI matching on the Cryptohopper server
 *   - the random state nonce (prevents CSRF on the callback)
 *   - the loopback-only listener (only the user's own machine can reach it)
 */

import { exec } from "node:child_process";
import crypto from "node:crypto";
import http from "node:http";
import { URL } from "node:url";

export const CALLBACK_PORT = 18765;
export const CALLBACK_PATH = "/callback";
const DEFAULT_SCOPES = "read manage trade user";
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

export interface BrowserFlowOptions {
  clientId: string;
  /** Web origin where /oauth2/authorize + /oauth2/token live (e.g. https://www.cryptohopper.com). */
  webUrl: string;
  scopes?: string;
  timeoutMs?: number;
  /** Called once with the authorize URL so the caller can print it as a fallback. */
  onAuthUrl?: (url: string) => void;
}

export interface BrowserFlowResult {
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  expiresIn?: number;
}

export async function runBrowserFlow(
  opts: BrowserFlowOptions,
): Promise<BrowserFlowResult> {
  const scopes = opts.scopes ?? DEFAULT_SCOPES;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const state = crypto.randomBytes(32).toString("base64url");
  const redirectUri = `http://127.0.0.1:${CALLBACK_PORT}${CALLBACK_PATH}`;

  const webUrl = opts.webUrl.replace(/\/+$/, "");
  const authUrl = new URL(`${webUrl}/oauth2/authorize`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", opts.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", scopes);

  const { code, receivedState } = await listenForCallback({
    port: CALLBACK_PORT,
    path: CALLBACK_PATH,
    timeoutMs,
    onReady: () => {
      opts.onAuthUrl?.(authUrl.toString());
      // Best-effort browser open; if it fails, the URL has already been emitted.
      openBrowser(authUrl.toString()).catch(() => {});
    },
  });

  if (receivedState !== state) {
    throw new Error(
      "OAuth state mismatch — possible CSRF attempt. Aborted without storing a token.",
    );
  }

  return exchangeCodeForToken({
    tokenUrl: `${webUrl}/oauth2/token`,
    code,
    clientId: opts.clientId,
    redirectUri,
  });
}

interface CallbackListenerArgs {
  port: number;
  path: string;
  timeoutMs: number;
  onReady: () => void;
}

function listenForCallback(
  args: CallbackListenerArgs,
): Promise<{ code: string; receivedState: string }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) {
        res.writeHead(400).end();
        return;
      }
      const url = new URL(req.url, `http://127.0.0.1:${args.port}`);
      if (url.pathname !== args.path) {
        res.writeHead(404, { "content-type": "text/plain" });
        res.end("Not found");
        return;
      }

      const errorCode = url.searchParams.get("error");
      if (errorCode) {
        const desc = url.searchParams.get("error_description") ?? errorCode;
        res.writeHead(400, { "content-type": "text/html; charset=utf-8" });
        res.end(errorPage(desc));
        cleanup();
        reject(new Error(`OAuth error from server: ${errorCode} — ${desc}`));
        return;
      }

      const code = url.searchParams.get("code");
      const receivedState = url.searchParams.get("state");
      if (!code || !receivedState) {
        res.writeHead(400, { "content-type": "text/html; charset=utf-8" });
        res.end(errorPage("Callback is missing `code` or `state`."));
        cleanup();
        reject(new Error("Malformed callback: missing code or state"));
        return;
      }

      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(successPage());
      cleanup();
      resolve({ code, receivedState });
    });

    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `OAuth flow timed out after ${Math.round(args.timeoutMs / 1000)}s. Re-run \`cryptohopper login\`.`,
        ),
      );
    }, args.timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      server.close();
    };

    server.on("error", (err) => {
      cleanup();
      if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
        reject(
          new Error(
            `Port ${args.port} is already in use (the Cryptohopper CLI OAuth callback port). ` +
              `Close whatever's using it and re-run \`cryptohopper login\`, or use \`cryptohopper login --token <value>\` to skip the browser flow.`,
          ),
        );
      } else {
        reject(err);
      }
    });

    server.listen(args.port, "127.0.0.1", () => {
      args.onReady();
    });
  });
}

interface ExchangeArgs {
  tokenUrl: string;
  code: string;
  clientId: string;
  redirectUri: string;
}

async function exchangeCodeForToken(
  args: ExchangeArgs,
): Promise<BrowserFlowResult> {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", args.code);
  body.set("client_id", args.clientId);
  body.set("redirect_uri", args.redirectUri);
  // No client_secret — this is a public client. The Cryptohopper OAuth2
  // server accepts this because the app row has an empty client_secret
  // and bshaffer's `allow_public_clients` is true by default.

  let res: Response;
  try {
    res = await fetch(args.tokenUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body: body.toString(),
    });
  } catch (err) {
    throw new Error(
      `Could not reach the token endpoint (${args.tokenUrl}): ${(err as Error).message}`,
    );
  }

  const text = await res.text();
  let parsed: Record<string, unknown> | null = null;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      /* non-JSON body; fall through with parsed = null */
    }
  }

  if (!res.ok) {
    // text.slice() always returns a string, so `??` on it never falls through
    // to the HTTP status — use `||` to treat empty bodies as falsy.
    const msg =
      (parsed?.["error_description"] as string | undefined) ??
      (parsed?.["error"] as string | undefined) ??
      (text.slice(0, 200) || `HTTP ${res.status}`);
    throw new Error(`Token exchange failed: ${msg}`);
  }

  const accessToken = parsed?.["access_token"] as string | undefined;
  if (!accessToken) {
    throw new Error(
      `Token exchange returned no access_token: ${text.slice(0, 200)}`,
    );
  }

  return {
    accessToken,
    refreshToken: parsed?.["refresh_token"] as string | undefined,
    scope: parsed?.["scope"] as string | undefined,
    expiresIn: parsed?.["expires_in"] as number | undefined,
  };
}

function openBrowser(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Quote the URL so shells don't split on `&` etc. URLs never contain `"`
    // because URL serialisation percent-encodes it, so the quotes are safe.
    const quoted = `"${url}"`;
    let cmd: string;
    switch (process.platform) {
      case "win32":
        // The empty `""` is the window title for `start` — without it, an URL
        // containing `&` would be parsed as the title and the URL would be lost.
        cmd = `cmd /c start "" ${quoted}`;
        break;
      case "darwin":
        cmd = `open ${quoted}`;
        break;
      default:
        cmd = `xdg-open ${quoted}`;
        break;
    }
    exec(cmd, (err) => (err ? reject(err) : resolve()));
  });
}

function successPage(): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Logged in — Cryptohopper CLI</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;max-width:520px;margin:12vh auto;padding:0 24px;text-align:center;color:#0b1b2c;background:#f8fafc}
  h1{color:#0ea5e9;margin:0 0 8px}
  p{color:#475569;line-height:1.5}
  small{color:#94a3b8}
</style></head><body>
  <h1>✓ Logged in</h1>
  <p>Your token is saved. You can close this tab and return to your terminal.</p>
  <p><small>Cryptohopper CLI</small></p>
</body></html>`;
}

function errorPage(message: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Login failed — Cryptohopper CLI</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;max-width:520px;margin:12vh auto;padding:0 24px;text-align:center;color:#0b1b2c;background:#f8fafc}
  h1{color:#ef4444;margin:0 0 8px}
  p{color:#475569;line-height:1.5}
  code{background:#f1f5f9;padding:2px 6px;border-radius:4px;word-break:break-all}
</style></head><body>
  <h1>✗ Login failed</h1>
  <p><code>${escapeHtml(message)}</code></p>
  <p>Return to your terminal for details, then try <code>cryptohopper login</code> again.</p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[c] ?? c;
  });
}
