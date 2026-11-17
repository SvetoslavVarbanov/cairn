# Cairn

A calm personal habit and growth tracker. Each check-in adds a stone to the pile.

Cairn is an installable web app (PWA) for a PC and an iPhone. It aims to take under a minute a day: three habits at most to start, one tap to check in, forgiving weekly targets, and honest views of slow progress. Your data stays on your device first and can be exported at any time. No analytics, no trackers.

**Status:** early development. Milestone M0 (foundations) is in place; the first usable version arrives with M2. See [docs/PROGRESS.md](docs/PROGRESS.md).

## Run it locally

You need [Node.js](https://nodejs.org/) 26 (24 or newer works) and npm. On Windows, macOS or Linux:

```bash
npm ci
npm run dev
```

Then open http://localhost:3000.

| Command            | What it does                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`      | Start the app for development                                                                                         |
| `npm run check`    | Typecheck, lint, format check, unit tests with coverage, build                                                        |
| `npm run test:e2e` | Browser tests in Chromium and WebKit with accessibility checks (first time: `npx playwright install chromium webkit`) |
| `npm run format`   | Tidy the formatting                                                                                                   |

## Documentation

- [Specification](docs/SPEC.md): what Cairn is and why
- [Architecture](docs/ARCHITECTURE.md) and [decision records](docs/adr/)
- [Progress](docs/PROGRESS.md) and [backlog](docs/BACKLOG.md)
- [User guide](docs/USER-GUIDE.md)
- [Contributing](CONTRIBUTING.md), [Code of Conduct](CODE_OF_CONDUCT.md), [Security](SECURITY.md), [Changelog](CHANGELOG.md)

Cairn is built with [Claude Code](https://claude.com/claude-code) in small, tested slices behind automatic checks. Project rules for the agent are in [CLAUDE.md](CLAUDE.md).

## License

[MIT](LICENSE)
