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
import {
  signalsListCommand,
  signalsStatsCommand,
  signalsPerformanceCommand,
} from "./commands/signals.js";
import {
  arbitrageHistoryCommand,
  arbitrageTotalCommand,
} from "./commands/arbitrage.js";
import {
  marketmakerGetCommand,
  marketmakerHistoryCommand,
} from "./commands/marketmaker.js";
import {
  templateListCommand,
  templateGetCommand,
  templateLoadCommand,
  templateDeleteCommand,
} from "./commands/template.js";
import {
  aiCreditsCommand,
  aiModelsCommand,
} from "./commands/ai.js";
import {
  subscriptionGetCommand,
  subscriptionPlansCommand,
  subscriptionCreditsCommand,
} from "./commands/subscription.js";
import {
  tournamentsListCommand,
  tournamentsActiveCommand,
  tournamentsLeaderboardCommand,
} from "./commands/tournaments.js";
import {
  strategyListCommand,
  strategyGetCommand,
} from "./commands/strategy.js";
import {
  exchangeExchangesCommand,
  exchangeMarketsCommand,
} from "./commands/exchange.js";
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

// ─── Signals (provider analytics) ────────────────────────────────────────

const signals = program
  .command("signals")
  .description("Signal-provider analytics (for signal publishers)");

signals
  .command("list")
  .alias("ls")
  .description("List signals this provider has published")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await signalsListCommand({ json: !!opts.json });
  });

signals
  .command("stats")
  .description("Overall provider stats (subscribers, total PnL, etc.)")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await signalsStatsCommand({ json: !!opts.json });
  });

signals
  .command("performance")
  .description("Performance stats (winrate, avg profit per signal, etc.)")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await signalsPerformanceCommand({ json: !!opts.json });
  });

// ─── Arbitrage ───────────────────────────────────────────────────────────

const arbitrage = program
  .command("arbitrage")
  .description("Exchange arbitrage — read-only helpers");

arbitrage
  .command("history")
  .description("List past exchange-arbitrage runs")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await arbitrageHistoryCommand({ json: !!opts.json });
  });

arbitrage
  .command("total")
  .description("Running totals across exchange-arbitrage runs")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await arbitrageTotalCommand({ json: !!opts.json });
  });

// ─── Market Maker ────────────────────────────────────────────────────────

const marketmaker = program
  .command("marketmaker")
  .description("Market-maker bot inspection");

marketmaker
  .command("get <hopper-id>")
  .description("Fetch the market-maker state for a hopper")
  .option("--json", "Emit machine-readable JSON")
  .action(async (hopperId: string, opts) => {
    await marketmakerGetCommand(hopperId, { json: !!opts.json });
  });

marketmaker
  .command("history <hopper-id>")
  .description("Historical order activity for a market-maker hopper")
  .option("--json", "Emit machine-readable JSON")
  .action(async (hopperId: string, opts) => {
    await marketmakerHistoryCommand(hopperId, { json: !!opts.json });
  });

// ─── Templates ───────────────────────────────────────────────────────────

const template = program
  .command("template")
  .description("Bot templates (reusable hopper configurations)");

template
  .command("list")
  .alias("ls")
  .description("List all templates available to you")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await templateListCommand({ json: !!opts.json });
  });

template
  .command("get <id>")
  .description("Fetch a single template (full config)")
  .option("--json", "Emit machine-readable JSON")
  .action(async (id: string, opts) => {
    await templateGetCommand(id, { json: !!opts.json });
  });

template
  .command("load <template-id> <hopper-id>")
  .description("Apply a template to a hopper — overwrites the hopper's config")
  .option("--yes", "Acknowledge the overwrite")
  .option("--json", "Emit machine-readable JSON")
  .action(async (templateId: string, hopperId: string, opts) => {
    await templateLoadCommand(templateId, hopperId, {
      yes: !!opts.yes,
      json: !!opts.json,
    });
  });

template
  .command("delete <id>")
  .description("Delete a template")
  .option("--yes", "Acknowledge the destructive action")
  .option("--json", "Emit machine-readable JSON")
  .action(async (id: string, opts) => {
    await templateDeleteCommand(id, { yes: !!opts.yes, json: !!opts.json });
  });

// ─── AI ──────────────────────────────────────────────────────────────────

const ai = program.command("ai").description("AI assistant features");

ai.command("credits")
  .description("Remaining AI credit balance")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await aiCreditsCommand({ json: !!opts.json });
  });

ai.command("models")
  .description("LLM models available to the authenticated user")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await aiModelsCommand({ json: !!opts.json });
  });

// ─── Subscription ────────────────────────────────────────────────────────

const subscription = program
  .command("subscription")
  .description("Subscription plans, account state, and platform credits");

subscription
  .command("get")
  .description("Account-level subscription state")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await subscriptionGetCommand({ json: !!opts.json });
  });

subscription
  .command("plans")
  .description("List available subscription plans (public)")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await subscriptionPlansCommand({ json: !!opts.json });
  });

subscription
  .command("credits")
  .description("Remaining platform credits on the account")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await subscriptionCreditsCommand({ json: !!opts.json });
  });

// ─── Tournaments ─────────────────────────────────────────────────────────

const tournaments = program
  .command("tournaments")
  .description("Trading competitions");

tournaments
  .command("list")
  .alias("ls")
  .description("List all tournaments")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await tournamentsListCommand({ json: !!opts.json });
  });

tournaments
  .command("active")
  .description("List currently-active tournaments (public)")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await tournamentsActiveCommand({ json: !!opts.json });
  });

tournaments
  .command("leaderboard <tournament-id>")
  .description("Leaderboard for a specific tournament")
  .option("--json", "Emit machine-readable JSON")
  .action(async (tournamentId: string, opts) => {
    await tournamentsLeaderboardCommand(tournamentId, { json: !!opts.json });
  });

// ─── Strategies ──────────────────────────────────────────────────────────

const strategy = program
  .command("strategy")
  .description("User-defined trading strategies");

strategy
  .command("list")
  .alias("ls")
  .description("List all your strategies")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await strategyListCommand({ json: !!opts.json });
  });

strategy
  .command("get <id>")
  .description("Fetch a single strategy (full config)")
  .option("--json", "Emit machine-readable JSON")
  .action(async (id: string, opts) => {
    await strategyGetCommand(id, { json: !!opts.json });
  });

// ─── Exchange catalog ────────────────────────────────────────────────────

const exchange = program
  .command("exchange")
  .description("Public exchange catalog (no auth required)");

exchange
  .command("list")
  .alias("ls")
  .description("List supported exchanges")
  .option("--json", "Emit machine-readable JSON")
  .action(async (opts) => {
    await exchangeExchangesCommand({ json: !!opts.json });
  });

exchange
  .command("markets <exchange>")
  .description("List trading pairs available on an exchange")
  .option("--json", "Emit machine-readable JSON")
  .action(async (exchangeName: string, opts) => {
    await exchangeMarketsCommand(exchangeName, { json: !!opts.json });
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
