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
  return cliReleases[0]!;
}

export function versionFromTag(tag: string): string {
  return tag.replace(/^cli-v/, "");
}

/** Returns negative if a is older than b. Small-but-deterministic semver. */
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
  return aPre!.localeCompare(bPre!);
}

function splitVersion(v: string): [number[], string | null] {
  const [core, pre] = v.split("-", 2);
  const parts = (core ?? "0.0.0").split(".").map((n) => Number(n)).map((n) => (Number.isFinite(n) ? n : 0));
  return [parts, pre ?? null];
}
