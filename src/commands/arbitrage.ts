import pc from "picocolors";

import { fail, getClient } from "../api.js";
import { fmt, printTable } from "../ui/table.js";

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
    printTable(
      ["ID", "Profit", "Markets", "Created"],
      rows.map((r) => [
        fmt(r["id"]),
        fmt(r["profit"]),
        fmt(r["markets"]),
        fmt(r["created_at"]),
      ]),
    );
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
