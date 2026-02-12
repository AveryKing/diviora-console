# .agent context layer for diviora-console

This folder contains the canonical context injection layer for Antigravity.

Rules:
- Antigravity MUST read and follow:
  CONTEXT.md, INVARIANTS.md, ARCHITECTURE.md, WORKFLOW.md,
  CODING_STANDARDS.md, TESTING.md, CI_CD.md, SECURITY.md
- Antigravity MUST use PACKS/MASTER_PACK_V0_1.md as the single source of truth
  for the initial backlog AND the review checklist.
- Fail-closed: if anything is ambiguous, Antigravity MUST ask in the PR description
  and provide safe alternatives.

This repo is UI-only. It does NOT execute worker side effects.