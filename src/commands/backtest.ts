import pc from "picocolors";

import { fail, getClient } from "../api.js";

interface CommonOpts {
  json?: boolean;
}

export async function backtestNewCommand(
  hopperId: string,
  opts: CommonOpts & { from?: string; to?: string },
): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  const body: Record<string, unknown> = { hopper_id: hopperId };
  if (opts.from) body["from_date"] = opts.from;
  if (opts.to) body["to_date"] = opts.to;
  try {
    const b = (await client.backtest.create(body)) as Record<string, unknown>;
    if (json) {
      console.log(JSON.stringify({ ok: true, backtest: b }));
    } else {
      console.log(pc.green(`✓ Backtest created: id=${pc.bold(String(b["id"] ?? "?"))}`));
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function backtestStatusCommand(
  backtestId: string,
  opts: CommonOpts,
): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const b = (await client.backtest.get(backtestId)) as Record<string, unknown>;
    if (json) {
      console.log(JSON.stringify({ ok: true, backtest: b }));
    } else {
      console.log(JSON.stringify(b, null, 2));
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function backtestLimitsCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const l = (await client.backtest.limits()) as Record<string, unknown>;
    if (json) {
      console.log(JSON.stringify({ ok: true, limits: l }));
    } else {
      console.log(`${pc.dim("Remaining: ")}${String(l["remaining"] ?? "?")}`);
      console.log(`${pc.dim("Limit:     ")}${String(l["limit"] ?? "?")}`);
    }
  } catch (err) {
    return fail(err, json);
  }
}
