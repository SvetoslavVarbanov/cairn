# 3. TypeScript 5.9 and Node 26

- Status: accepted
- Date: 2026-11-16
- Milestone: M0

## Context

- **TypeScript:** 7.0.2 is the latest on npm. TypeScript 7 has no JavaScript compiler API, so Next.js falls back to the `tsc` command line and loses its Next-specific type checks. `create-next-app` 16.4.6 installs TypeScript `^5`.
- **Node.js:** Node 26 became Active LTS on 2026-10-28 (supported until 2029-04-30). Node 24 moved to Maintenance LTS (supported until 2028-04-30). Next.js 16 needs at least Node 20.9, Vitest 5 needs 22.12, 24 or 26, and Playwright supports 22, 24 and 26. The owner's PC runs Node 26.13.1.
- We have not yet confirmed that Vercel runs Node 26.

## Decision

- **TypeScript 5.9.3**, with `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` and `noFallthroughCasesInSwitch`.
- **Node 26** for development (`.nvmrc`) and CI. `package.json` accepts Node 24 and up (`engines: >=24`), so the app also runs on Vercel if it only offers Node 24.
- `@types/node` follows the lowest supported runtime: `^24`.

## Consequences

- Dependabot ignores TypeScript and `@types/node` major updates. Revisiting TypeScript 7 is in the backlog.
- At M4 we check which Node versions Vercel supports and set the project to match.
