# Manual Sanity Test Runbook (10-15 min)

## 1) Preflight

### Start the app
```bash
cd /Users/avery/diviora-console
npm install
npm run dev
```

Open: `http://localhost:3000`

### Environment variables (names only)
- `OPENAI_API_KEY` (required only for real Copilot chat generation via `/api/copilot`)

### Reset demo data (before first test run)
1. Go to `http://localhost:3000/settings`.
2. Click `Reset All Demo Data` (`data-testid="reset-all-data"`).
3. Accept the browser confirm dialog.

---

## 2) Test Cases

### TC1: Fresh start + compile creates proposal and timeline entry
- Setup
  - Demo data reset completed.
  - Go to home `/`.
- Exact clicks/inputs
  1. In compose box (`home-compose-textarea`), enter: `Button overlap in checkout on mobile. Please propose a fix plan.`
  2. Click submit (`home-compose-submit`).
- Expected UI outcome
  - Latest proposal link appears in context panel (`latest-proposal-link`).
  - A new proposal card/entry is visible in artifacts context.
- If FAIL diagnostics
  - Open browser DevTools Network tab and confirm POST to `/api/compile` returns 200.
  - Check `/settings` and retry after reset.

### TC2: Artifact detail renders sections correctly for template
- Setup
  - At least one proposal exists (from TC1).
- Exact clicks/inputs
  1. Click `latest-proposal-link`.
  2. On artifact detail page, observe section list.
- Expected UI outcome
  - `proposal-sections` is visible.
  - One or more `section-title` items render.
  - `proposal-template-badge` is visible.
- If FAIL diagnostics
  - Verify URL is `/artifacts/<proposal_id>`.
  - Check if proposal JSON contains `sections` (use Copy JSON action if available).

### TC3: Approve + note -> approvals list shows entry
- Setup
  - On artifact detail page for latest proposal.
- Exact clicks/inputs
  1. Enter decision note in `decision-note`: `Manual sanity approval note`.
  2. Click `approve-button`.
  3. Navigate to `/approvals`.
- Expected UI outcome
  - Latest approval appears with status `approved` and the note text.
- If FAIL diagnostics
  - Return to artifact detail and ensure approval click succeeded.
  - Confirm there was no policy error toast/message.

### TC4: Run plan creation gated by approval
- Setup
  - Have one unapproved proposal and one approved proposal.
- Exact clicks/inputs
  1. For approved proposal detail: click `create-run-plan`.
  2. For unapproved proposal detail: attempt to find/create run plan.
- Expected UI outcome
  - Approved proposal: navigates to `/runs/run_<id>`.
  - Unapproved proposal: run creation is blocked/absent/fails closed.
- If FAIL diagnostics
  - Check approval state in `/approvals`.
  - Inspect UI errors and console for gating errors.

### TC5: Transcript generation (happy_path) -> status updates
- Setup
  - On run detail page `/runs/<run_id>`.
- Exact clicks/inputs
  1. Select scenario `happy_path` in `scenario-selector`.
  2. Click `generate-transcript-button`.
- Expected UI outcome
  - New attempt appears on run detail.
  - `outcome-badge` becomes visible (typically `SUCCESS` or `WARNING`).
- If FAIL diagnostics
  - Refresh run page and recheck latest attempt.
  - Confirm run ID is valid and proposal is approved.

### TC6: Rerun scenario (rate_limited or flaky_inputs) -> failure recorded
- Setup
  - On same run detail page with at least one prior transcript.
- Exact clicks/inputs
  1. Select `rate_limited` (or `flaky_inputs`) in `scenario-selector`.
  2. Click `generate-transcript-button` again.
- Expected UI outcome
  - New attempt is appended (not overwritten).
  - `outcome-badge` shows `FAILED` for failure scenario.
- If FAIL diagnostics
  - Verify scenario selector value actually changed before clicking generate.
  - Confirm attempt count increased.

### TC7: Diff view compares two attempts
- Setup
  - At least two transcript attempts exist for same run.
- Exact clicks/inputs
  1. Enable `diff-mode-toggle`.
  2. Choose another attempt in `diff-target-selector`.
- Expected UI outcome
  - `diff-summary` appears.
  - `diff-error-line` appears when failures differ.
- If FAIL diagnostics
  - Ensure two attempts exist and are distinct scenarios.
  - Toggle diff off/on and retry selection.

### TC8: Snapshot export -> reset -> import -> state restored
- Setup
  - Have non-empty data (proposal, approval, run, transcript).
- Exact clicks/inputs
  1. Go to `/settings`.
  2. Click `Export Snapshot` and save file.
  3. Click `Reset All Demo Data` and confirm.
  4. Verify data pages look empty (`/artifacts`, `/approvals`, `/runs`).
  5. Back on `/settings`, click `Import Snapshot` and select exported file.
- Expected UI outcome
  - Previously existing proposals/approvals/runs/transcripts reappear.
- If FAIL diagnostics
  - Confirm selected file is valid JSON export from same app.
  - Retry import after hard refresh.

### TC9: Copilot draft -> Insert -> textarea updated -> verify NO auto-submit
- Setup
  - Home page `/`.
  - If real Copilot drafting is desired, ensure `OPENAI_API_KEY` is set.
- Exact clicks/inputs
  1. Click `Draft Suggestion` button in home chat panel.
  2. Wait for draft card (`copilot-draft-card`) and suggestion text (`copilot-suggestion`).
  3. Click `Insert into Compose` (`home-insert-draft-btn`).
- Expected UI outcome
  - Compose textarea (`home-compose-textarea`) is populated with draft text.
  - You remain on `/` (no navigation to artifacts/runs).
  - Proposal is **not** auto-created until clicking `home-compose-submit`.
- If FAIL diagnostics
  - Check `/api/copilot` request status in Network (if using real drafting).
  - Verify `copilot-draft-card` rendered before clicking insert.

### TC10: Mobile width smoke (layout doesn’t break)
- Setup
  - Open browser responsive mode (e.g., iPhone width ~390px).
- Exact clicks/inputs
  1. Visit `/`, `/artifacts`, `/runs`, `/settings`.
  2. On `/`, type in compose and toggle context panel from mobile icon if available.
- Expected UI outcome
  - No overlapping critical controls (submit/reset/approve/create-run).
  - Core interactions remain reachable without horizontal overflow.
- If FAIL diagnostics
  - Capture screenshot and note route + viewport size.
  - Reproduce at two widths (390px and 768px).

### Optional: Copilot toggle behavior (if visible in header)
- Setup
  - On any page with header visible.
- Exact clicks/inputs
  1. Click header button titled `Toggle Copilot` (if present).
  2. Click again to restore state.
- Expected UI outcome
  - Copilot UI visibility/state toggles without breaking current page.
- If FAIL diagnostics
  - Check browser console for event/listener errors around `diviora:toggle-copilot`.

---

## 3) Report Template (copy/paste)

```md
Manual Sanity Run Report (localhost:3000)
Date/Time:
Tester:

TC1: PASS/FAIL - notes
TC2: PASS/FAIL - notes
TC3: PASS/FAIL - notes
TC4: PASS/FAIL - notes
TC5: PASS/FAIL - notes
TC6: PASS/FAIL - notes
TC7: PASS/FAIL - notes
TC8: PASS/FAIL - notes
TC9: PASS/FAIL - notes
TC10: PASS/FAIL - notes
Optional Copilot Toggle: PASS/FAIL/NA - notes

Overall: PASS/FAIL
Screenshots: (optional links or filenames)
```
