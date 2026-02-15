# CODEX Deliverable: Env Setup + Manual API Sanity + E2E Determinism Fix

## What Changed
- Fixed Playwright determinism by pinning the webServer port and health-check URL.
- Added `/api/health` endpoint used as Playwright readiness signal.
- Hardened e2e selectors/timing by waiting for proposal link existence deterministically.
- Added local env setup docs.
- Ignored `CODEX_MANUAL_REPORT.md` to avoid accidental commits.

## Files Changed
- `/Users/avery/diviora-console/.gitignore`
- `/Users/avery/diviora-console/playwright.config.ts`
- `/Users/avery/diviora-console/app/api/health/route.ts`
- `/Users/avery/diviora-console/tests/e2e/lifecycle-failure-diff.spec.ts`
- `/Users/avery/diviora-console/tests/e2e/lifecycle-happy.spec.ts`
- `/Users/avery/diviora-console/docs/ENV_SETUP.md`

## Manual API Sanity (curl) Results (A1–A5)
Port used: `http://localhost:3100`

- A1 Missing auth -> **PASS** (401)
  - Evidence:
    - `HTTP/1.1 401 Unauthorized` and `{"error":"unauthorized"}`
- A2 Wrong auth -> **PASS** (401)
  - Evidence:
    - `HTTP/1.1 401 Unauthorized` and `{"error":"unauthorized"}`
- A3 Correct auth -> **PASS** (200)
  - Evidence:
    - `HTTP/1.1 200 OK` and JSON body containing runtime `version` and `agents`
- A4 Rate limit burst -> **PASS** (429 + Retry-After)
  - Evidence:
    - Requests 30 -> `200`, 31+ -> `429`
    - `HTTP/1.1 429 Too Many Requests` with `retry-after: <seconds>` and `{"error":"rate_limited"}`
- A5 Payload too large -> **PASS** (413)
  - Evidence:
    - `HTTP/1.1 413 Payload Too Large` and `{"error":"payload_too_large"}`

## Playwright Before/After
- Before (observed failure): e2e timed out waiting for `[data-testid="latest-proposal-link"]` and/or showed Next.js error overlay due to Copilot auth missing (401).
- After: **PASS**
  - Evidence (from `npm run test:e2e`): `3 passed`

## Proof Commands (Local) — PASS
- `npm run lint` (PASS)
- `npm run typecheck` (PASS)
- `npm run test` (PASS: `26 passed`, `92 passed`)
- `npm run build` (PASS)
- `npm run test:e2e` (PASS: `3 passed`)

## Security Notes
- The auth token and OpenAI key were previously pasted into chat. Treat them as **compromised**.
  - Recommended action: rotate both secrets and update `.env.local`.
- `.env.local` remains ignored via `.gitignore` (`.env*`). It must not be committed.

## Review / Merge Steps
1. Review PR diff focusing on:
   - `/Users/avery/diviora-console/playwright.config.ts` (fixed port + readiness + env injection)
   - `/Users/avery/diviora-console/app/api/health/route.ts` (health endpoint)
   - `/Users/avery/diviora-console/tests/e2e/*.spec.ts` (deterministic waits)
2. Confirm CI checks are green on the PR.
3. Merge via squash into `main`.
4. Confirm `main` CI is green after merge.

## PR Link
- https://github.com/AveryKing/diviora-console/pull/25
- CI run (PR): https://github.com/AveryKing/diviora-console/actions/runs/22038377771/job/63675025994 (SUCCESS)
