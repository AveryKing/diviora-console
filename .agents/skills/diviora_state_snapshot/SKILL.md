---
name: diviora_state_snapshot
description: Generate STATE_SNAPSHOT.md with repo state, gate outcomes, feature matrix, residual risks, and prioritized next packs.
---

# diviora_state_snapshot

## Purpose
Create an audit-grade state snapshot at repo root: `STATE_SNAPSHOT.md`.

## Required output sections
1. **Repository State**
- Current branch name
- `git status --short --branch`
- Head SHA (`git rev-parse HEAD`)
- Last 10 commits (`git log --oneline -n 10`)

2. **Gate Status**
Run and record PASS/FAIL with short evidence for:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e`

For each gate, include:
- Command
- Result: PASS/FAIL/UNKNOWN
- 1-3 lines of proof (key output)

3. **Feature Inventory Matrix**
Include major feature rows and status columns:
- Feature
- Status (PASS/FAIL/UNKNOWN)
- Evidence (file paths/tests/observable command output)

Minimum features to cover:
- compile flow and proposal creation
- templates and section rendering
- artifact list/detail
- approvals
- runs
- transcripts + diff
- snapshot import/export
- copilot integration + authority boundaries
- e2e coverage

4. **Top 5 Residual Risks**
Each risk includes:
- Risk
- Impact
- Evidence
- Suggested mitigation (no code unless requested)

5. **Recommended Next Packs**
Prioritized by severity and leverage:
- P0
- P1
- P2
Each item includes objective + acceptance criteria.

## Operating constraints
- Fail-closed: if not verified, mark `UNKNOWN`.
- No secrets in output.
- Evidence-first: no claims without proof.
- Keep language concise and auditable.

## Completion criteria
`STATE_SNAPSHOT.md` exists at repo root and includes all sections above with evidence-backed statuses.
