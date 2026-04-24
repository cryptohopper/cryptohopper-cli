import pc from "picocolors";

import { fail, getClient } from "../api.js";

interface CommonOpts {
  json?: boolean;
}

export async function signalsStatsCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const s = (await client.signals.stats()) as Record<string, unknown>;
    if (json) {
      console.log(JSON.stringify({ ok: true, stats: s }));
    } else {
      console.log(JSON.stringify(s, null, 2));
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function signalsPerformanceCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const p = (await client.signals.performance()) as Record<string, unknown>;
    if (json) {
      console.log(JSON.stringify({ ok: true, performance: p }));
    } else {
      console.log(JSON.stringify(p, null, 2));
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function signalsListCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const rows = (await client.signals.list()) as Array<Record<string, unknown>>;
    if (json) {
      console.log(JSON.stringify({ ok: true, signals: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No signals published."));
      return;
    }
    for (const s of rows) {
      const id = String(s["id"] ?? "—");
      const market = (s["market"] as string | undefined) ?? "?";
      const type = (s["type"] as string | undefined) ?? "?";
      const created = (s["created_at"] as string | undefined) ?? "";
      console.log(`${id.padEnd(10)} ${market.padEnd(16)} ${type.padEnd(8)} ${pc.dim(created)}`);
    }
  } catch (err) {
    return fail(err, json);
  }
}
