import Table from "cli-table3";
import pc from "picocolors";

export type Cell = string | undefined | null;

/**
 * Render a simple, unicode-bordered table with bold headers. Empty string
 * for nullish cells so the layout doesn't shift.
 */
export function printTable(headers: string[], rows: Cell[][]): void {
  if (rows.length === 0) return;
  const table = new Table({
    head: headers.map((h) => pc.bold(h)),
    style: { head: [], border: [] },
  });
  for (const row of rows) {
    table.push(row.map((c) => c ?? ""));
  }
  console.log(table.toString());
}

/** Coerce an arbitrary value to a display string. Numbers, bools, strings pass through; objects/arrays get JSON-stringified compactly. */
export function fmt(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}
