import { CryptohopperClient, CryptohopperError } from "@cryptohopper/sdk";
import pc from "picocolors";
import readline from "node:readline/promises";

import { persistLogin, resolveConfig } from "../config.js";
import { CURRENT_VERSION } from "../version.js";
import { fail } from "../api.js";

export interface LoginOptions {
  token?: string;
  appKey?: string;
  json?: boolean;
}

export async function loginCommand(opts: LoginOptions): Promise<void> {
  const cfg = await resolveConfig();
  const json = opts.json ?? false;

  let token = opts.token?.trim() ?? "";
  if (!token) {
    token = await promptForToken();
  }
  if (!token) {
    return fail(new Error("No token provided."), json);
  }

  // Verify the token by calling user.get()
  const client = new CryptohopperClient({
    apiKey: token,
    appKey: opts.appKey,
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
      appKey: opts.appKey,
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
          "Token rejected by Cryptohopper. Create an OAuth app at " +
            "https://www.cryptohopper.com (developer dashboard), then paste the issued token.",
        ),
        json,
      );
    }
    return fail(err, json);
  }
}

async function promptForToken(): Promise<string> {
  console.log(
    "Paste your Cryptohopper OAuth token. Get one from the developer",
  );
  console.log("dashboard: https://www.cryptohopper.com → Account → Developer.");
  console.log("");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = await rl.question("Token: ");
    return answer.trim();
  } finally {
    rl.close();
  }
}
