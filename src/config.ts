/**
 * Local CLI config + token storage. Single JSON file at ~/.cryptohopper/config.json
 * with 0600 perms (rw for owner only).
 *
 * Env overrides win over the file:
 *   CRYPTOHOPPER_TOKEN     — bypass the stored token (CI, scripts)
 *   CRYPTOHOPPER_APP_KEY   — optional OAuth client_id, sent as x-api-app-key
 *   CRYPTOHOPPER_API_URL   — point the CLI at staging / a local dev server
 *   CRYPTOHOPPER_WEB_URL   — origin of the OAuth consent pages (authorize/token)
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const DEFAULT_API_URL = "https://api.cryptohopper.com/v1";
const DEFAULT_WEB_URL = "https://www.cryptohopper.com";

export interface StoredUser {
  id?: string | number;
  email?: string;
  username?: string;
}

export interface ConfigFile {
  apiUrl?: string;
  webUrl?: string;
  token?: string;
  appKey?: string;
  user?: StoredUser;
}

export function configDir(): string {
  return path.join(os.homedir(), ".cryptohopper");
}

export function configPath(): string {
  return path.join(configDir(), "config.json");
}

export async function readConfig(): Promise<ConfigFile> {
  try {
    const raw = await fs.readFile(configPath(), "utf8");
    return JSON.parse(raw) as ConfigFile;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw err;
  }
}

export async function writeConfig(cfg: ConfigFile): Promise<void> {
  await fs.mkdir(configDir(), { recursive: true, mode: 0o700 });
  const tmp = configPath() + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(cfg, null, 2), {
    mode: 0o600,
    encoding: "utf8",
  });
  await fs.rename(tmp, configPath());
}

export async function clearStoredToken(): Promise<void> {
  const cfg = await readConfig();
  delete cfg.token;
  delete cfg.user;
  await writeConfig(cfg);
}

export interface ResolvedConfig {
  apiUrl: string;
  webUrl: string;
  token?: string;
  appKey?: string;
  user?: StoredUser;
}

export async function resolveConfig(): Promise<ResolvedConfig> {
  const file = await readConfig();
  return {
    apiUrl: process.env.CRYPTOHOPPER_API_URL ?? file.apiUrl ?? DEFAULT_API_URL,
    webUrl: process.env.CRYPTOHOPPER_WEB_URL ?? file.webUrl ?? DEFAULT_WEB_URL,
    token: process.env.CRYPTOHOPPER_TOKEN ?? file.token,
    appKey: process.env.CRYPTOHOPPER_APP_KEY ?? file.appKey,
    user: process.env.CRYPTOHOPPER_TOKEN ? undefined : file.user,
  };
}

export async function persistLogin(input: {
  apiUrl: string;
  token: string;
  appKey?: string;
  user: StoredUser;
}): Promise<void> {
  const cfg = await readConfig();
  cfg.apiUrl = input.apiUrl;
  cfg.token = input.token;
  if (input.appKey) cfg.appKey = input.appKey;
  cfg.user = input.user;
  await writeConfig(cfg);
}
