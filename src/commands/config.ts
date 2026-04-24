import pc from "picocolors";

import { readConfig, writeConfig, type ConfigFile } from "../config.js";

interface CommonOpts {
  json?: boolean;
}

const SETTABLE_KEYS = ["apiUrl", "appKey"] as const;
type SettableKey = (typeof SETTABLE_KEYS)[number];

export async function configGetCommand(
  key: string | undefined,
  opts: CommonOpts,
): Promise<void> {
  const cfg = await readConfig();
  const redacted = redact(cfg);
  if (key) {
    const val = redacted[key as keyof ConfigFile];
    if (opts.json) {
      console.log(JSON.stringify({ ok: true, [key]: val ?? null }));
    } else {
      console.log(val ?? pc.dim("(unset)"));
    }
    return;
  }
  if (opts.json) {
    console.log(JSON.stringify({ ok: true, config: redacted }));
  } else {
    for (const [k, v] of Object.entries(redacted)) {
      console.log(`${pc.dim(k + ":").padEnd(12)} ${v ?? pc.dim("(unset)")}`);
    }
  }
}

export async function configSetCommand(
  key: string,
  value: string,
  opts: CommonOpts,
): Promise<void> {
  if (!SETTABLE_KEYS.includes(key as SettableKey)) {
    console.error(
      pc.red(`Not a settable key: ${key}. Settable: ${SETTABLE_KEYS.join(", ")}.`),
    );
    process.exit(1);
  }
  const cfg = await readConfig();
  (cfg as Record<string, unknown>)[key] = value;
  await writeConfig(cfg);
  if (opts.json) {
    console.log(JSON.stringify({ ok: true, key, value }));
  } else {
    console.log(pc.green(`✓ ${key} = ${value}`));
  }
}

function redact(cfg: ConfigFile): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {
    apiUrl: cfg.apiUrl,
    appKey: cfg.appKey,
    token: cfg.token ? `${cfg.token.slice(0, 4)}…${cfg.token.slice(-4)}` : undefined,
    user: cfg.user
      ? cfg.user.email ?? cfg.user.username ?? String(cfg.user.id ?? "")
      : undefined,
  };
  return out;
}
