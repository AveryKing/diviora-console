MASTER PACK: DIVIORA-CONSOLE v0.1
This file is the single source of truth for:
- Initial GitHub backlog (Issues #1..#5)
- Review checklist + verdict rules

============================================================
SECTION 1 — BACKLOG (CREATE ALL ISSUES FIRST)
============================================================

ISSUE #1 — BOOTSTRAP DIVIORA-CONSOLE (v0)
Goal:
Bootstrap a new Next.js TypeScript repo with Tailwind, Zod, linting, typecheck, tests, and GitHub Actions CI. Add the .agent context layer files.

Scope:
- Initialize Next.js app router project (TypeScript).
- Configure TailwindCSS.
- Add Zod.
- Add ESLint config (Next recommended). Prettier optional; keep minimal.
- Add test runner (Vitest preferred) and at least one passing test.
- Add npm scripts:
  - dev, build, start
  - lint
  - typecheck
  - test
- Add GitHub Actions workflow to run: install, lint, typecheck, test, build.
- Add .agent folder with all required files from this plan (including this MASTER_PACK).

Acceptance criteria:
- npm run lint passes
- npm run typecheck passes
- npm run test passes
- npm run build passes
- GitHub Actions runs on PR
- Repo contains .agent folder exactly as specified

Non-goals:
- No CopilotKit integration yet
- No Hub integration yet


ISSUE #2 — UI SHELL + NAV (v0.1)
Goal:
Create the core UI shell and navigation for diviora-console.

Scope:
- App layout with header + nav links:
  - Home (/)
  - Artifacts (/artifacts)
  - Approvals (/approvals)
  - Runs (/runs)
  - Settings (/settings)
- Minimal responsive styling (Tailwind).
- Home page includes:
  - Chat input panel (text area + submit)
  - Placeholder sections for "Latest Proposal" and "Timeline"
- Each page has a basic empty state card describing what will appear there.

Acceptance criteria:
- Navigation works
- Pages render with clean minimal UI
- No broken routes
- No console errors

Non-goals:
- No backend calls yet
- No CopilotKit yet


ISSUE #3 — HUB COMPILE INTEGRATION (v0.1)
Goal:
Wire the Home chat input to call Diviora Hub "compile" endpoint server-side and render the returned proposal artifact.

Assumptions:
- Hub base URL comes from env var DIVIORA_HUB_BASE_URL.
- For v0.1, implement a single endpoint call:
  - POST {baseUrl}/compile (or {baseUrl}/api/compile if needed)
- If the real endpoint is unknown, implement:
  - A configurable path in env var DIVIORA_HUB_COMPILE_PATH (default "/compile")
  - A mock fallback when not configured

Scope:
- Create lib/divioraHubClient.ts with:
  - compileMessage({ text: string }) => ProposalArtifact
- Create Zod schema ProposalArtifact in lib/schemas.ts
  - Must support unknown extra fields via passthrough
- Home page:
  - Submit text
  - Show loading state
  - Show error state with diagnostic details
  - Show proposal summary + sections rendered from artifact JSON
- Add server action or route handler for the call (no secret leakage)

Acceptance criteria:
- Missing DIVIORA_HUB_BASE_URL fails clearly in Settings page
- Home can submit message and display either:
  - Mock proposal if not configured, OR
  - Real hub proposal if configured
- All responses validated with Zod
- No secrets exposed to client

Non-goals:
- Streaming AG-UI (later)
- Approvals integration (later)


ISSUE #4 — ARTIFACTS TIMELINE (v0.1)
Goal:
Add an artifacts timeline view and show recent artifacts on Home.

Scope:
- Define Artifact schema in lib/schemas.ts
- Add lib/mockData.ts providing mock artifacts (at least 10 entries)
- /artifacts page:
  - Render timeline list with filter by type (simple dropdown)
  - Artifact card shows:
    - type
    - createdAt
    - short summary
    - expandable JSON view
- Home page:
  - Show 3 most recent artifacts

Acceptance criteria:
- Timeline renders without errors
- Filter works
- JSON view is safe and readable

Non-goals:
- Real artifact API calls (later)


ISSUE #5 — APPROVALS QUEUE (stub) (v0.1)
Goal:
Create an approvals queue page with mock approvals and a UI that models the approval flow, without executing anything.

Scope:
- Define Approval schema in lib/schemas.ts
- Add mock approvals to lib/mockData.ts (at least 5)
- /approvals page:
  - List approvals
  - Each approval shows:
    - request summary
    - risk/side effects label
    - required action
    - expandable details JSON
  - Buttons:
    - Approve (no-op mock; marks local state as approved)
    - Reject (no-op mock; marks local state as rejected)
- Ensure UI makes it clear this is a stub and no upstream calls are made

Acceptance criteria:
- Approvals list renders
- Approve/reject updates local UI state
- No network side effects

Non-goals:
- Real Hub v0.3 approval endpoints (later)

============================================================
SECTION 2 — REVIEW CHECKLIST (RUN BEFORE MERGE)
============================================================

REVIEW OBJECTIVE
This review checklist MUST be run against every PR before merge. The PR is not allowed to merge if the verdict is FAIL.

VERDICTS
- PASS: safe to merge
- PASS_WITH_NITS: merge allowed but list nits
- FAIL: must fix before merge

REVIEW CHECKLIST

R1 — Invariants compliance (must pass)
- UI-only invariant respected: no worker side effects, no direct worker calls.
- No secret leakage: no API keys in NEXT_PUBLIC_ env vars; no secrets sent to client.
- Fail-closed behavior: missing env vars and schema mismatches show explicit error states.
- No phantom contracts: unknown shapes are treated as opaque JSON with explicit labeling.

R2 — Scope discipline
- PR implements exactly one issue.
- No unrelated refactors.
- Dependencies are minimal and justified.

R3 — Correctness
- Zod validation for all external responses and mock data conforms to schema.
- Loading/error/empty states exist for user-facing flows.
- Server-only calls for Hub integration; client receives only safe data.

R4 — Maintainability
- Reasonable file structure and naming.
- No duplicate logic.
- Components are small and coherent.

R5 — Testing
- Commands pass:
  - npm run lint
  - npm run typecheck
  - npm run test
  - npm run build
- Tests cover at least schemas/client normalization in v0.1.

R6 — PR hygiene (must pass)
- PR title: "Issue #<n>: <short title>"
- PR body includes:
  - "Closes #<n>" (required)
  - scope bullets
  - how-to-test commands
  - screenshots/GIF if UI changed
  - known limitations

OUTPUT FORMAT FOR THE REVIEW (what the reviewer must write)
1) Intent summary
2) Checklist results (R1..R6) with pass/fail and evidence
3) Ordered fix list (highest risk first)
4) Verdict: PASS / PASS_WITH_NITS / FAIL