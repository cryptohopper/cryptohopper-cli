# cryptohopper-cli

[![npm](https://img.shields.io/npm/v/@cryptohopper/cli?include_prereleases&logo=npm&label=%40cryptohopper%2Fcli)](https://www.npmjs.com/package/@cryptohopper/cli)
[![GitHub release](https://img.shields.io/github/v/release/cryptohopper/cryptohopper-cli?include_prereleases&logo=github&label=binaries)](https://github.com/cryptohopper/cryptohopper-cli/releases/latest)
[![Release downloads](https://img.shields.io/github/downloads/cryptohopper/cryptohopper-cli/total?logo=github&label=downloads)](https://github.com/cryptohopper/cryptohopper-cli/releases)
[![CI](https://github.com/cryptohopper/cryptohopper-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/cryptohopper/cryptohopper-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/cryptohopper/cryptohopper-cli?color=blue)](LICENSE)

Command-line interface for [Cryptohopper](https://www.cryptohopper.com).

> **Status: 0.6.0-alpha.1** — alpha. Published to npm as `@cryptohopper/cli`; standalone binaries for macOS (arm64 + x64), Linux x64, and Windows x64 attached to every GitHub release.

**Deeper docs:** [Scripting & CI](docs/Scripting.md) · [Troubleshooting](docs/Troubleshooting.md) · [Public CLI reference](https://github.com/cryptohopper/cryptohopper-resources/blob/main/docs/cli.md)

## Install

### Via npm (all platforms)
```bash
npm install -g @cryptohopper/cli
```

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
cryptohopper login                     # opens your browser to authorize via OAuth2
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

`cryptohopper login` drives a browser-based OAuth2 authorization-code flow:

1. The CLI starts a one-shot listener on `http://127.0.0.1:18765/callback`.
2. Your default browser opens Cryptohopper's consent page.
3. You click "Allow" for the scopes the CLI requests (`read manage trade user`).
4. Cryptohopper redirects to `127.0.0.1:18765/callback?code=...&state=...`.
5. The CLI exchanges the code for a bearer token and saves it to `~/.cryptohopper/config.json` (mode 0600).

The CLI is a public OAuth client — no `client_secret` is sent. Security relies on strict server-side redirect-URI matching, a random `state` nonce per login, and the loopback-only listener.

### Fallback: paste-token (CI, SSH, no-browser)

If you already have a bearer token, skip the browser flow:

```bash
cryptohopper login --token <your-40-char-token>
```

### Env overrides

- `CRYPTOHOPPER_TOKEN` — bearer token; skips login entirely
- `CRYPTOHOPPER_APP_KEY` — OAuth `client_id`, sent as `x-api-app-key`
- `CRYPTOHOPPER_API_URL` — staging override (defaults to `https://api.cryptohopper.com/v1`)
- `CRYPTOHOPPER_WEB_URL` — OAuth consent origin override (defaults to `https://www.cryptohopper.com`)

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
