import pc from "picocolors";

import { fail, getClient } from "../api.js";

interface CommonOpts {
  json?: boolean;
}

export async function hoppersListCommand(
  opts: CommonOpts & { exchange?: string },
): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const rows = (await client.hoppers.list(
      opts.exchange ? { exchange: opts.exchange } : undefined,
    )) as Array<Record<string, unknown>>;
    if (json) {
      console.log(JSON.stringify({ ok: true, hoppers: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No hoppers found."));
      return;
    }
    for (const h of rows) {
      const id = String(h["id"] ?? "—");
      const name = (h["name"] as string | undefined) ?? "(unnamed)";
      const exchange = (h["exchange"] as string | undefined) ?? "";
      console.log(`${pc.bold(id.padEnd(8))}  ${name.padEnd(30)} ${pc.dim(exchange)}`);
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function hoppersGetCommand(
  hopperId: string,
  opts: CommonOpts,
): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const h = await client.hoppers.get(hopperId);
    if (json) {
      console.log(JSON.stringify({ ok: true, hopper: h }));
    } else {
      console.log(JSON.stringify(h, null, 2));
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function hoppersPanicCommand(
  hopperId: string,
  opts: CommonOpts & { yes?: boolean },
): Promise<void> {
  const json = opts.json ?? false;
  if (!opts.yes && !json) {
    console.error(
      pc.yellow(
        `Panic will market-sell every position on hopper ${hopperId}. ` +
          `Re-run with --yes to confirm.`,
      ),
    );
    process.exit(1);
  }
  const { client } = await getClient({ requireAuth: true });
  try {
    await client.hoppers.panic(hopperId);
    if (json) {
      console.log(JSON.stringify({ ok: true, hopperId }));
    } else {
      console.log(pc.green(`✓ Panic executed for hopper ${hopperId}`));
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function positionsCommand(
  hopperId: string,
  opts: CommonOpts,
): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const rows = (await client.hoppers.positions(hopperId)) as Array<Record<string, unknown>>;
    if (json) {
      console.log(JSON.stringify({ ok: true, positions: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No open positions."));
      return;
    }
    for (const p of rows) {
      const coin = (p["coin"] as string | undefined) ?? "?";
      const amount = String(p["amount"] ?? "?");
      const rate = String(p["rate"] ?? p["price"] ?? "?");
      console.log(`${pc.bold(coin.padEnd(8))}  ${amount.padEnd(16)} @ ${rate}`);
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function ordersCommand(
  hopperId: string,
  opts: CommonOpts,
): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const rows = (await client.hoppers.orders(hopperId)) as Array<Record<string, unknown>>;
    if (json) {
      console.log(JSON.stringify({ ok: true, orders: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No orders."));
      return;
    }
    for (const o of rows) {
      const id = String(o["id"] ?? "—");
      const type = String(o["type"] ?? "?");
      const market = (o["market"] as string | undefined) ?? "?";
      const amount = String(o["amount"] ?? "?");
      console.log(`${id.padEnd(10)} ${type.padEnd(6)} ${market.padEnd(16)} ${amount}`);
    }
  } catch (err) {
    return fail(err, json);
  }
}
