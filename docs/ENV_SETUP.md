# Environment Setup

## Required variables
Set these in local `.env.local`:

- `DIVIORA_CONSOLE_AUTH_TOKEN`: shared auth header token for `/api/copilot` requests.
- `OPENAI_API_KEY`: key used by Copilot runtime to call the upstream model.
- `NEXT_PUBLIC_DIVIORA_CONSOLE_AUTH_TOKEN`: browser-side header value used by CopilotKit; keep aligned with `DIVIORA_CONSOLE_AUTH_TOKEN`.

## Local-only secret file
- Use `.env.local` for local development only.
- `.env.local` must never be committed to git.
- Keep real secret values out of docs, issues, and PR comments.

## Rotation guidance
If a token or API key is exposed in chat, logs, screenshots, or commits:

1. Revoke/rotate the exposed secret in the provider dashboard.
2. Update `.env.local` with the new value.
3. Restart local dev/test processes so the new value is loaded.
4. Re-run auth and e2e checks.
