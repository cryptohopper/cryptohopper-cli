/**
 * Atomic-ish in-place binary replacement. Uses the .old / .new dance so it
 * works on Windows too (you can rename a running .exe but you can't replace
 * its contents while it's open).
 */

import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

export async function downloadToFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  await pipeline(
    Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]),
    createWriteStream(destPath, { mode: 0o755 }),
  );
}

export async function sha256OfFile(filePath: string): Promise<string> {
  const hash = crypto.createHash("sha256");
  const fd = await fs.open(filePath, "r");
  try {
    const stream = fd.createReadStream();
    for await (const chunk of stream) hash.update(chunk);
  } finally {
    await fd.close();
  }
  return hash.digest("hex");
}

export function findHashFor(sumsText: string, assetName: string): string | null {
  for (const line of sumsText.split(/\r?\n/)) {
    const [hash, ...rest] = line.trim().split(/\s+/);
    if (!hash || rest.length === 0) continue;
    const name = rest.join(" ").replace(/^\*/, "");
    if (name === assetName) return hash.toLowerCase();
  }
  return null;
}

export async function swapInPlace(currentPath: string, newPath: string): Promise<void> {
  const oldPath = currentPath + ".old";
  try {
    await fs.unlink(oldPath);
  } catch {
    /* may not exist — fine */
  }
  await fs.rename(currentPath, oldPath);
  try {
    await fs.rename(newPath, currentPath);
  } catch (err) {
    await fs.rename(oldPath, currentPath).catch(() => {});
    throw err;
  }
  await fs.unlink(oldPath).catch(() => {});
}

/**
 * Called once at launch — silently removes a stale .old from a prior upgrade.
 */
export async function cleanupStaleOld(): Promise<void> {
  try {
    const exec = process.execPath;
    const dir = path.dirname(exec);
    const base = path.basename(exec);
    const stale = path.join(dir, `${base}.old`);
    await fs.unlink(stale);
  } catch {
    /* nothing to clean */
  }
}
