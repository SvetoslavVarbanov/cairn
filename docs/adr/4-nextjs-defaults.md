# 4. Next.js defaults we switch off

- Status: accepted
- Date: 2026-11-16
- Milestone: M0

## Context

Since Next.js 16.4, `create-next-app` turns on by default:

- **Cache Components**, server-side caching with `use cache`;
- **agent feedback**, which prepares anonymised feedback to Next.js;
- Next.js's anonymous **telemetry**.

It also writes an `AGENTS.md` that points coding agents to the documentation shipped inside `node_modules/next`, matched to the installed version.

Cairn is local-first. Screens read data from IndexedDB on the device, and the server has no user data to cache until sync arrives in M5. The spec's privacy rule is that no usage data goes to third parties.

## Decision

- Scaffold with `--no-cache-components` and `--no-agent-feedback`.
- Turn telemetry off:
  - `next telemetry disable` on the owner's PC;
  - `NEXT_TELEMETRY_DISABLED=1` in CI, in the Playwright test server, and in `.claude/settings.json`.
- Keep `AGENTS.md`, and import it from `CLAUDE.md`, so agents read the documentation for the exact Next.js version installed.
- Set `poweredByHeader: false`.
- Load the Geist font through `next/font`, which downloads it at build time and serves it from our own domain, so visitors never contact Google.

## Consequences

- There is less server-side surface to secure. The November 2026 Next.js security release mostly concerned `use cache`.
- If a future server feature benefits from Cache Components, it gets its own ADR.
