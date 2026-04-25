# Changelog

## 0.6.0-alpha.1 — 2026-04-25

### Added

- **`cryptohopper strategy list`** (alias `ls`) — list all your saved trading strategies in a table.
- **`cryptohopper strategy get <id>`** — pretty-print a strategy's full config as JSON.
- **`cryptohopper exchange list`** (alias `ls`) — list all supported exchanges. Public endpoint, no auth needed.
- **`cryptohopper exchange markets <exchange>`** — list every trading pair available on an exchange. Public.

All four commands accept `--json` like the rest of the CLI and follow the same exit-code contract.

## 0.5.1-alpha.1 — 2026-04-25

### Fixed
- **Critical: destructive commands bypassed the `--yes` confirmation gate when `--json` was passed.** `hoppers panic`, `template load`, and `template delete` all used `if (!opts.yes && !json)` to decide whether to print the confirmation warning, which caused them to *execute the destructive action* when `--json` was passed without `--yes`. The `--yes` gate now always applies; in `--json` mode the refusal is emitted as JSON (`{ "ok": false, "error": { "code": "CONFIRMATION_REQUIRED", "message": ... } }`) to stderr with exit code 1.
- **OAuth token-exchange error message was empty on empty HTTP bodies.** The fallback chain used `??` on `text.slice(0, 200)`, which always returns a string — meaning the `HTTP <status>` tail was unreachable, and empty error bodies produced `Token exchange failed:` with nothing useful. Switched to `||` so empty bodies fall through to the status code.

### Security note
If you have scripts that relied on `--json` silently bypassing confirmation on `hoppers panic` / `template load` / `template delete`, they will now fail with a `CONFIRMATION_REQUIRED` error and exit code 1. Add `--yes` to restore the prior behaviour — but note that prior behaviour was unintended and dangerous.

## 0.5.0-alpha.1 — Unreleased

### Added
- **CLI is now published to npm as `@cryptohopper/cli`**, in addition to the existing standalone binaries on GitHub Releases. Install via `npm i -g @cryptohopper/cli` or run on demand with `npx @cryptohopper/cli ...`. The Bun-compiled binaries remain the recommended install path for non-Node users (faster cold start, no Node dependency).
- **Unicode table formatting** for every list/history command (`hoppers list`, `positions`, `orders`, `tournaments list/active/leaderboard`, `template list`, `signals list`, `ai models`, `arbitrage history`, `marketmaker history`, `subscription plans`). Backed by `cli-table3`.

### Changed
- Added `cli-table3` as a runtime dependency.

## 0.4.0-alpha.1 — 2026-04-24

Follows `@cryptohopper/sdk@0.4.0-alpha.1`. Adds tournaments commands.

### Added
- **`tournaments list`** — list all tournaments.
- **`tournaments active`** — list currently-active tournaments (public, no auth).
- **`tournaments leaderboard <tournament-id>`** — leaderboard for a specific tournament.

(Social / webhooks / app commands deferred — social is visual-UI heavy, webhooks is a one-shot setup flow typically done through the dev dashboard, and app is mobile-only internals.)

### Changed
- `@cryptohopper/sdk` dep bumped to `^0.4.0-alpha.1`.
- Shell completions updated with `tournaments`.

## 0.3.0-alpha.1 — 2026-04-24

Follows `@cryptohopper/sdk@0.3.0-alpha.1`. Adds CLI commands for the A2 resources that make sense in a terminal.

### Added
- **`ai credits`** — remaining AI credit balance.
- **`ai models`** — LLM models available to the account.
- **`subscription get`** — account-level subscription state.
- **`subscription plans`** — list available plans (public, no auth).
- **`subscription credits`** — remaining platform credits.

(Platform / chart commands deferred — their endpoints are web-UI focused, little CLI value.)

### Changed
- `@cryptohopper/sdk` dep bumped to `^0.3.0-alpha.1`.
- Shell completions updated with `ai` and `subscription`.

## 0.2.0-alpha.1 — 2026-04-24

Follows `@cryptohopper/sdk@0.2.0-alpha.1` and adds CLI commands for the new resources.

### Added
- **`signals list`**, **`signals stats`**, **`signals performance`** — signal-provider analytics.
- **`arbitrage history`**, **`arbitrage total`** — read-only arbitrage helpers. (Starting new arbitrage runs remains SDK-only for v0.2 — too many params for ergonomic CLI flags; revisit with an interactive wizard in v0.3.)
- **`marketmaker get <hopper-id>`**, **`marketmaker history <hopper-id>`** — market-maker bot inspection.
- **`template list`**, **`template get <id>`**, **`template load <template-id> <hopper-id> --yes`**, **`template delete <id> --yes`** — template management.

### Changed
- `@cryptohopper/sdk` dep bumped to `^0.2.0-alpha.1`.
- Shell completions updated to include the four new top-level commands.

## 0.1.0-alpha.2 — 2026-04-24

### Changed
- **`cryptohopper login` is now a real browser OAuth2 flow.** Opens your default browser to `https://www.cryptohopper.com/oauth2/authorize`, listens on `127.0.0.1:18765/callback` for the redirect, and exchanges the auth code for a bearer token at `/oauth2/token`. The CLI is registered as a public OAuth client on cryptohopper.com (no `client_secret`).
- The paste-token flow is retained as `--token <value>` for CI, SSH, and other headless environments.

### Added
- `CRYPTOHOPPER_WEB_URL` env override for pointing at staging OAuth consent pages.
- `webUrl` added to the config file and to `cryptohopper config get` / `set`.

## 0.1.0-alpha.1 — 2026-04-24

Initial release. Standalone binaries on GitHub Releases; Bun `--compile` cross-compiled for linux-x64, darwin-x64, darwin-arm64, windows-x64.

### Commands
- **Auth** — `login`, `logout`, `whoami`
- **Hoppers** — `hoppers list`, `hoppers get`, `hoppers panic`, `positions`, `orders`
- **Exchange** — `ticker` (public, no auth)
- **Backtest** — `backtest new`, `backtest status`, `backtest limits`
- **Upgrade** — `upgrade` (downloads next release, verifies SHA256, atomic swap)
- **Config** — `config get`, `config set` (apiUrl, appKey)
- **Completion** — `completion bash|zsh|fish|powershell`

### Auth
- Paste-token flow — copy the OAuth bearer from the developer dashboard.
- Env overrides: `CRYPTOHOPPER_TOKEN`, `CRYPTOHOPPER_APP_KEY`, `CRYPTOHOPPER_API_URL`.
- Config stored at `~/.cryptohopper/config.json` (0600).

### Implementation notes
- Thin wrapper on top of `@cryptohopper/sdk` (no duplicate transport).
- Exit-code taxonomy: 1 user error, 2 auth, 3 rate-limited, 4 server, 5 network.
