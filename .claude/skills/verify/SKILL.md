---
name: verify
description: Cairn's full pre-commit check. Runs the complete quality gate (typecheck, lint, format, unit tests with coverage, build) and the browser tests with accessibility checks, then reports in plain words. Use before every commit and before saying that a change works.
---

# Verify a Cairn change

Run these from the project root, in order. Stop at the first failure, fix its cause, and start again from step 1.

1. **Quality gate:** `npm run check`
   Runs typecheck, lint, format check, unit and integration tests with coverage thresholds, and the production build.
2. **Browser tests:** `npm run test:e2e`
   Builds and starts the app, then runs Playwright in Chromium and WebKit at phone and desktop widths, in light and dark mode, with axe accessibility checks. If the browsers are missing, run `npx playwright install chromium webkit` first.
3. **Look at it** when the change affects anything visible: start `npm run dev`, open the page in the Browser pane at 375 px and 1280 px wide, in light and dark, and check the change by eye, including keyboard focus.
4. **Report** in plain words: each step passed or failed, and anything you could not verify (for example "not tested on a real iPhone").

## Rules

- Never weaken, skip or delete a test, assertion, coverage threshold, lint rule or CI step to get a pass. Fix the code instead.
- A flaky failure is still a failure: find out why before re-running.
- If a step keeps failing, stop and tell the owner plainly what fails and what the options are.
