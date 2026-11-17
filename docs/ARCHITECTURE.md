# Architecture

A short overview of how Cairn is put together. The full reasoning is in [SPEC.md](SPEC.md) (sections 3.6 and 3.7). Individual decisions are recorded in [adr/](adr/).

Status legend: **now** means it exists at M0. Everything else lists the milestone where it arrives.

## Shape of the app

Cairn is a client-heavy Next.js 16 app (App Router, TypeScript strict). Data lives on the device first. A server only enters the picture at M5 for sync.

| Layer          | Where                       | Role                                                                                   | Arrives                                   |
| -------------- | --------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------- |
| UI             | `src/app`, `src/components` | Routes, screens and components. Reads data through hooks. No business rules here.      | Skeleton now, Today at M2, Progress at M3 |
| Domain         | `src/domain`                | Pure functions: `metrics.ts`, `schedule.ts`, `drift.ts`. No I/O, no React, no storage. | M1                                        |
| Local storage  | `src/data`                  | Dexie (IndexedDB) in `db.ts`, plus `repositories/` that the UI uses.                   | M2                                        |
| Sync           | `src/data/sync`             | Outbox that pushes to and pulls from Supabase.                                         | M5                                        |
| Shared helpers | `src/lib`                   | `supabase/`, `validation/` (Zod), `auth/`, `push/`, `utils.ts`.                        | `utils.ts` now, the rest from M5 on       |
| Route handlers | `src/app/api`               | `/api/log`, `/api/events`, `/api/push/*` for iOS Shortcuts and push.                   | M8                                        |
| Text           | `src/content/strings.ts`    | Every user-facing string, English first.                                               | Now                                       |

Rule of thumb: the UI asks repositories for data, repositories use Dexie, and the UI asks the domain layer to compute anything meaningful (strength, streaks, drift). The domain layer knows nothing about the rest.

## Data flow

1. A tap in the UI calls a repository.
2. The repository writes to Dexie and adds an entry to an outbox, in one step. The screen updates at once, even offline.
3. When sync runs (on open, on focus, when back online, or from "Sync now"), it pushes outbox upserts to Supabase, then pulls rows changed since the last sync.
4. Conflicts are resolved per row, last write wins, by `updated_at`.
5. Check-ins are idempotent on (habit, date), so syncing twice never doubles a stone.

Every table has `id` (a uuid made on the device), `user_id`, `created_at`, `updated_at` and `deleted_at` (soft delete). Steps 3 to 5 arrive at M5. Until then, steps 1 and 2 use Dexie only (from M2).

## Folder map

```
docs/            SPEC.md, ARCHITECTURE.md, USER-GUIDE.md, PROGRESS.md, BACKLOG.md, adr/
src/app/         routes (today, progress, review, settings, api/*)
src/components/  ui/ (shadcn), charts/, habit/, review/
src/content/     strings.ts
src/domain/      metrics.ts, schedule.ts, drift.ts   (pure, no I/O)
src/data/        db.ts (Dexie), repositories/, sync/
src/lib/         supabase/, validation/, auth/, push/, utils.ts
supabase/        migrations/, seed.sql, policy tests
tests/           unit/, integration/, e2e/, fixtures/
.claude/         settings.json, hooks/, agents/, skills/
.github/         workflows/, dependabot.yml, pull request template
```

Folders are created when they get real content, so at M0 most of `src/` is still empty.

## Testing strategy

| Kind        | Tool                | Covers                                                                                                            | Starts                                      |
| ----------- | ------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Unit        | Vitest              | Domain logic (95% coverage), hook logic, user-facing text rules and colour contrast. 70% overall for non-UI code. | Now (hooks, text, contrast), domain from M1 |
| Integration | Vitest              | Repositories (M2), and sync and RLS policies against a local Supabase.                                            | M2, sync from M5                            |
| End to end  | Playwright with axe | Critical flows, in Chromium and WebKit, at phone and desktop widths, with accessibility checks.                   | Set up now, flows from M2                   |

Tests are written with the code. A failing test is never weakened or deleted to get a green result.

## Quality gates

1. **Hooks** (`.claude/settings.json`): format and lint after every edit, and block risky commands such as deleting whole folders, `git clean`, pushes to `main`, and reading or editing `.env*` files. Now.
2. **Verify skill and reviewers**: the `verify` skill runs before each commit, and the code, security, accessibility and UX-copy reviewer agents check each slice. Now.
3. **`npm run check`**: typecheck, lint, format check, unit tests with coverage, build. Now.
4. **CI** (GitHub Actions): the same checks plus E2E with axe and `npm audit --audit-level=high` on every push and pull request. CodeQL, secret scanning with push protection and weekly grouped Dependabot updates run alongside. Now.
5. **Protected `main`**: pull requests with green checks only. Now.

## Milestone map

| Milestone | Adds                                                            |
| --------- | --------------------------------------------------------------- |
| M0        | Skeleton, tooling, docs, hooks, CI (this document describes it) |
| M1        | Domain logic in `src/domain`                                    |
| M2        | Dexie schema, repositories, Today screen                        |
| M3        | Progress screen, charts, heatmap                                |
| M4        | PWA install, export and import, Vercel hosting                  |
| M5        | Supabase, auth, RLS and the outbox sync                         |

Later milestones (M6 to M10) are listed in SPEC section 3.9.
