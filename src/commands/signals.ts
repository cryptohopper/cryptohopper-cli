import pc from "picocolors";

import { fail, getClient } from "../api.js";
import { fmt, printTable } from "../ui/table.js";

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
    printTable(
      ["ID", "Market", "Type", "Created"],
      rows.map((s) => [
        fmt(s["id"]),
        fmt(s["market"]),
        fmt(s["type"]),
        fmt(s["created_at"]),
      ]),
    );
  } catch (err) {
    return fail(err, json);
  }
}
