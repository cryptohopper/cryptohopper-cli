import pc from "picocolors";

import { fail, getClient } from "../api.js";

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
    for (const r of rows) {
      const id = String(r["id"] ?? "—");
      const type = String(r["type"] ?? "?");
      const amount = String(r["amount"] ?? "?");
      const price = String(r["price"] ?? r["rate"] ?? "?");
      console.log(`${id.padEnd(10)} ${type.padEnd(6)} ${amount.padEnd(12)} @ ${price}`);
    }
  } catch (err) {
    return fail(err, json);
  }
}
