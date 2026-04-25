import pc from "picocolors";

import { fail, getClient } from "../api.js";
import { fmt, printTable } from "../ui/table.js";

interface CommonOpts {
  json?: boolean;
}

export async function exchangeExchangesCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  // Public endpoint — no auth required.
  const { client } = await getClient();
  try {
    const rows = (await client.exchange.exchanges()) as Array<Record<string, unknown>>;
    if (json) {
      console.log(JSON.stringify({ ok: true, exchanges: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No exchanges available."));
      return;
    }
    printTable(
      ["Name", "Active"],
      rows.map((e) => [
        fmt(e["name"] ?? e["id"] ?? e["slug"]),
        fmt(e["active"] ?? e["enabled"]),
      ]),
    );
  } catch (err) {
    return fail(err, json);
  }
}

export async function exchangeMarketsCommand(
  exchange: string,
  opts: CommonOpts,
): Promise<void> {
  const json = opts.json ?? false;
  // Public endpoint — no auth required.
  const { client } = await getClient();
  try {
    const rows = (await client.exchange.markets(exchange)) as Array<Record<string, unknown>>;
    if (json) {
      console.log(JSON.stringify({ ok: true, markets: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim(`No markets reported for ${exchange}.`));
      return;
    }
    printTable(
      ["Market", "Base", "Quote"],
      rows.map((m) => [
        fmt(m["market"] ?? m["symbol"] ?? m["pair"]),
        fmt(m["base"] ?? m["base_currency"]),
        fmt(m["quote"] ?? m["quote_currency"]),
      ]),
    );
  } catch (err) {
    return fail(err, json);
  }
}
