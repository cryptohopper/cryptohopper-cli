import pc from "picocolors";

import { fail, getClient } from "../api.js";
import { fmt, printTable } from "../ui/table.js";

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
    printTable(
      ["ID", "Name", "Exchange", "Enabled"],
      rows.map((h) => [
        fmt(h["id"]),
        (h["name"] as string | undefined) ?? "(unnamed)",
        fmt(h["exchange"]),
        fmt(h["enabled"]),
      ]),
    );
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
    printTable(
      ["Coin", "Amount", "Rate", "Current value"],
      rows.map((p) => [
        fmt(p["coin"]),
        fmt(p["amount"]),
        fmt(p["rate"] ?? p["price"]),
        fmt(p["current_value"] ?? p["result_bought"]),
      ]),
    );
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
    printTable(
      ["ID", "Type", "Market", "Amount", "Price"],
      rows.map((o) => [
        fmt(o["id"]),
        fmt(o["type"]),
        fmt(o["market"]),
        fmt(o["amount"]),
        fmt(o["price"]),
      ]),
    );
  } catch (err) {
    return fail(err, json);
  }
}
