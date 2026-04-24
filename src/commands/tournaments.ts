import pc from "picocolors";

import { fail, getClient } from "../api.js";

interface CommonOpts {
  json?: boolean;
}

export async function tournamentsListCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const rows = (await client.tournaments.list()) as Array<Record<string, unknown>>;
    if (json) {
      console.log(JSON.stringify({ ok: true, tournaments: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No tournaments."));
      return;
    }
    for (const t of rows) {
      const id = String(t["id"] ?? "—");
      const name = (t["name"] as string | undefined) ?? "(unnamed)";
      const status = (t["status"] as string | undefined) ?? "";
      console.log(`${pc.bold(id.padEnd(8))} ${name.padEnd(28)} ${pc.dim(status)}`);
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function tournamentsActiveCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient();
  try {
    const rows = (await client.tournaments.active()) as Array<Record<string, unknown>>;
    if (json) {
      console.log(JSON.stringify({ ok: true, tournaments: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No active tournaments."));
      return;
    }
    for (const t of rows) {
      const id = String(t["id"] ?? "—");
      const name = (t["name"] as string | undefined) ?? "(unnamed)";
      const ends = (t["ends_at"] as string | undefined) ?? "";
      console.log(`${pc.bold(id.padEnd(8))} ${name.padEnd(28)} ${pc.dim(ends)}`);
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function tournamentsLeaderboardCommand(
  tournamentId: string,
  opts: CommonOpts,
): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const rows = (await client.tournaments.tournamentLeaderboard(tournamentId)) as Array<
      Record<string, unknown>
    >;
    if (json) {
      console.log(JSON.stringify({ ok: true, leaderboard: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No leaderboard entries yet."));
      return;
    }
    rows.forEach((e, i) => {
      const rank = String(e["rank"] ?? i + 1);
      const alias = (e["alias"] as string | undefined) ?? "?";
      const profit = String(e["profit"] ?? e["score"] ?? "?");
      console.log(`${rank.padStart(4)}  ${alias.padEnd(20)} ${pc.bold(profit)}`);
    });
  } catch (err) {
    return fail(err, json);
  }
}
