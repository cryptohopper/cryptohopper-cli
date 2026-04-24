# Changelog

## 0.4.0-alpha.1 — Unreleased

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
