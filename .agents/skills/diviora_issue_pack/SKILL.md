---
name: diviora_issue_pack
description: Produce AUDIT_GRADE_ISSUE_PACK.md with objective, scope, invariants, implementation plan, acceptance criteria, tests, rollback, and done criteria.
---

# diviora_issue_pack

## Purpose
Generate `AUDIT_GRADE_ISSUE_PACK.md` at repo root for one narrowly scoped issue pack.

## Required structure
1. **Title**
2. **Objective**
3. **Non-goals**
4. **Invariants**
Must explicitly include:
- Fail-closed behavior
- No secrets in code/logs/artifacts
- Approval boundaries (no autonomous state mutation; user-driven actions preserved)
5. **Implementation plan**
- Ordered steps
- Files expected to change
- Explicitly call out assumptions
6. **Acceptance criteria (testable)**
- Binary/observable checks only
7. **Required tests**
- Unit/integration/e2e coverage expected
- Gate commands required
8. **Rollback plan**
- Minimal revert strategy
- Data safety notes
9. **Definition of done**
- Local gates green
- PR CI green
- Main branch CI green after merge

## Gate requirements to include
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e` (if UI flow touched)

## Constraints
- Keep scope minimal to one issue pack.
- No unrelated refactors.
- If uncertainty exists, mark `UNKNOWN` and list evidence needed.

## Completion criteria
`AUDIT_GRADE_ISSUE_PACK.md` exists and is executable by an implementer without additional clarification.
