# 6. Public repository, personal details kept out of git

- Status: accepted
- Date: 2026-11-16
- Milestone: M0

## Context

The owner chose a public repository from day one. Public repositories get CodeQL code scanning, secret scanning with push protection and unlimited GitHub Actions minutes for free. The original specification mentions family members, private project ideas and personal habits, which do not belong in public.

## Decision

- The original spec and its PDF live in `docs/private/`, which git ignores. Personal answers (the first three habits and other decide-early choices) are kept in `docs/private/decisions.md`.
- `docs/SPEC.md` is the original word for word, except four sentences where personal details were replaced with neutral wording (family members, private ideas, sharing with someone close).
- What stays public on purpose: the spec's persona and starter prompt describe the kind of person the app is built for (a working professional studying for a master's who wants to scroll less) and three example habits. The features are built around them, so removing them would mean rewriting the spec. The owner's own final choices, such as the exact habits and their planned exceptions, stay in `docs/private/decisions.md`.
- Commits use the owner's GitHub no-reply address, so no personal email appears in the history.
- Repository settings:
  - secret scanning with push protection and Dependabot alerts are on;
  - `main` is protected: pull requests only, admins included, required status checks, linear history, no force pushes or deletion.
- Config avoids personal hints, such as a time zone in the Dependabot schedule.

## Consequences

- Anyone can read the code and docs. Reviews check that no personal data or secrets are added (the security reviewer covers this).
- Demo data for screenshots (M9) is made up, never the owner's real data.
