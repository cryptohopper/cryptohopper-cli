import { CryptohopperClient, CryptohopperError } from "@cryptohopper/sdk";
import pc from "picocolors";

import { resolveConfig } from "./config.js";
import { CURRENT_VERSION } from "./version.js";

/**
 * Build a CryptohopperClient using the resolved CLI config. If `requireAuth`
 * is true and no token is found, prints a helpful error and exits.
 */
export async function getClient(
  opts: { requireAuth?: boolean } = {},
): Promise<{ client: CryptohopperClient; apiUrl: string }> {
  const cfg = await resolveConfig();

  if (opts.requireAuth && !cfg.token) {
    console.error(pc.red("Not logged in. Run `cryptohopper login` first."));
    process.exit(2);
  }

  const client = new CryptohopperClient({
    // Use a sentinel for unauth endpoints (exchange.*, market.*) so the
    // SDK doesn't reject the empty string; the server ignores bearer on
    // whitelisted routes anyway.
    apiKey: cfg.token ?? "anonymous",
    appKey: cfg.appKey,
    baseUrl: cfg.apiUrl,
    userAgent: `cryptohopper-cli/${CURRENT_VERSION}`,
  });

  return { client, apiUrl: cfg.apiUrl };
}

/**
 * Map a CryptohopperError to an exit code. Mirrors the documented set:
 *   1 — generic / user error
 *   2 — auth (UNAUTHORIZED, FORBIDDEN)
 *   3 — rate limit
 *   4 — server / service unavailable
 *   5 — network / timeout
 */
export function exitCodeFor(err: CryptohopperError): number {
  switch (err.code) {
    case "UNAUTHORIZED":
    case "FORBIDDEN":
    case "DEVICE_UNAUTHORIZED":
      return 2;
    case "RATE_LIMITED":
      return 3;
    case "SERVER_ERROR":
    case "SERVICE_UNAVAILABLE":
      return 4;
    case "NETWORK_ERROR":
    case "TIMEOUT":
      return 5;
    default:
      return 1;
  }
}

/** Uniform error handler for commands. Never returns. */
export function fail(err: unknown, json: boolean): never {
  if (err instanceof CryptohopperError) {
    if (json) {
      console.error(
        JSON.stringify({
          ok: false,
          error: {
            code: err.code,
            status: err.status,
            message: err.message,
            serverCode: err.serverCode,
            ipAddress: err.ipAddress,
          },
        }),
      );
    } else {
      console.error(pc.red(`✗ ${err.message}`));
      if (err.ipAddress) console.error(pc.dim(`  IP: ${err.ipAddress}`));
    }
    process.exit(exitCodeFor(err));
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (json) {
    console.error(JSON.stringify({ ok: false, error: { message: msg } }));
  } else {
    console.error(pc.red(`✗ ${msg}`));
  }
  process.exit(1);
}
