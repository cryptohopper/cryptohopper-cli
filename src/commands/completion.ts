/**
 * Print a minimal shell completion script for bash/zsh/fish/powershell.
 * v0.1 just static-lists the top-level commands; richer completion can
 * land later without breaking this API.
 */

const TOP = [
  "login",
  "logout",
  "whoami",
  "hoppers",
  "positions",
  "orders",
  "ticker",
  "backtest",
  "signals",
  "arbitrage",
  "marketmaker",
  "template",
  "ai",
  "subscription",
  "upgrade",
  "config",
  "completion",
  "--help",
  "--version",
];

export function completionCommand(shell: string): void {
  switch (shell) {
    case "bash":
      console.log(bashScript());
      return;
    case "zsh":
      console.log(zshScript());
      return;
    case "fish":
      console.log(fishScript());
      return;
    case "powershell":
    case "pwsh":
      console.log(powershellScript());
      return;
    default:
      console.error(`Unsupported shell: ${shell}. Try: bash | zsh | fish | powershell`);
      process.exit(1);
  }
}

function bashScript(): string {
  return `_cryptohopper_completions() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  if [ "$COMP_CWORD" -eq 1 ]; then
    COMPREPLY=( $(compgen -W "${TOP.join(" ")}" -- "$cur") )
  fi
}
complete -F _cryptohopper_completions cryptohopper`;
}

function zshScript(): string {
  return `#compdef cryptohopper
_cryptohopper() {
  local -a commands
  commands=(${TOP.map((t) => `"${t}"`).join(" ")})
  _describe 'cryptohopper' commands
}
compdef _cryptohopper cryptohopper`;
}

function fishScript(): string {
  return TOP.map(
    (t) => `complete -c cryptohopper -n "__fish_use_subcommand" -a "${t}"`,
  ).join("\n");
}

function powershellScript(): string {
  return `Register-ArgumentCompleter -Native -CommandName cryptohopper -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)
  @(${TOP.map((t) => `'${t}'`).join(",")}) | Where-Object { $_ -like "$wordToComplete*" }
}`;
}
