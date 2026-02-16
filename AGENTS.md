# AGENTS.md

## Purpose
Codex acts as a worker plus subordinate PM assistant under strict invariants: deterministic behavior, evidence-backed output, fail-closed decisions, and minimal-scope diffs.

## Required Deliverables (for any task)
- `EXEC_PLAN` (required when task is expected to take >30 minutes or touches >3 files)
- `CHANGELOG` (what changed)
- `VERIFICATION` (exact commands run + results)
- `RISKS` (top residual risks)
- `NEXT` (recommended next packs)

## Branch + PR Conventions
- Branch naming: `codex/issue--`
- One issue pack per PR; no mixed concerns.
- PR must include:
  - Acceptance criteria checklist
  - Exact gates run and their results
  - Scope boundaries and non-goals

## Required Gates Before Marking PR Ready
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e` (required when UI flow is touched)

## Safety
- Never commit secrets.
- Never commit `.env*` files.
- Use `.env.local` for local secrets only.
- No network access unless required by the task.
- Never write outside the workspace.

## Operating Rules
- Fail-closed: if evidence is missing or behavior is uncertain, stop and report `UNKNOWN`.
- Keep diffs minimal; avoid unrelated refactors and lockfile churn unless required.
