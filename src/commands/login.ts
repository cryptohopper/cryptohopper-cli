import { CryptohopperClient, CryptohopperError } from "@cryptohopper/sdk";
import pc from "picocolors";

import { persistLogin, resolveConfig } from "../config.js";
import { CURRENT_VERSION } from "../version.js";
import { fail } from "../api.js";
import { runBrowserFlow } from "../auth/browser-flow.js";

/**
 * `client_id` of the first-party `cryptohopper-cli` OAuth2 application on
 * cryptohopper.com. Public identifier, safe to embed. Registered against
 * redirect_uri `http://127.0.0.1:18765/callback`.
 */
const CLI_CLIENT_ID =
  "kOeSoGu66gCi3ImQphJspSBJlsUljI5XQXp3edbgne6X3cQfoK3ocNefygrCgChC";

export interface LoginOptions {
  /** Skip the browser flow entirely and use a pre-obtained bearer token. */
  token?: string;
  /** Override the OAuth client_id used for the browser flow (testing only). */
  clientId?: string;
  /** Override the OAuth client_id to send as `x-api-app-key` on subsequent calls. */
  appKey?: string;
  json?: boolean;
}

export async function loginCommand(opts: LoginOptions): Promise<void> {
  const cfg = await resolveConfig();
  const json = opts.json ?? false;
  const clientId = opts.clientId ?? CLI_CLIENT_ID;

  let token: string;
  let appKey: string | undefined = opts.appKey;

  if (opts.token?.trim()) {
    // --token: paste-token path. Useful for CI or SSH where we can't open
    // a browser. User has obtained the token some other way (e.g. manual
    // /oauth2/authorize in a browser + copy-paste).
    token = opts.token.trim();
  } else {
    if (!json) {
      console.log("Opening your browser to authorize with Cryptohopper...");
      console.log(
        pc.dim(
          "(If nothing opens, copy the URL printed below into your browser manually.)",
        ),
      );
    }
    try {
      const result = await runBrowserFlow({
        clientId,
        webUrl: cfg.webUrl,
        onAuthUrl: (url) => {
          if (!json) console.log(pc.dim(`\n  ${url}\n`));
        },
      });
      token = result.accessToken;
      // Default appKey to the CLI's own client_id so downstream API calls
      // send `x-api-app-key` — lets the server attribute traffic per app,
      // and keeps the CLI distinguishable from other integrations.
      if (!appKey) appKey = clientId;
    } catch (err) {
      return fail(err, json);
    }
  }

  // Verify the token by calling user.get() before we persist anything.
  const client = new CryptohopperClient({
    apiKey: token,
    appKey,
    baseUrl: cfg.apiUrl,
    userAgent: `cryptohopper-cli/${CURRENT_VERSION}`,
  });

  try {
    const profile = (await client.user.get()) as Record<string, unknown>;
    const user = {
      id: (profile["id"] as string | number | undefined) ?? undefined,
      email: (profile["email"] as string | undefined) ?? undefined,
      username: (profile["username"] as string | undefined) ?? undefined,
    };
    await persistLogin({
      apiUrl: cfg.apiUrl,
      token,
      appKey,
      user,
    });

    if (json) {
      console.log(JSON.stringify({ ok: true, user }));
    } else {
      const who = user.email ?? user.username ?? String(user.id ?? "user");
      console.log(pc.green(`✓ Logged in as ${pc.bold(who)}`));
      console.log(pc.dim(`  Token saved to ~/.cryptohopper/config.json`));
    }
  } catch (err) {
    if (err instanceof CryptohopperError && err.code === "UNAUTHORIZED") {
      return fail(
        new Error(
          "Token rejected by Cryptohopper. It may have expired or been revoked. " +
            "Re-run `cryptohopper login` to try again.",
        ),
        json,
      );
    }
    return fail(err, json);
  }
}
