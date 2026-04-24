import pc from "picocolors";

import { fail, getClient } from "../api.js";

export interface TickerOptions {
  json?: boolean;
}

export async function tickerCommand(
  exchange: string,
  market: string,
  opts: TickerOptions,
): Promise<void> {
  const json = opts.json ?? false;
  // Ticker is public — no auth required, but we still build the client.
  const { client } = await getClient();
  try {
    const t = (await client.exchange.ticker({ exchange, market })) as Record<string, unknown>;
    if (json) {
      console.log(JSON.stringify({ ok: true, ticker: t }));
      return;
    }
    const last = String(t["last"] ?? t["close"] ?? "?");
    const bid = String(t["bid"] ?? "?");
    const ask = String(t["ask"] ?? "?");
    const vol = String(t["volume"] ?? "?");
    console.log(`${pc.bold(market)} on ${pc.dim(exchange)}`);
    console.log(`  last   ${pc.bold(last)}`);
    console.log(`  bid    ${bid}`);
    console.log(`  ask    ${ask}`);
    console.log(`  volume ${vol}`);
  } catch (err) {
    return fail(err, json);
  }
}
