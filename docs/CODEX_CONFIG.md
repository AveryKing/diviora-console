# CODEX_CONFIG

## Config Locations
- Global user config: `~/.codex/config.toml`
- Project-scoped config: `/Users/avery/diviora-console/.codex/config.toml`

Project config is intended to standardize behavior for this repository without affecting other repos.

## Profile Switching
- Codex app: select the active profile (for example `pm`, `impl`, `review`) from profile/settings controls.
- Codex CLI (if your build supports profile selection): use a profile flag such as `--profile <name>`.

If your app/CLI build exposes profile controls differently, use the equivalent profile-selection mechanism in that build.

## High-Level Meanings
- `approval_policy`
  - Controls when Codex must request confirmation before sensitive actions.
  - `on-request` means Codex can ask for approval when an action crosses trust boundaries.

- `sandbox_mode`
  - Controls file-system write scope.
  - `read-only` limits to non-mutating operations.
  - `workspace-write` allows edits inside the repo workspace only.

- `network_access`
  - Controls outbound network usage.
  - Keep `false` by default and enable only for tasks that explicitly require network access.

## Security Reminder
- Do not store secrets in config files.
- Keep tokens/keys in local environment files such as `.env.local` and never commit them.
