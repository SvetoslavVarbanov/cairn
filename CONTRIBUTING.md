# Contributing to Cairn

Thank you for wanting to help. Cairn is a small, calm habit tracker, and we want to keep it that way. Small, careful changes are the best kind.

By taking part, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Start with an issue

For anything bigger than a typo or a tiny fix, please open an issue first and describe what you would like to change and why. This saves you from building something that does not fit. Ideas that are out of scope for the current milestone go in [docs/BACKLOG.md](docs/BACKLOG.md), not into the code.

Please read [docs/SPEC.md](docs/SPEC.md) before proposing features. It explains the principles: frictionless, calm, forgiving, honest progress, privacy-first, small.

## Run it locally

Cairn works on Windows, macOS and Linux. You need Node 26 (anything from Node 24 up should work) and npm.

1. Fork and clone the repository.
2. Install exactly what the lock file says: `npm ci`
3. Start the dev server: `npm run dev`
4. Open http://localhost:3000

Useful commands:

| Command            | What it does                                                       |
| ------------------ | ------------------------------------------------------------------ |
| `npm run check`    | Typecheck, lint, format check, unit tests with coverage, and build |
| `npm run test`     | Unit tests only                                                    |
| `npm run test:e2e` | End-to-end tests with accessibility checks                         |
| `npm run format`   | Tidy the formatting                                                |

The first time you run the end-to-end tests, install the browsers once:

```
npx playwright install chromium webkit
```

Run `npm run check` before you open a pull request.

## Branches, commits and pull requests

The `main` branch is protected. Changes arrive only through pull requests with green checks.

1. Create a branch from `main`, for example `feat/today-screen` or `fix/heatmap-label`.
2. Make small commits using [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.
3. Push and open a pull request. Say what changed and why, in plain language.
4. Wait for CI to pass, then address review comments.

Keep each pull request focused on one thing. Update the docs and `CHANGELOG.md` when behaviour changes.

## Tests

- Tests come with the code, in the same pull request. Write the test first when you can.
- Never weaken, skip or delete a test just to make it pass. If a test is wrong, explain why in the pull request and fix it properly.
- Pure logic belongs in `src/domain` and needs very high coverage (95%).
- User flows are covered by Playwright tests with axe accessibility checks.

## Decisions and dependencies

Every new dependency and every architecture change gets a short decision record (ADR) in [docs/adr/](docs/adr/). Say what you chose, what you considered, and why. If you are unsure whether something needs one, it probably does.

## Words in the app

All user-facing text lives in `src/content/strings.ts`, never scattered through components. This also keeps translation possible later.

Write in the voice of SPEC section 3.2: calm, warm, brief and never shaming. A missed day is fine. Celebrate coming back. No red guilt states, no scary warnings.

## Accessibility

Cairn aims for WCAG 2.2 AA. In practice:

- Everything works with a keyboard, with a visible focus state.
- Touch targets are at least 44 px.
- Colour contrast passes AA in both light and dark themes.
- Charts have text alternatives.
- Motion is short (300 ms or less) and switched off when the user prefers reduced motion.

## Secrets and privacy

Never commit secrets, keys, tokens or personal data. Keep local values in `.env.local` (which is git-ignored) and commit only `.env.example` with empty placeholders. No analytics or trackers, ever. If you think you leaked a secret, tell the maintainer right away so it can be rotated.

To report a security problem, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
