---
name: diviora_review_pack
description: Produce AUDIT_GRADE_REVIEW.md with verdict, required changes, evidence, gate summary, and top risks.
---

# diviora_review_pack

## Purpose
Create `AUDIT_GRADE_REVIEW.md` at repo root for a branch/PR review.

## Required output
1. **Verdict**
- `PASS` or `FAIL`
- One-paragraph rationale

2. **Required changes** (only if FAIL)
- Ordered list of blocking issues
- Clear fix direction per issue

3. **Evidence checked**
For each reviewed item include:
- File path(s)
- What was checked
- Why it matters

4. **Gate verification summary**
Report PASS/FAIL/UNKNOWN for:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e` (if applicable)
Include short proof lines.

5. **Top 5 risks**
Each with:
- Risk
- Impact
- Evidence
- Mitigation recommendation

## Review standard
- Prioritize correctness, regressions, invariant violations, and test gaps.
- Evidence-first: no unsupported claims.
- Fail-closed: unknown verification must be labeled `UNKNOWN`.

## Constraints
- No secret exposure in report.
- No scope creep into implementation unless explicitly requested.

## Completion criteria
`AUDIT_GRADE_REVIEW.md` is actionable for merge/no-merge decisions.
