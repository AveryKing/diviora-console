# Development workflow (Antigravity) — GitHub-first, issue-driven

This repo uses strict issue-driven development.

GLOBAL RULES
- All work is tracked by GitHub Issues.
- One PR implements exactly one Issue.
- No merges until the PR passes the review checklist in PACKS/MASTER_PACK_V0_1.md.
- Every PR must link the issue and close it on merge (via PR body keywords).

REQUIRED WORKFLOW (ORDER MATTERS)

PHASE 0 — BACKLOG CREATION (MUST BE DONE FIRST)
1) Create the repository "diviora-console" (if not created).
2) Create ALL issues defined in PACKS/MASTER_PACK_V0_1.md before starting any coding.
3) Confirm issue numbers match the pack ordering (Issue #1..#N). If GitHub assigns different
   numbers, record a mapping in the repo (e.g., in a comment on Issue #1).

PHASE 1 — IMPLEMENTATION (ONE ISSUE PER PR)
For each issue in order:
1) Create a branch named: issue-<issueNumber>-<slug>
2) Implement ONLY the scope for that issue.
3) Ensure local commands pass:
   - npm run lint
   - npm run typecheck
   - npm run test
   - npm run build
4) Open a PR with title: "Issue #<n>: <short title>"
5) PR description MUST include:
   - Closes #<n>   (required; ensures close-on-merge)
   - Scope implemented (bullets)
   - How to test (exact commands)
   - Screenshots/GIF for UI changes
   - Known limitations / follow-ups

PHASE 2 — REVIEW (MUST HAPPEN BEFORE MERGE)
1) Run the review checklist from PACKS/MASTER_PACK_V0_1.md against the PR diff.
2) Apply fixes in the same branch until the review verdict is PASS or PASS_WITH_NITS.
3) If FAIL, do not merge; fix and re-review.

PHASE 3 — MERGE
- Merge only after review is PASS or PASS_WITH_NITS AND CI is green.
- Use squash merge unless there is a reason not to.
- Confirm the issue is closed automatically by the "Closes #<n>" keyword.

FAIL-CLOSED POLICY
- If any ambiguity exists (API endpoints, schema shapes, etc.), STOP and ask.
- Provide safe assumptions and implement mock fallbacks rather than guessing.