import pc from "picocolors";

import { fail, getClient } from "../api.js";
import { fmt, printTable } from "../ui/table.js";

interface CommonOpts {
  json?: boolean;
}

export async function marketmakerGetCommand(
  hopperId: string,
  opts: CommonOpts,
): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const m = (await client.marketmaker.get({ hopper_id: hopperId })) as Record<string, unknown>;
    if (json) {
      console.log(JSON.stringify({ ok: true, marketmaker: m }));
    } else {
      console.log(JSON.stringify(m, null, 2));
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function marketmakerHistoryCommand(
  hopperId: string,
  opts: CommonOpts,
): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const rows = (await client.marketmaker.history({ hopper_id: hopperId })) as Array<Record<string, unknown>>;
    if (json) {
      console.log(JSON.stringify({ ok: true, history: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No history."));
      return;
    }
    printTable(
      ["ID", "Type", "Amount", "Price"],
      rows.map((r) => [
        fmt(r["id"]),
        fmt(r["type"]),
        fmt(r["amount"]),
        fmt(r["price"] ?? r["rate"]),
      ]),
    );
  } catch (err) {
    return fail(err, json);
  }
}
