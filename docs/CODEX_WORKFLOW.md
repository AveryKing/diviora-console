# CODEX_WORKFLOW

## Modes

### PM Mode
- Define objective, constraints, non-goals, and acceptance criteria.
- Split work into issue packs (small, testable, one concern each).
- Require explicit verification expectations for each pack.

### Implementer Mode
- Confirm scope and create an `EXEC_PLAN` when needed (>30 min or >3 files).
- Implement only the issue pack scope.
- Keep diffs minimal and auditable.
- Run required gates before claiming readiness:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - `npm run test:e2e` (when UI flow is touched)

### Reviewer Mode
- Review for regressions, invariant violations, and missing tests.
- Provide evidence-backed findings with file references.
- Fail-closed: mark unknowns explicitly when evidence is missing.

## Request Patterns

### Request an Issue Pack
- Include: goal, non-negotiables, scope, acceptance criteria, stop condition.

### Request a Review Pack
- Include: branch/PR, review focus files, severity expectations, required output format.

### Request Manual Tests
- Include: environment, target flows, expected outcomes, report format.

## Merge Procedure
1. All required gates pass locally.
2. Open PR with acceptance criteria checklist and exact commands run.
3. Complete review (peer or self-review with documented focus).
4. Ensure PR CI is green.
5. Squash merge into `main`.
6. Confirm `main` CI is green post-merge.

## Safety Defaults
- No secrets in repo; `.env.local` only for local development.
- No writing outside workspace.
- No unnecessary network usage.
- Stop and report when uncertain.
