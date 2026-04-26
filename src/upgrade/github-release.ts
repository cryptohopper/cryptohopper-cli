/**
 * Talk to the GitHub Releases API to find the latest cli-v* release.
 */

import { RELEASE_REPO } from "../version.js";

const GITHUB_API_BASE = "https://api.github.com";

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface Release {
  tag_name: string;
  name: string;
  prerelease: boolean;
  draft: boolean;
  assets: ReleaseAsset[];
}

export async function fetchLatestRelease(repo: string = RELEASE_REPO): Promise<Release | null> {
  const res = await fetch(
    `${GITHUB_API_BASE}/repos/${repo}/releases?per_page=30`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "cryptohopper-cli",
      },
    },
  );

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(
      `GitHub API returned ${res.status} (${res.statusText}). Check repo path "${repo}".`,
    );
  }

  const all = (await res.json()) as Release[];
  const cliReleases = all.filter((r) => !r.draft && r.tag_name.startsWith("cli-v"));
  if (cliReleases.length === 0) return null;
  // Sort by version (highest first). GitHub returns releases by created_at,
  // so a hot-fix on an older minor that's published *after* a newer release
  // would otherwise appear at index 0 and trick `upgrade` into doing nothing
  // (or downgrading).
  cliReleases.sort((a, b) => compareVersions(b.tag_name, a.tag_name));
  return cliReleases[0]!;
}

export function versionFromTag(tag: string): string {
  return tag.replace(/^cli-v/, "");
}

/** Returns negative if a is older than b. SemVer 2.0.0 precedence rules. */
export function compareVersions(a: string, b: string): number {
  const aRel = versionFromTag(a);
  const bRel = versionFromTag(b);
  const [aCore, aPre] = splitVersion(aRel);
  const [bCore, bPre] = splitVersion(bRel);

  for (let i = 0; i < 3; i++) {
    const ai = aCore[i] ?? 0;
    const bi = bCore[i] ?? 0;
    if (ai !== bi) return ai - bi;
  }
  if (aPre && !bPre) return -1;
  if (!aPre && bPre) return 1;
  if (!aPre && !bPre) return 0;
  return comparePrerelease(aPre!, bPre!);
}

function splitVersion(v: string): [number[], string | null] {
  const [core, pre] = v.split("-", 2);
  const parts = (core ?? "0.0.0").split(".").map((n) => Number(n)).map((n) => (Number.isFinite(n) ? n : 0));
  return [parts, pre ?? null];
}

/**
 * Compare two SemVer prerelease strings (the part after the `-`) per the
 * SemVer 2.0.0 precedence rules:
 *   - Identifiers consisting of only digits are compared numerically.
 *   - Identifiers with letters or hyphens are compared lexically in ASCII.
 *   - Numeric identifiers always have lower precedence than non-numeric.
 *   - A larger set of fields has higher precedence than a smaller one.
 *
 * Crucially, this means `alpha.10` > `alpha.2` (numeric compare on the
 * second identifier), which a naive `String#localeCompare` gets wrong.
 */
function comparePrerelease(a: string, b: string): number {
  const aIds = a.split(".");
  const bIds = b.split(".");
  const max = Math.max(aIds.length, bIds.length);
  for (let i = 0; i < max; i++) {
    const ai = aIds[i];
    const bi = bIds[i];
    if (ai === undefined) return -1;
    if (bi === undefined) return 1;
    const aNum = /^\d+$/.test(ai);
    const bNum = /^\d+$/.test(bi);
    if (aNum && bNum) {
      const d = Number(ai) - Number(bi);
      if (d !== 0) return d;
    } else if (aNum) {
      return -1;
    } else if (bNum) {
      return 1;
    } else {
      const d = ai.localeCompare(bi);
      if (d !== 0) return d;
    }
  }
  return 0;
}
