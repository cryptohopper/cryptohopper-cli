import pc from "picocolors";

import { fail, getClient } from "../api.js";
import { fmt, printTable } from "../ui/table.js";

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
    printTable(
      ["ID", "Name", "Status", "Starts", "Ends"],
      rows.map((t) => [
        fmt(t["id"]),
        (t["name"] as string | undefined) ?? "(unnamed)",
        fmt(t["status"]),
        fmt(t["starts_at"]),
        fmt(t["ends_at"]),
      ]),
    );
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
    printTable(
      ["ID", "Name", "Ends"],
      rows.map((t) => [
        fmt(t["id"]),
        (t["name"] as string | undefined) ?? "(unnamed)",
        fmt(t["ends_at"]),
      ]),
    );
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
    printTable(
      ["Rank", "Alias", "Profit"],
      rows.map((e, i) => [
        fmt(e["rank"] ?? i + 1),
        fmt(e["alias"]),
        fmt(e["profit"] ?? e["score"]),
      ]),
    );
  } catch (err) {
    return fail(err, json);
  }
}
