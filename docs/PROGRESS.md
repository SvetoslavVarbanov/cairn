# Progress

Where Cairn stands, so any session can pick up without the owner repeating anything. Update it at the end of every slice.

## Now

**M0 Foundations:** done (2026-11-17), merged through pull request 1. Waiting for the owner before M1.

Open owner decisions:

- turn on GitHub private vulnerability reporting and Dependabot security updates (both off; `SECURITY.md` has a fallback);
- whether the persona hints left in the public spec are fine (see [ADR 6](adr/6-public-repo-private-details.md));
- type `/run-skill-generator` once.

## Done

### Before M0 (2026-11-16)

- Spec read; machine checked (Git 2.56, Node 26.13, GitHub CLI 2.104, Claude Code 2.1.325, Python 3.12).
- Decide-early questions answered (SPEC 3.10):
  - name: Cairn;
  - language: English first, with all text in `src/content/strings.ts`;
  - day boundary 04:00, weeks start Monday;
  - public repository;
  - the first three habits (kept privately in `docs/private/decisions.md`).
- Claude Code plugins approved and installed at project scope: security-guidance (end-of-turn review off) and typescript-lsp. Skipped: frontend-design, superpowers, Next.js agent skills ([ADR 7](adr/7-claude-code-tooling.md)).

### M0 Foundations

- Public GitHub repository `cairn`:
  - `main` protected (pull requests only, required checks, no force pushes);
  - secret scanning with push protection and Dependabot alerts on.
- Next.js 16.4.6 app skeleton:
  - TypeScript strict, Tailwind 4, shadcn/ui on Base UI;
  - Cairn colour tokens for light and dark, contrast-tested;
  - Geist font, self-hosted;
  - a placeholder home page and app icon.
- Tests:
  - Vitest with coverage thresholds (95% domain, 70% overall);
  - Playwright in Chromium and WebKit, phone and desktop, light and dark, with axe.
- Claude Code setup:
  - `CLAUDE.md`;
  - four Node hooks with unit and integration tests;
  - four reviewer agents;
  - `verify`, `new-slice` and `release` skills.
- CI (typecheck, lint, format, tests, build, E2E, audit), CodeQL, weekly grouped Dependabot.
- Docs: README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG, ARCHITECTURE, USER-GUIDE, BACKLOG, ADRs 1 to 7.

## Decisions

| ADR                                       | Decision                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| [1](adr/1-stack-and-decisions.md)         | Stack versions; coverage scope; ADRs numbered without zero padding          |
| [2](adr/2-eslint-9-and-prettier.md)       | ESLint 9 and Prettier (ESLint 10 not yet supported by Next.js's lint rules) |
| [3](adr/3-typescript-5-and-node-26.md)    | TypeScript 5.9 (not 7); Node 26, at least 24                                |
| [4](adr/4-nextjs-defaults.md)             | Cache Components, agent feedback and telemetry off                          |
| [5](adr/5-shadcn-base-ui.md)              | shadcn/ui on Base UI, stylesheet vendored, clay darkened for contrast       |
| [6](adr/6-public-repo-private-details.md) | Public repository, personal details kept out of git                         |
| [7](adr/7-claude-code-tooling.md)         | Plugins used and skipped; hooks in Node; agents and skills                  |

## Next

**M1 Domain metrics** (SPEC 3.9): `src/domain/metrics.ts`, `schedule.ts` and `drift.ts`, exactly per SPEC 3.5, test first, with fixture histories (perfect month, one miss, two misses, skips, weekly 3 times, rating habit, drift). Full branch coverage. No UI.

## Notes for later milestones

- **M2:** the first screen with controls gets a keyboard test in Playwright (Tab through every control and check that focus is visible).
- **M3:** the chart colours `--chart-1` to `--chart-5` are still shadcn-style placeholders and some are too faint (dark `chart-4` is about 2:1). Add them to the contrast test at 3:1 against the card before the charts use them, and give the heatmap a cue that is not only colour.
- **M4:**
  - strict Content-Security-Policy, HSTS and the standard security headers;
  - check that Vercel supports Node 26 (otherwise Node 24);
  - Serwist in "configurator mode" (`@serwist/next` plus `@serwist/cli`), because `@serwist/turbopack` currently crashes on Vercel; record in an ADR;
  - PWA icons replace the placeholder `icon.svg`.
- **M5:** Supabase Free pauses after a week of inactivity and has no automatic backups; plan a weekly JSON export.
- **Owner-only steps ahead:** Vercel account (M4), Supabase account and secrets in Vercel (M5), adding the app to the iPhone Home Screen (M4).
