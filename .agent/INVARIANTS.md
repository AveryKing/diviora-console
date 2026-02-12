# Invariants (non-negotiable)

I1: UI-only
- diviora-console MUST NOT execute real-world side effects.
- It MUST NOT call worker services directly.
- It MAY request actions by calling upstream Hub/Atlas endpoints that produce proposals/approvals/runs.

I2: Fail-closed on ambiguity
- If API responses are missing fields or schemas mismatch, render an explicit error state.
- Do not silently ignore or guess.

I3: Artifact-first UX
- Every response shown in the UI must be representable as a stored artifact object.
- UI components should render from typed schemas.

I4: No phantom contracts
- Do not invent new Statecraft decision types or contract fields.
- If a contract shape is unknown, model it as an opaque JSON blob with explicit “unknown” labeling.

I5: Deterministic boundaries
- The console may display or request approvals, but approvals must be made explicit by the user.
- No “auto approve” behaviors.

I6: Security hygiene
- Never expose secrets to the client.
- Server-side API calls only for authenticated calls.
- All env vars must be validated and missing env vars must fail clearly.