---
name: diviora_release_gate
description: Enforce merge/release gate with required commands, environment assumptions, clean artifacts, and blocking stop conditions.
---

# diviora_release_gate

## Purpose
Define and execute the repository merge/release gate before approving merge.

## Required commands
Run in order and record PASS/FAIL evidence:
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build`
5. `npm run test:e2e` (mandatory for UI-flow changes)

## Required environment
- Node/npm available and project dependencies installed
- Env vars as needed for e2e/runtime checks (names only, no values)
- No secrets printed to logs or report output

## Artifact cleanliness checks
- Working tree clean or only expected issue-pack files changed
- Ignored/local-only artifacts are not staged or committed:
  - `.env*`
  - `playwright-report/`
  - `test-results/`
  - `.next/`
  - `node_modules/`
  - local report artifacts not intended for commit

## Stop conditions (block merge)
- Any required gate fails
- CI for PR is not green
- Invariants violated (authority boundaries, fail-closed behavior, no secret handling)
- Unreviewed high-severity risks remain
- Evidence missing for critical claims (`UNKNOWN` unresolved)

## Merge rule
Only proceed when:
- Local gates PASS
- PR CI PASS
- Review completed
- Post-merge `main` CI PASS

## Completion criteria
Provide a concise release-gate summary with command results, blockers (if any), and explicit go/no-go decision.
