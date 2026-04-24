# cryptohopper-cli

Command-line interface for [Cryptohopper](https://www.cryptohopper.com).

> **Status: 0.1.0-alpha.1** — early access. Standalone binaries for macOS (arm64 + x64), Linux x64, and Windows x64.

## Install

### macOS (Apple Silicon)
```bash
curl -L https://github.com/cryptohopper/cryptohopper-cli/releases/latest/download/cryptohopper-darwin-arm64 -o /usr/local/bin/cryptohopper
chmod +x /usr/local/bin/cryptohopper
```

### macOS (Intel)
```bash
curl -L https://github.com/cryptohopper/cryptohopper-cli/releases/latest/download/cryptohopper-darwin-x64 -o /usr/local/bin/cryptohopper
chmod +x /usr/local/bin/cryptohopper
```

### Linux x64
```bash
curl -L https://github.com/cryptohopper/cryptohopper-cli/releases/latest/download/cryptohopper-linux-x64 -o /usr/local/bin/cryptohopper
chmod +x /usr/local/bin/cryptohopper
```

### Windows x64
Download `cryptohopper-windows-x64.exe` from the [latest release](https://github.com/cryptohopper/cryptohopper-cli/releases/latest), rename to `cryptohopper.exe`, place on `%PATH%`.

Verify with `sha256sum -c SHA256SUMS` (macOS/Linux) / `certutil -hashfile cryptohopper.exe SHA256` (Windows).

## Quickstart

```bash
cryptohopper login                     # paste your OAuth token from the dev dashboard
cryptohopper whoami                    # confirm identity
cryptohopper hoppers list              # list your bots
cryptohopper positions <hopper-id>     # open positions
cryptohopper ticker binance BTC/USDT   # public ticker (no auth)
cryptohopper backtest new <hopper-id> --from 2026-01-01 --to 2026-03-01
cryptohopper backtest status <backtest-id>
cryptohopper upgrade                   # self-update to latest release
```

All commands accept `--json` for scripting.

## Authentication

Cryptohopper uses OAuth2 bearer tokens. To get one:

1. Sign in at [cryptohopper.com](https://www.cryptohopper.com) → developer dashboard.
2. Create an OAuth application — you'll receive a `client_id` and `client_secret`.
3. Drive the OAuth consent flow (`/oauth-consent?app_id=<client_id>&redirect_uri=<your_uri>&state=<csrf>`) to receive a 40-character bearer token scoped to the permissions you requested.
4. Run `cryptohopper login` and paste the token.

Env overrides (useful in CI):
- `CRYPTOHOPPER_TOKEN` — bearer token; skips login entirely
- `CRYPTOHOPPER_APP_KEY` — OAuth `client_id`, sent as `x-api-app-key`
- `CRYPTOHOPPER_API_URL` — staging override

Config is stored at `~/.cryptohopper/config.json` with `0600` perms.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Generic / user error |
| 2 | Auth (UNAUTHORIZED, FORBIDDEN, DEVICE_UNAUTHORIZED) |
| 3 | Rate-limited |
| 4 | Server / service unavailable |
| 5 | Network / timeout |

## Shell completions

```bash
cryptohopper completion bash   >> ~/.bashrc
cryptohopper completion zsh    >> ~/.zshrc
cryptohopper completion fish   > ~/.config/fish/completions/cryptohopper.fish
cryptohopper completion powershell | Out-File -Append $PROFILE
```

## Related packages

| Language | Package | Install |
|---|---|---|
| Node.js | [`@cryptohopper/sdk`](https://www.npmjs.com/package/@cryptohopper/sdk) | `npm i @cryptohopper/sdk` |
| Python | [`cryptohopper`](https://pypi.org/project/cryptohopper/) | `pip install cryptohopper` |
| Go | `github.com/cryptohopper/cryptohopper-go-sdk` | `go get github.com/cryptohopper/cryptohopper-go-sdk` |

## Development

```bash
npm install
npm run typecheck
npm run build             # dist/index.js for Node
npm run compile:all       # cross-platform binaries via Bun
```

## Release

Push a `cli-v<version>` git tag. The workflow typechecks, verifies version parity, cross-compiles via Bun, generates `SHA256SUMS`, and attaches everything to a prerelease.

## License

MIT — see [LICENSE](./LICENSE).
