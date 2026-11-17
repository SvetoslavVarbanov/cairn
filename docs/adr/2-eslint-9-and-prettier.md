# 2. ESLint 9 and Prettier

- Status: accepted
- Date: 2026-11-16
- Milestone: M0

## Context

The spec asks for ESLint with the Next.js, TypeScript, jsx-a11y and react-hooks rules plus Prettier, with Biome as an acceptable alternative, decided once at M0.

What we found:

- ESLint 10.15 is current. npm now marks ESLint 9.39.5 as "no longer supported".
- Next.js's own `create-next-app` 16.4.6 still installs ESLint `^9`.
- `eslint-config-next` 16.4.6 bundles `eslint-plugin-react`, `eslint-plugin-import` and `eslint-plugin-jsx-a11y`, whose supported ESLint range stops at 9. Installing ESLint 10 would need `--legacy-peer-deps`, which loosens dependency checks for the whole project.
- Biome is supported and fast, but its accessibility and Next.js rules are a subset of jsx-a11y and `@next/eslint-plugin-next`.

## Decision

Use **ESLint 9.39.5** with `eslint-config-next` (core web vitals and TypeScript), the **strict** jsx-a11y rule set, `no-explicit-any` as an error, and **Prettier 3** with `eslint-config-prettier`. Lint runs with `--max-warnings=0`.

## Consequences

- ESLint only runs on developer machines and in CI. It never ships to users, so the end of its support is a low risk. If ESLint 9 gets a security advisory, `npm audit --audit-level=high` in CI will catch it.
- Dependabot ignores ESLint major updates until we move. Moving to ESLint 10 is in the backlog for when `eslint-config-next` and its plugins support it.
