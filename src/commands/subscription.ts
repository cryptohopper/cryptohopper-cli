import pc from "picocolors";

import { fail, getClient } from "../api.js";
import { fmt, printTable } from "../ui/table.js";

interface CommonOpts {
  json?: boolean;
}

export async function subscriptionGetCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const s = (await client.subscription.get()) as Record<string, unknown>;
    if (json) {
      console.log(JSON.stringify({ ok: true, subscription: s }));
    } else {
      console.log(JSON.stringify(s, null, 2));
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function subscriptionPlansCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient();
  try {
    const rows = (await client.subscription.plans()) as Array<Record<string, unknown>>;
    if (json) {
      console.log(JSON.stringify({ ok: true, plans: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No plans available."));
      return;
    }
    printTable(
      ["ID", "Name", "Price", "Interval"],
      rows.map((p) => [
        fmt(p["id"]),
        (p["name"] as string | undefined) ?? "(unnamed)",
        fmt(p["price"] ?? p["amount"]),
        fmt(p["interval"]),
      ]),
    );
  } catch (err) {
    return fail(err, json);
  }
}

export async function subscriptionCreditsCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const c = (await client.subscription.getCredits()) as Record<string, unknown>;
    if (json) {
      console.log(JSON.stringify({ ok: true, credits: c }));
      return;
    }
    const balance = String(c["balance"] ?? c["credits"] ?? "?");
    console.log(`${pc.dim("Platform credits: ")}${pc.bold(balance)}`);
  } catch (err) {
    return fail(err, json);
  }
}
