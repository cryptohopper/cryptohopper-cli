import pc from "picocolors";

import { fail, getClient } from "../api.js";

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
    for (const m of rows) {
      const name = (m["name"] as string | undefined) ?? String(m["id"] ?? "?");
      const desc = (m["description"] as string | undefined) ?? "";
      console.log(`${pc.bold(name.padEnd(24))} ${pc.dim(desc)}`);
    }
  } catch (err) {
    return fail(err, json);
  }
}
