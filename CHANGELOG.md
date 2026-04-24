# Changelog

## 0.1.0-alpha.1 — Unreleased

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
