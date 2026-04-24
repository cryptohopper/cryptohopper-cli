# Troubleshooting

If you hit something that isn't listed here, open an issue: https://github.com/cryptohopper/cryptohopper-cli/issues.

## `cryptohopper login` never finishes

The browser flow spins up a loopback listener on `127.0.0.1:18765` and waits up to 5 minutes for Cryptohopper to call back. Common culprits:

**"Port 18765 is already in use."** Something else on your machine is holding it. The CLI errors out immediately in this case. Kill whatever is using the port, or pass `--token <your-bearer-token>` to skip the browser flow entirely. (If you suspect a previous `cryptohopper login` hung, it cleans up when its process exits — `ps` for stray `cryptohopper` and kill them.)

**"OAuth state mismatch."** The `state` nonce in the redirect didn't match what we sent. Retry the command — if it persists after a fresh retry, something upstream is rewriting the URL (malicious redirect, aggressive URL shortener, or a misconfigured corporate proxy).

**Browser opens but no redirect back.** The consent page likely had an error that the CLI didn't see. Re-run with the authorize URL printed in your terminal and copy-paste it into a private-window browser. If the Cryptohopper consent page shows "Client not found" or similar, the bundled `client_id` has been revoked — file an issue.

**You clicked "Allow" but the terminal shows nothing.** The loopback listener might be blocked by a firewall. Check your firewall settings — the binary needs inbound access on `127.0.0.1:18765` specifically (not all of localhost; not the external IP). On Windows, this triggers a UAC-style prompt the first time; accept it.

## `cryptohopper upgrade` refuses with "cryptohopper is running as a Node script"

You installed via `npm install -g @cryptohopper/cli` — you have the Node-script install, not the standalone binary. The `upgrade` command only swaps standalone binaries. To update an npm install, run:

```bash
npm install -g @cryptohopper/cli@latest
```

If you want the standalone binary (no Node dependency), grab it from the [latest release](https://github.com/cryptohopper/cryptohopper-cli/releases/latest) and put it on your `PATH`.

## `cryptohopper upgrade` fails with "Permission denied"

The CLI is installed somewhere the current user can't write to, typically `/usr/local/bin`. Options:

- Re-run with sudo: `sudo cryptohopper upgrade`
- Move the binary into a user-writable directory and update your `PATH`:
  ```bash
  mkdir -p ~/.local/bin
  mv /usr/local/bin/cryptohopper ~/.local/bin/
  export PATH="$HOME/.local/bin:$PATH"
  ```

## `cryptohopper upgrade` says "Checksum mismatch"

The CLI verifies every downloaded binary against `SHA256SUMS` before swapping. A mismatch usually means:

1. **Partial download.** Re-run upgrade — transient.
2. **Man-in-the-middle on the download.** Seen occasionally on misconfigured corporate networks. Try again from a different network.
3. **Release assets were re-uploaded after the SHA256SUMS file was created.** Extremely rare and our fault; file an issue.

The CLI refuses to install a mismatched binary, which is the correct behaviour. Never bypass this.

## Everything returns `UNAUTHORIZED`

The token is missing or no longer valid.

```bash
# What's the CLI seeing?
cryptohopper whoami
```

If this fails with `UNAUTHORIZED`, re-run `cryptohopper login`. If you set `CRYPTOHOPPER_TOKEN` in an env var it overrides the config file — double-check it:

```bash
echo $CRYPTOHOPPER_TOKEN
```

## Everything returns `FORBIDDEN` on endpoints that used to work

Usually an IP allowlist mismatch. The error message prints the IP Cryptohopper saw:

```bash
cryptohopper hoppers list
# → ✗ IP not in allowlist
#     IP: 203.0.113.42
```

Add that IP to your app's allowlist in the Cryptohopper dashboard, or disable allowlisting for that app if you're running from dynamic IPs (e.g. CI).

## Tables look broken in my terminal

The CLI renders Unicode box-drawing by default. If your terminal doesn't handle those glyphs (legacy `cmd.exe`, old PuTTY, etc.), use `--json` for machine-readable output:

```bash
cryptohopper hoppers list --json | jq '.hoppers[] | {id, name}'
```

## Shell completion isn't working

Completion is installed by piping the command output into your shell's completion directory. The commands are:

```bash
# bash
cryptohopper completion bash > /etc/bash_completion.d/cryptohopper

# zsh
cryptohopper completion zsh > "${fpath[1]}/_cryptohopper"

# fish
cryptohopper completion fish > ~/.config/fish/completions/cryptohopper.fish

# PowerShell
cryptohopper completion powershell | Out-String | Invoke-Expression
```

Zsh + Oh My Zsh: don't forget to run `exec zsh` (or restart your shell) after installing.

## `cryptohopper` command not found

- **npm install**: check `npm bin -g` points at a directory on your PATH.
- **Standalone binary**: the binary isn't on your PATH. `which cryptohopper` (or `where cryptohopper` on Windows) should resolve. Put the binary in `/usr/local/bin`, `~/.local/bin`, or wherever you keep user binaries.

## Token persists after `cryptohopper logout`

`logout` clears the stored token in `~/.cryptohopper/config.json`, but `CRYPTOHOPPER_TOKEN` env var (if set) will override that on the next run. Unset the env var too:

```bash
unset CRYPTOHOPPER_TOKEN
```

Then re-run `cryptohopper whoami` — it should now say "Not logged in".

## "Cannot find module '@cryptohopper/sdk'"

Only happens to Node-script installs. Your `npm install -g @cryptohopper/cli` didn't install its peer `@cryptohopper/sdk`, or a stale lockfile is pointing at a missing version. Try:

```bash
npm install -g @cryptohopper/cli@latest
```

If that doesn't fix it, remove the global install and reinstall clean:

```bash
npm uninstall -g @cryptohopper/cli
npm install -g @cryptohopper/cli@latest
```

## Reporting a bug

If nothing here helps, file an issue with:

- Your CLI version: `cryptohopper --version`
- Platform: `uname -a` (or `systeminfo` on Windows)
- Install method: npm or standalone binary
- The full command you ran, with `--json` if applicable
- Any stderr output
- What you expected to happen

Please **don't** paste your bearer token — the error messages don't include it, but double-check your scrollback before posting.
