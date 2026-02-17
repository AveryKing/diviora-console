# Diviora Agent v0.1 Manual Sanity

## Preconditions
- Node dependencies installed: `npm ci`
- Local env configured (names only):
  - `DIVIORA_CONSOLE_AUTH_TOKEN`
  - `NEXT_PUBLIC_DIVIORA_CONSOLE_AUTH_TOKEN`
  - `OPENAI_API_KEY` (optional for this flow, since no send-to-model step is required)
- App running: `npm run dev`
- Open app at `http://localhost:3000`
- Start from clean state:
  1. Open `/settings`
  2. Click `Reset All Demo Data`
  3. Accept browser confirm dialog

## Sanity Journey (Matches E2E)

### Step 1: Paste Snapshot and Verify It Appears
1. Open `/memory`.
2. In `Paste STATE_SNAPSHOT.md or JSON snapshot`, paste:
   ```md
   # STATE_SNAPSHOT
   branch: main
   head sha: 1234567890abcdef
   | gate | status |
   | lint | PASS |
   ```
3. Click `Save Snapshot`.
4. In `Saved Snapshots`, click the newest row.

Expected:
- Success banner `Snapshot saved.`
- List shows `main` and sha prefix `1234567890`
- Detail panel shows full sha `1234567890abcdef`

### Step 2: Open Agent and Verify Chat Surface
1. Open `/agent`.
2. Confirm main chat panel is visible.
3. Click `Memory` tab.

Expected:
- `Diviora Agent` chat surface visible
- Right panel visible in split mode
- Memory tab shows snapshot markdown with `STATE_SNAPSHOT`

### Step 3: Generate Draft Issue Pack and Approve
1. Open `Packs` tab.
2. In browser devtools console, dispatch proposal event:
   ```js
   window.dispatchEvent(new CustomEvent('diviora:agent-pack-proposed', {
     detail: {
       kind: 'issue',
       title: 'Issue Pack: Agent v0.1 Sanity',
       content_markdown: '## Objective\nValidate v0.1 flow\n\n## Scope\n- Sanity checks\n\n## Acceptance Criteria\n- Packet generated',
       selected_goals: ['Sanity checks'],
       source_input: 'Sanity checks'
     }
   }))
   ```
3. Click `Create Draft Pack`.
4. Enter note `Manual sanity approved`.
5. Click `Approve`.

Expected:
- Proposed Draft card appears
- New pack appears in list
- Status badge changes to `approved`

### Step 4: Generate Codex Task Packet
1. With the approved issue pack selected, click `Generate Codex Task Packet`.
2. Click `Copy packet`.

Expected:
- Status becomes `dispatched`
- `Codex Task Packet` block appears
- Packet includes:
  - `Invariants (from AGENTS.md)`
  - suggested branch line
  - command block with lint/typecheck/test/build/test:e2e

## Failure Triage
- Snapshot save fails:
  - Check `/memory` page for status banner.
  - Confirm pasted text is not empty.
  - Check browser console for localStorage errors.
- Agent page missing content:
  - Verify `/agent` route loads and no runtime errors in console.
  - Verify store hydrated (reload once after reset).
- Pack proposal card does not appear:
  - Re-run event dispatch in console and confirm `kind: 'issue'`.
  - Check if `Packs` tab is active.
- Codex packet button missing:
  - Confirm selected pack is `issue` and status is `approved`.

## Evidence Capture
Capture and attach:
- Screenshot of `/memory` with saved snapshot selected.
- Screenshot of `/agent` with Packs tab and approved status.
- Screenshot of visible Codex Task Packet block.
- Copy/paste output snippets for gates run locally:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - `CI=1 npm run test:e2e`

## Automation Mapping
The deterministic automated equivalent is:
- `/Users/avery/diviora-console/tests/e2e/agent-v01-journey.spec.ts`
