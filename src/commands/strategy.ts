import pc from "picocolors";

import { fail, getClient } from "../api.js";
import { fmt, printTable } from "../ui/table.js";

interface CommonOpts {
  json?: boolean;
}

export async function strategyListCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const rows = (await client.strategy.list()) as Array<Record<string, unknown>>;
    if (json) {
      console.log(JSON.stringify({ ok: true, strategies: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No strategies."));
      return;
    }
    printTable(
      ["ID", "Name", "Description"],
      rows.map((s) => [
        fmt(s["id"]),
        (s["name"] as string | undefined) ?? "(unnamed)",
        fmt(s["description"]),
      ]),
    );
  } catch (err) {
    return fail(err, json);
  }
}

export async function strategyGetCommand(
  strategyId: string,
  opts: CommonOpts,
): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const s = await client.strategy.get(strategyId);
    if (json) {
      console.log(JSON.stringify({ ok: true, strategy: s }));
    } else {
      console.log(JSON.stringify(s, null, 2));
    }
  } catch (err) {
    return fail(err, json);
  }
}
