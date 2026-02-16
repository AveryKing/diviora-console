---
name: diviora_manual_test_pack
description: Produce MANUAL_TEST_SCRIPT.md with preconditions, step-by-step manual checks, triage hints, evidence capture, and Playwright mapping.
---

# diviora_manual_test_pack

## Purpose
Generate `MANUAL_TEST_SCRIPT.md` at repo root for human-run validation.

## Required sections
1. **Preconditions**
- Required env var names (no values)
- Expected server port/base URL
- Seed/reset state steps
- Browser/device assumptions

2. **Manual test procedure**
For each test case include:
- Setup
- Exact steps/clicks/inputs
- Expected observations
- Pass/fail check

3. **Failure triage hints**
- Where to inspect first (UI area, logs, route, component)
- Likely failure classes and quick isolate steps

4. **Evidence to capture**
- Screenshots (which screen/state)
- Console/network traces if relevant
- Minimal text notes template

5. **Playwright mapping**
For each manual case include:
- Selector candidates (`data-testid` preferred)
- Equivalent e2e flow outline
- Assertions that should be automated

## Constraints
- No secrets, tokens, or private values in script.
- Keep steps deterministic and repeatable.
- If a precondition is unknown, mark `UNKNOWN` and stop guessing.

## Completion criteria
`MANUAL_TEST_SCRIPT.md` can be executed in 10-15 minutes by a reviewer with consistent results.
