# Scripting and CI guide

The CLI is designed to be pipelineable. Every command supports `--json`, exit codes are stable, and there are no interactive prompts (all destructive actions require `--yes` explicitly).

## The golden pattern

```bash
cryptohopper hoppers list --json \
  | jq -r '.hoppers[] | select(.enabled) | .id' \
  | while read -r id; do
      cryptohopper positions "$id" --json \
        | jq '{hopper: "'"$id"'", positions: .positions | length}'
    done
```

The JSON contract is always one object per invocation, written to stdout on success and stderr on failure.

## Auth in CI

```yaml
# Example GitHub Actions snippet
- name: Install cryptohopper
  run: |
    curl -L https://github.com/cryptohopper/cryptohopper-cli/releases/latest/download/cryptohopper-linux-x64 \
         -o /usr/local/bin/cryptohopper
    chmod +x /usr/local/bin/cryptohopper

- name: Authenticate
  env:
    CRYPTOHOPPER_TOKEN: ${{ secrets.CRYPTOHOPPER_TOKEN }}
  run: cryptohopper whoami
```

`CRYPTOHOPPER_TOKEN` overrides any config file — you don't need to run `cryptohopper login` in CI. The token just has to be present in the environment when `cryptohopper` runs.

For per-app attribution, also set `CRYPTOHOPPER_APP_KEY` to your OAuth `client_id`. This shows up server-side so you can track what CI workloads are doing.

## Exit codes

```
0  Success
1  Generic user error (missing arg, CONFIRMATION_REQUIRED, etc.)
2  Auth failure — re-auth or fix scope
3  Rate limited — back off before retrying
4  Server error — retry later
5  Network or timeout — retry, check connectivity
```

These codes are **stable across releases**. You can rely on them in pipeline logic.

```bash
#!/usr/bin/env bash
set -euo pipefail

retries=0
until cryptohopper ticker binance BTC/USDT --json > /tmp/ticker.json; do
  code=$?
  case $code in
    3) echo "rate-limited, sleeping 30s"; sleep 30 ;;
    4|5) echo "transient ($code), sleeping 5s"; sleep 5 ;;
    *) echo "fatal exit code $code"; exit $code ;;
  esac
  retries=$((retries + 1))
  [ $retries -ge 5 ] && { echo "retries exhausted"; exit 1; }
done
```

## The `--json` contract

Success:
```json
{ "ok": true, "hoppers": [ ... ] }
```

SDK-level failure (server returned an error):
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "status": 401,
    "message": "Invalid token",
    "serverCode": null,
    "ipAddress": "203.0.113.5"
  }
}
```

CLI-level failure (something rejected before we called the API):
```json
{
  "ok": false,
  "error": {
    "code": "CONFIRMATION_REQUIRED",
    "message": "Panic will market-sell every position on hopper 42. Re-run with --yes to confirm."
  }
}
```

Warning text (progress lines, table output) is suppressed under `--json`. Stdout under `--json` is **always** parseable.

## Destructive commands in scripts

Three commands will refuse without `--yes`:

- `hoppers panic <id>`
- `template load <template-id> <hopper-id>`
- `template delete <id>`

In a script, pass `--yes` explicitly. **Don't** write wrappers that auto-inject `--yes` into every call — that defeats the whole point of the confirmation gate. If you legitimately need automation around `panic`, treat it like `rm -rf` and add a second layer of checking (e.g. a `dry-run` step, or a human-approved ticket ID).

```bash
# Safe: explicit yes on a specific hopper
cryptohopper hoppers panic 42 --yes --json

# Unsafe: blanket auto-yes from a loop
for id in "${all_hoppers[@]}"; do
  cryptohopper hoppers panic "$id" --yes  # don't do this
done
```

Prior to 0.5.1-alpha.1, passing `--json` bypassed the gate — fixed, see the CHANGELOG. Always require `--yes` even in JSON mode in current releases.

## Composing with jq

A few patterns:

```bash
# All enabled hoppers
cryptohopper hoppers list --json | jq -r '.hoppers[] | select(.enabled) | .id'

# Sum open-position values across all hoppers
cryptohopper hoppers list --json | jq -r '.hoppers[].id' | while read -r id; do
  cryptohopper positions "$id" --json \
    | jq '.positions | map(.current_value | tonumber) | add // 0'
done | awk '{s+=$1} END {print s}'

# Find hoppers with no positions in the last 24h
# (Bash pseudocode — adapt to your data shape)
cryptohopper hoppers list --json | jq -r '.hoppers[].id' | while read -r id; do
  recent=$(cryptohopper orders "$id" --json | jq '[.orders[] | select(.timestamp > (now - 86400))] | length')
  [ "$recent" -eq 0 ] && echo "$id has no orders in 24h"
done
```

## Rate-limit etiquette

- The CLI inherits the SDK's automatic 429 retry (up to 3 attempts with `Retry-After` respected) — you usually don't need to think about this.
- If you're looping over many hoppers, cap your concurrency. Parallel `xargs -P 8` or GNU parallel with 4–8 workers is a sensible default; above that you'll trip rate limits.
- On `RATE_LIMITED` exit code (3) the CLI has already exhausted its retries. Back off for 30+ seconds before trying again.

## Piping into other tools

Because stdout is pure JSON, you can pipe into anything. Some examples:

```bash
# Into a CSV
cryptohopper hoppers list --json | jq -r '.hoppers[] | [.id, .name, .exchange] | @csv'

# Into a markdown table (requires jtbl or miller)
cryptohopper hoppers list --json | jq -r '.hoppers[] | {id, name, exchange}' | jtbl

# Into Prometheus textfile format
cryptohopper subscription credits --json \
  | jq -r '.credits | to_entries[] | "cryptohopper_credits{type=\"\(.key)\"} \(.value)"'
```

## Running from cron

Simplest pattern:

```bash
# /etc/cron.d/cryptohopper-daily
0 9 * * * user /usr/local/bin/cryptohopper hoppers list --json > /tmp/hoppers.json 2> /tmp/hoppers.err
```

The cron environment doesn't source your shell rc files, so either:
- Put `CRYPTOHOPPER_TOKEN` in `/etc/environment` (system-wide), or
- Use a wrapper script that exports it from your secret store.

Never store the token in a world-readable crontab. Use env vars from a root-owned file with mode 0600, or your OS's keychain (macOS Keychain / Linux `secret-tool`).

## Shell completion in CI

Usually not needed — CI runs specific commands, not interactive ones. If you want it anyway (e.g. for devcontainers):

```bash
cryptohopper completion bash > /etc/bash_completion.d/cryptohopper
```

Skip for non-interactive shells.
