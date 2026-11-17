# Cairn: habit and growth tracker (PWA)

Spec: `docs/SPEC.md` · Architecture: `docs/ARCHITECTURE.md` · Decisions: `docs/adr/` · Progress: `docs/PROGRESS.md` · Backlog: `docs/BACKLOG.md`

Start every session by reading `docs/PROGRESS.md` (where we are, what's next) and the spec sections for the current milestone.

@AGENTS.md

## Who you are working with

- The owner is NOT a programmer and does not review code. The automated checks and the reviewer agents are the reviewers, so they must stay real: never weaken, skip or delete a test, threshold, lint rule, hook or CI check to get a green result.
- Explain choices in plain language. Keep technical detail for when they ask. Ask before big decisions.
- The owner uses a Windows PC and an iPhone (installed web app). Development happens on Windows; CI runs on Linux. Hooks and scripts are Node scripts, never bash-only.
- Only the owner creates accounts (GitHub, Vercel, Supabase), enters secrets, types slash commands and adds the app to the Home Screen. When you reach one of those, give click-by-click steps and wait. Never ask for a secret in chat and never write one into a tracked file.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5.9 strict + `noUncheckedIndexedAccess` · Tailwind 4 + shadcn/ui (Base UI) + lucide · Recharts · Motion · Dexie · Supabase (RLS) · Zod · date-fns · Vitest · Playwright + axe · ESLint 9 + Prettier · Node 26

## Commands

`npm run dev | build | start | typecheck | lint | format | test | test:coverage | test:e2e | audit | check`

`npm run check` is the full gate (typecheck, lint, format check, unit tests with coverage, build). `npm run test:e2e` builds the app and runs Playwright in Chromium and WebKit.

## How we work

- Build milestone by milestone in the order of SPEC 3.9. Stop at the end of every milestone and wait for the owner; they use the app for a few days before the next one. M0 to M4 is the first goal: a working app on the phone.
- Build only what the current milestone needs. Ideas beyond it go into `docs/BACKLOG.md`, not into the code.
- Keep `docs/PROGRESS.md` current: done, in progress, decisions made, what's next.
- The spec's sections 1, 2 and 4 are the reasoning behind section 3; use them for judgment calls in the spirit of the product: frictionless, calm, forgiving, honest about progress, private, small. Don't reopen product decisions the spec settles. If an installed workflow disagrees with the spec, the spec wins.
- Versions, free-tier limits and Claude Code features change: check the official docs before relying on a detail. Where reality differs from the spec, tell the owner, follow reality, and record an ADR.
- Follow the `new-slice` skill for every slice: plan mode first and wait for "go"; failing tests first; implement the minimum; `verify` skill; reviews; fix; Conventional Commit; pull request; merge on green CI; plain-language summary.

## Rules

- Small vertical slices, one user story at a time. Tests before or with code.
- Domain logic is pure functions in `src/domain` with unit tests (95% coverage there, 70% overall).
- Every table has RLS and a policy test. Validate every input with Zod. No secrets in client code. Never edit `.env` files (a hook blocks it); only `.env.example` is committed.
- WCAG 2.2 AA, keyboard navigation, 44 px touch targets, chart text alternatives, `prefers-reduced-motion`.
- Calm design per SPEC 3.2: no red guilt states, animations 300 ms or less. All user-facing text lives in `src/content/strings.ts`.
- Components around 150 lines or fewer. No `any`. Plain-language error messages.
- Conventional Commits. Update docs and `CHANGELOG.md`. A new dependency or architecture change needs an ADR: `docs/adr/<n>-<slug>.md`, numbered 1, 2, 3 (no zero padding).
- Personal details stay out of git: the owner's private notes and the original spec live in the git-ignored `docs/private/`.
- Before saying "done": `npm run check`, the `verify` skill, the reviews, then a plain-language summary and how to try it.

## Safety

- Ask before anything destructive or hard to undo: deleting files outside the project, force-pushing, resetting a database, or changing anything in one of the owner's accounts. Ask before installing or updating software on the owner's PC.
- `main` is protected: changes land only through pull requests with green checks.
- Hooks in `.claude/settings.json` (scripts in `.claude/hooks/`, tested in `tests/unit/hooks/` and `tests/integration/`):
  - after every edit: Prettier and `eslint --fix` on the file;
  - before shell commands: block deleting a folder with everything in it (`rm -r`, `Remove-Item -Recurse`, `rd /s`, `rimraf`), `git clean`, pushes to main, force pushes, `--no-verify`, remote database resets, and shell access to `.env` files;
  - before reading, searching or editing files: block `.env` files in any folder (`.env.example` is fine);
  - both guards block the action if they fail themselves;
  - when a turn ends: typecheck and lint, reported to the owner.

## Subagents

Use them when they make the work better or faster, without asking each time: research on current docs and versions, parallel building of pieces that don't share files (anything sharing a schema, type or file is built in sequence or in separate worktrees you merge yourself), long noisy test or debugging runs, and reviews. Every slice is reviewed by agents that did not write it: `code-reviewer`, `security-reviewer`, `a11y-reviewer`, `ux-copy-reviewer` in `.claude/agents/`, plus `/security-review` for anything touching auth, data access, tokens, API routes, CI or hooks. Brief each subagent fully (goal, spec section, files, constraints, what done looks like, what to send back). Read what they changed and run the checks yourself before saying something works. Skip subagents for small tasks.

## Third-party skills and plugins

Installed at project scope: `security-guidance` (its end-of-turn review is switched off with `ENABLE_STOP_REVIEW=0`; edit warnings and commit reviews stay on) and `typescript-lsp`. Install nothing else from any source without asking the owner first. Before proposing an install, read what it actually adds (skills, hooks, scripts, MCP servers) and tell the owner in two lines what it does and whether it fetches URLs, runs scripts or wants credentials.

## Writing style (code, comments, commits, PRs, docs, UI text)

- Never use em dashes or en dashes. Use a hyphen, comma, colon, parentheses, or two sentences. Ranges: "5 to 10" or "5-10".
- Numbered lists start at 1, never zero-padded.
- No emojis anywhere, including commit messages and pull requests.
