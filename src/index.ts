import { Command } from "commander";

import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { whoamiCommand } from "./commands/whoami.js";
import {
  hoppersListCommand,
  hoppersGetCommand,
  hoppersPanicCommand,
  positionsCommand,
  ordersCommand,
} from "./commands/hoppers.js";
import { tickerCommand } from "./commands/ticker.js";
import {
  backtestNewCommand,
  backtestStatusCommand,
  backtestLimitsCommand,
} from "./commands/backtest.js";
import { upgradeCommand } from "./commands/upgrade.js";
import { configGetCommand, configSetCommand } from "./commands/config.js";
import { completionCommand } from "./commands/completion.js";
import { cleanupStaleOld } from "./upgrade/swap.js";
import { CURRENT_VERSION } from "./version.js";

// Best-effort cleanup of the stale `.old` binary left over by the last
// in-place upgrade. Fire-and-forget.
cleanupStaleOld().catch(() => {});

const program = new Command();

program
  .name("cryptohopper")
  .description("Command-line interface for Cryptohopper")
  .version(CURRENT_VERSION);

// ─── Auth ────────────────────────────────────────────────────────────────

program
  .command("login")
  .description(
    "Authenticate against Cryptohopper via a browser-based OAuth consent flow",
  )
  .option(
    "--token <token>",
    "Skip the browser flow and use a pre-obtained bearer token (for CI / SSH)",
  )
  .option(
    "--app-key <clientId>",
    "Override the OAuth client_id sent as x-api-app-key on every request",
  )
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await loginCommand({
      token: opts.token,
      appKey: opts.appKey,
      json: !!opts.json,
    });
  });

program
  .command("logout")
  .description("Clear the locally-stored token")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await logoutCommand({ json: !!opts.json });
  });

program
  .command("whoami")
  .description("Show the authenticated user")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await whoamiCommand({ json: !!opts.json });
  });

// ─── Hoppers ─────────────────────────────────────────────────────────────

const hoppers = program
  .command("hoppers")
  .description("Manage your trading bots");

hoppers
  .command("list")
  .alias("ls")
  .description("List your hoppers")
  .option("--exchange <exchange>", "Filter by exchange")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await hoppersListCommand({
      exchange: opts.exchange,
      json: !!opts.json,
    });
  });

hoppers
  .command("get <id>")
  .description("Fetch a single hopper")
  .option("--json", "Emit machine-readable JSON")
  .action(async (id: string, opts) => {
    await hoppersGetCommand(id, { json: !!opts.json });
  });

hoppers
  .command("panic <id>")
  .description("Panic-sell every position on a hopper. Requires --yes.")
  .option("--yes", "Acknowledge the destructive action")
  .option("--json", "Emit machine-readable JSON")
  .action(async (id: string, opts) => {
    await hoppersPanicCommand(id, { yes: !!opts.yes, json: !!opts.json });
  });

// Convenience top-level forms — matching other trading CLIs.
program
  .command("positions <hopper-id>")
  .description("List open positions on a hopper")
  .option("--json", "Emit machine-readable JSON")
  .action(async (hopperId: string, opts) => {
    await positionsCommand(hopperId, { json: !!opts.json });
  });

program
  .command("orders <hopper-id>")
  .description("List recent orders on a hopper")
  .option("--json", "Emit machine-readable JSON")
  .action(async (hopperId: string, opts) => {
    await ordersCommand(hopperId, { json: !!opts.json });
  });

// ─── Exchange ────────────────────────────────────────────────────────────

program
  .command("ticker <exchange> <market>")
  .description("Fetch the current ticker for a market (public; no auth required)")
  .option("--json", "Emit machine-readable JSON")
  .action(async (exchange: string, market: string, opts) => {
    await tickerCommand(exchange, market, { json: !!opts.json });
  });

// ─── Backtest ────────────────────────────────────────────────────────────

const backtest = program
  .command("backtest")
  .description("Manage backtests");

backtest
  .command("new <hopper-id>")
  .description("Start a new backtest for a hopper")
  .option("--from <date>", "Start date (YYYY-MM-DD)")
  .option("--to <date>", "End date (YYYY-MM-DD)")
  .option("--json", "Emit machine-readable JSON")
  .action(async (hopperId: string, opts) => {
    await backtestNewCommand(hopperId, {
      from: opts.from,
      to: opts.to,
      json: !!opts.json,
    });
  });

backtest
  .command("status <backtest-id>")
  .description("Fetch a backtest's status and results")
  .option("--json", "Emit machine-readable JSON")
  .action(async (backtestId: string, opts) => {
    await backtestStatusCommand(backtestId, { json: !!opts.json });
  });

backtest
  .command("limits")
  .description("Show your current backtest quota")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await backtestLimitsCommand({ json: !!opts.json });
  });

// ─── Upgrade ─────────────────────────────────────────────────────────────

program
  .command("upgrade")
  .description("Replace the cryptohopper binary with the latest GitHub Release")
  .option("--check", "Only check for an update; do not install")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await upgradeCommand({ check: !!opts.check, json: !!opts.json });
  });

// ─── Config ──────────────────────────────────────────────────────────────

const config = program
  .command("config")
  .description("Show or set local CLI settings");

config
  .command("get [key]")
  .description("Print the current config (or one key)")
  .option("--json", "Emit machine-readable JSON")
  .action(async (key: string | undefined, opts) => {
    await configGetCommand(key, { json: !!opts.json });
  });

config
  .command("set <key> <value>")
  .description("Set a config value. Settable: apiUrl, webUrl, appKey")
  .option("--json", "Emit machine-readable JSON")
  .action(async (key: string, value: string, opts) => {
    await configSetCommand(key, value, { json: !!opts.json });
  });

// ─── Completion ──────────────────────────────────────────────────────────

program
  .command("completion <shell>")
  .description("Print shell completion script for bash | zsh | fish | powershell")
  .action((shell: string) => {
    completionCommand(shell);
  });

(async () => {
  let exitCode = 0;
  try {
    await program.parseAsync(process.argv);
    const raw = process.exitCode;
    exitCode = typeof raw === "number" ? raw : raw === undefined ? 0 : Number(raw) || 0;
  } catch (err) {
    const code = (err as { exitCode?: number }).exitCode;
    if (typeof code === "number") {
      exitCode = code;
    } else {
      console.error(err instanceof Error ? err.message : String(err));
      exitCode = 1;
    }
  }
  process.exit(exitCode);
})();
