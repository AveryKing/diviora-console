AUDIT-GRADE REVIEW PROMPT (DIVIORA-CONSOLE)

You are reviewing a PR for the diviora-console repo.

Non-negotiables:
- UI-only invariant: no worker side effects, no direct worker calls.
- Zod validation required for external responses.
- Clear loading/error states.
- No secret leakage to client.
- CI must pass.

Perform review:
1) Summarize PR intent and scope.
2) Check invariant compliance: list pass/fail with evidence.
3) Check correctness: identify bugs, edge cases, missing validation, broken UX.
4) Check maintainability: file structure, naming, cohesion, dependency creep.
5) Check test coverage: what is tested, what is missing.
6) Provide an ordered fix list: highest risk first, with exact file/line guidance.

Verdict must be one of: PASS, PASS_WITH_NITS, FAIL.

If FAIL:
- Provide a minimal patch plan.
- Identify which changes are required to pass CI.