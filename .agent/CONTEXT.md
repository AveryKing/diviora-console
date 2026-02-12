# Project: diviora-console

diviora-console is the web “mission control” cockpit for the Diviora system.

Purpose:
- Provide a rich UI replacing Discord as the interaction surface.
- Display proposals, artifacts, approvals, and runs produced by upstream Diviora services.

Upstream systems (external to this repo):
- diviora-hub: deterministic conversation compiler + authority capture
- atlas: deterministic orchestrator + artifact writer + workflow runner
- statecraft: decision contract library (do not duplicate contracts here)

This repo:
- Calls diviora-hub and/or atlas via HTTP APIs.
- Renders results.
- Never directly triggers worker side effects (no OpenClaw direct calls).
- Never “thinks” as a sovereign agent. Any LLM usage must be constrained to UI niceties only, and default is NO LLM usage in console.

v0.1 goal:
- Minimal chat input -> hub compile -> display proposal artifact
- Timeline view of artifacts (mock ok)
- Approvals view (mock ok)
- Runs view (mock ok)

Tech constraints:
- Next.js App Router
- TypeScript
- TailwindCSS
- Zod validation
- Clean, minimal UI; low reading burden; high signal