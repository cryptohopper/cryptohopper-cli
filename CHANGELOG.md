# Changelog

## 0.1.0-alpha.2 — Unreleased

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
