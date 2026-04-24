import pc from "picocolors";

import { clearStoredToken, resolveConfig } from "../config.js";

export interface LogoutOptions {
  json?: boolean;
}

export async function logoutCommand(opts: LogoutOptions): Promise<void> {
  const cfg = await resolveConfig();
  if (!cfg.token) {
    if (opts.json) {
      console.log(JSON.stringify({ ok: true, alreadyLoggedOut: true }));
    } else {
      console.log(pc.dim("Not logged in. Nothing to do."));
    }
    return;
  }

  await clearStoredToken();

  if (opts.json) {
    console.log(JSON.stringify({ ok: true }));
  } else {
    console.log(pc.green("✓ Logged out"));
  }
}
