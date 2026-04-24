import path from "node:path";

export type RuntimeMode = "compiled" | "node-script" | "unknown";

export function detectRuntime(): RuntimeMode {
  const argv0 = process.argv[0] ?? "";
  const exec = process.execPath;
  const base = path.basename(exec).toLowerCase();
  if (base === "node" || base === "node.exe" || base === "bun" || base === "bun.exe") {
    return "node-script";
  }
  if (argv0 && argv0 === exec) return "compiled";
  return "unknown";
}

export function runningBinaryPath(): string {
  return process.execPath;
}

/** The asset name produced by .github/workflows/cli-release.yml for the current platform. */
export function platformAsset(): string {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === "darwin" && arch === "arm64") return "cryptohopper-darwin-arm64";
  if (platform === "darwin" && arch === "x64") return "cryptohopper-darwin-x64";
  if (platform === "linux" && arch === "x64") return "cryptohopper-linux-x64";
  if (platform === "win32" && arch === "x64") return "cryptohopper-windows-x64.exe";
  return "";
}
