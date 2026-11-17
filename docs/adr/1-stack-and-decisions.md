# 1. Stack, and how decisions are recorded

- Status: accepted
- Date: 2026-11-16
- Milestone: M0

## Context

The spec (section 1 and 3.7) recommends Next.js 16, TypeScript strict, Tailwind, shadcn/ui, Recharts, Motion, Dexie, Zod, Supabase, Vitest and Playwright. It was researched in November 2026 and asks us to check versions at M0 and record where reality differs.

## Decision

We use the spec's stack at these versions, checked against npm and the official docs on 2026-11-16:

| Part                                        | Version                            |
| ------------------------------------------- | ---------------------------------- |
| Next.js (App Router, Turbopack)             | 16.4.6                             |
| React                                       | 19.3.0                             |
| TypeScript                                  | 5.9.3 (see ADR 3)                  |
| Tailwind CSS (via `@tailwindcss/turbopack`) | 4.3.3                              |
| shadcn/ui on Base UI (see ADR 5)            | CLI 4.23.0, `@base-ui/react` 1.9.0 |
| ESLint and Prettier (see ADR 2)             | 9.39.5 and 3.10.1                  |
| Vitest and coverage                         | 5.1.0                              |
| Playwright and axe                          | 1.65.1 and 4.14.0                  |
| Node.js (see ADR 3)                         | 26 LTS, at least 24                |

Recharts, Motion, Dexie, Zod and date-fns are added in the milestone that first needs them, each with its version checked then.

**Test coverage scope.** Unit coverage is measured over `src/` and `.claude/hooks/`, except Next.js route files (`src/app/`) and the vendored shadcn primitives (`src/components/ui/`). Those are tested through the screens that use them, in the Playwright end-to-end tests with axe, plus the focus and touch-target rules in `tests/unit/theme/ui-rules.test.ts`. In M0 no screen uses a shadcn component yet, so only those rules apply to them. Thresholds: 95% for `src/domain`, 70% overall, enforced from day one.

**Decision records** live in `docs/adr/<n>-<slug>.md`. They are numbered 1, 2, 3 rather than the usual 0001, following the owner's rule of no zero-padded numbers. Each record has a status, date, context, decision and consequences. We write one for every new dependency and every architecture change.

## Consequences

- Versions are pinned exactly (`save-exact`), and Dependabot proposes weekly grouped updates.
- Later milestones check their own libraries again before adding them.
