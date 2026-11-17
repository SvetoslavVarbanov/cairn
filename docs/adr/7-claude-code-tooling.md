# 7. Claude Code tooling: plugins, hooks, agents and skills

- Status: accepted
- Date: 2026-11-16
- Milestone: M0

## Context

The owner does not review code, so the automatic checks have to be real. Third-party agent skills carry real supply-chain risk: Snyk's February 2026 audit found critical issues in 13.4% of public skills. Development is on Windows and CI is on Linux. Each item below was read before installing, and the owner approved it.

## Decision

**Installed at project scope** (recorded in `.claude/settings.json`):

- **security-guidance 2.0.20** (Anthropic):
  - What it does: pattern warnings on edits, and an AI security review on every commit.
  - What it needs: Python 3.10 or newer. It installs Anthropic's Agent SDK into `~/.claude/security/`, sends changed code to Anthropic using the owner's Claude sign-in, and uses some of the subscription.
  - Setting: its end-of-every-turn review is off (`ENABLE_STOP_REVIEW=0`) to save usage. The commit review stays on.
- **typescript-lsp 1.0.0** (Anthropic): type errors right after each edit. It needs `typescript-language-server` 6.1.0, installed globally on the owner's PC.

**Considered and skipped:**

- **frontend-design** pushes toward bold, unusual visuals, and it calls warm neutrals with a clay accent a cliché. That conflicts with the calm palette in SPEC 3.2.
- **superpowers 7.0.2** duplicates the spec's own plan, test and review workflow. Its session-start hook injects "always use a skill first" instructions and a mandatory brainstorming step that would reopen decisions the spec settles. Plugins can only be switched off whole.
- **Next.js agent skills** (`npx skills add vercel/next.js`): all six target Cache Components, prefetching and bundle size, which Cairn doesn't use. One installs a browser-automation tool globally, and the installer sends telemetry by default. Next.js's `AGENTS.md` already covers version-matched docs.
- The **github**, **vercel** and **supabase** plugins wait for the milestones that need them. The GitHub CLI already covers GitHub.

**Project-owned:**

- **Hooks** are Node scripts in `.claude/hooks/`, started in exec form (`"command": "node"` plus `args`, no shell), so they behave the same on Windows and Linux. Each rule has unit tests (`tests/unit/hooks/`), and the real scripts are exercised through stdin in `tests/integration/hooks.test.ts`.
  - After every edit: Prettier and `eslint --fix` on the file; problems it can't fix go back to Claude.
  - Before shell commands: block deleting a folder with everything in it (`rm -r` with or without `-f`, `Remove-Item -Recurse`, `rd /s`, `rimraf`, recursive deletes in `node -e` or `python -c`), `git clean` (it would delete the git-ignored `docs/private/` and `.env` files, which have no other copy), pushes to main, force pushes, `--no-verify`, remote database resets, encoded PowerShell, and shell access to `.env` files.
  - Before reading, searching or editing files: block `.env` files in any folder, except `.env.example`. `permissions.deny` rules back this up for the usual names.
  - The two guards fail safe: if a guard crashes or cannot read its input, the action is blocked. The helper hooks (formatting and the end-of-turn check) never block on their own errors.
  - Recursive deletes are blocked even without a force flag because Claude's shell has no terminal, so `rm -r` never asks before deleting.
  - Known limits, accepted: the guards catch honest mistakes, not deliberate disguise. They do not undo shell escapes inside a command name (such as `r\m`), and they do not look inside code that starts other programs (such as `node -e` calling `child_process`). GitHub's branch protection and the rule to ask the owner first remain the real controls.
  - When a turn ends: typecheck and lint on changed code, reported to the owner. It only reports, so it cannot loop.
- **Reviewer agents** in `.claude/agents/`: code, security, accessibility and UX copy. They are read-only.
- **Skills** in `.claude/skills/`: `verify` (runs before each commit, a Claude Code 2.1.286+ behaviour), `new-slice` and `release`.

## Consequences

- The hooks are a safety net for honest mistakes, not a sandbox. They recognise common spellings of risky commands and err toward blocking.
- Installing anything else needs the owner's approval, after reading what it adds.
