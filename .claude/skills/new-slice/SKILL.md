---
name: new-slice
description: Checklist for building one Cairn slice (one user story) from plan to merged pull request, following SPEC 3.8. Use when starting any feature, fix or milestone step.
---

# Build a slice

A slice is one user story (for example F2, one-tap logging), small enough to review in one sitting.

## 1. Plan (plan mode), then wait for "go"

- Restate the story ID, the acceptance criteria from `docs/SPEC.md` 3.3, and what is out of scope.
- List the files to add or change, the tests to write, the risks, and any new dependency (each needs an ADR).
- Explain the plan to the owner in plain language. Wait for their go.

## 2. Branch

`git switch -c <type>/<story>-<short-name>`, for example `feat/f2-one-tap-logging`.

## 3. Tests first

- Domain logic: Vitest unit tests in `tests/unit/` with fixture histories in `tests/fixtures/`.
- Flows: Playwright tests in `tests/e2e/` with axe checks.
- Run them and confirm they fail for the right reason.

## 4. Implement the minimum

- Pure logic in `src/domain`; storage through `src/data` repositories; text in `src/content/strings.ts`.
- Components around 150 lines or fewer, no `any`, plain-language error messages.
- Design per SPEC 3.2: calm, no red guilt states, motion 300 ms or less and off under reduced motion.
- Ideas beyond the story go to `docs/BACKLOG.md`, not into the code.

## 5. Check

Run the `verify` skill (`npm run check`, `npm run test:e2e`, look at it in the browser).

## 6. Review by agents that did not write it

- `code-reviewer` always.
- `a11y-reviewer` for anything visible; `ux-copy-reviewer` for any new or changed text.
- `security-reviewer` plus `/security-review` for anything touching auth, data access, tokens, API routes, CI or hooks.
- Fix what they find, then run `verify` again.

## 7. Docs

Update `docs/PROGRESS.md`, the `Unreleased` section of `CHANGELOG.md`, the user guide when behaviour changes, and add an ADR (`docs/adr/<n>-<slug>.md`) for any new dependency or architecture change.

## 8. Ship

- Conventional Commit (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`, `refactor:`).
- `git push -u origin <branch>`, open a pull request with `gh pr create`, wait for every CI check to pass, then merge with `gh pr merge --squash --delete-branch`.

## 9. Tell the owner

A plain-language summary: what they can now do, exactly how to try it on the PC and the iPhone, what was verified by running it, and what could not be verified.

## Definition of Done

Acceptance criteria demonstrated; tests green in CI; typecheck and lint clean; no new high or critical audit findings; accessibility checks pass; works at phone and desktop widths, and offline where relevant; docs updated; plain-language summary given.
