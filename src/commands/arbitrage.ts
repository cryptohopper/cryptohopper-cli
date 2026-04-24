import pc from "picocolors";

import { fail, getClient } from "../api.js";

interface CommonOpts {
  json?: boolean;
}

export async function arbitrageHistoryCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const rows = (await client.arbitrage.exchangeHistory()) as Array<Record<string, unknown>>;
    if (json) {
      console.log(JSON.stringify({ ok: true, history: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No arbitrage history."));
      return;
    }
    for (const r of rows) {
      const id = String(r["id"] ?? "—");
      const profit = String(r["profit"] ?? "?");
      const markets = (r["markets"] as string | undefined) ?? "";
      const created = (r["created_at"] as string | undefined) ?? "";
      console.log(`${id.padEnd(10)} ${profit.padEnd(12)} ${markets.padEnd(24)} ${pc.dim(created)}`);
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function arbitrageTotalCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const t = (await client.arbitrage.exchangeTotal()) as Record<string, unknown>;
    if (json) {
      console.log(JSON.stringify({ ok: true, total: t }));
    } else {
      console.log(JSON.stringify(t, null, 2));
    }
  } catch (err) {
    return fail(err, json);
  }
}
