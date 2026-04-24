import pc from "picocolors";

import { fail, getClient } from "../api.js";
import { fmt, printTable } from "../ui/table.js";

interface CommonOpts {
  json?: boolean;
}

export async function aiCreditsCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const c = (await client.ai.getCredits()) as Record<string, unknown>;
    if (json) {
      console.log(JSON.stringify({ ok: true, credits: c }));
      return;
    }
    const balance = String(c["balance"] ?? c["credits"] ?? "?");
    console.log(`${pc.dim("AI credit balance: ")}${pc.bold(balance)}`);
  } catch (err) {
    return fail(err, json);
  }
}

export async function aiModelsCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const rows = (await client.ai.availableModels()) as Array<Record<string, unknown>>;
    if (json) {
      console.log(JSON.stringify({ ok: true, models: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No AI models available."));
      return;
    }
    printTable(
      ["Name", "Description"],
      rows.map((m) => [
        (m["name"] as string | undefined) ?? fmt(m["id"]),
        fmt(m["description"]),
      ]),
    );
  } catch (err) {
    return fail(err, json);
  }
}
