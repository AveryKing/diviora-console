# Architecture

Routes (v0.1)
- / (Home): Chat + latest proposal + artifact timeline snippet
- /artifacts: Full artifact timeline (mock ok)
- /approvals: Approval queue (mock ok)
- /runs: Recent runs (mock ok)
- /settings: Show config status (hub url present, etc.)

Data flow (v0.1)
- User submits message in console
- Server action calls Hub: compile endpoint (non-streaming for v0.1)
- Response normalized into ProposalArtifact schema
- UI renders:
  - Proposed summary
  - Sections (ICP/Sequence/Funnel etc if present)
  - Warnings/errors

API abstraction
- lib/divioraHubClient.ts:
  - compileMessage(input) => ProposalArtifact
- lib/schemas.ts:
  - Zod schemas for ProposalArtifact, Artifact, Approval, Run
- lib/mockData.ts:
  - mock artifacts/approvals/runs for v0.1 while upstream endpoints finalize

Styling
- Tailwind, minimal clean UI, big typography, cards
- Avoid heavy component libraries unless necessary