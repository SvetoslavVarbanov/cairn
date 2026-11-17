# Security Policy

## Supported versions

Cairn is young. Only the latest state of the `main` branch, and the latest release once releases exist, receive security fixes.

## Reporting a vulnerability

Please report security problems privately. Do not open a public issue, discussion or pull request for them.

1. Go to the repository on GitHub and open the **Security** tab.
2. Choose **Report a vulnerability** (GitHub private vulnerability reporting).
3. Describe what you found, how to reproduce it, and what you think the impact is. Screenshots or a short proof of concept help.

If you don't see **Report a vulnerability**, open a short issue that only asks for a private way to get in touch. Leave out every detail of the problem.

Please do not include real personal data in your report.

## What to expect

- We will acknowledge your report, aiming for within a few days.
- We will look into it, keep you updated, and work on a fix.
- When the fix is released, we will describe the issue in the changelog and credit you if you would like. Tell us how you want to be named, or say you prefer to stay anonymous.

Cairn is a hobby-sized open-source project run by one person, so please be patient. We will do our best.

## Scope notes

These points describe how Cairn is designed, and help you judge what counts as a problem:

- **Local-first.** Your habit data lives on your own device (IndexedDB). Until sync exists, nothing leaves the device.
- **No analytics or trackers.** Cairn does not send usage data to third parties.
- **Secrets stay on the server.** Keys and tokens live only in server environment variables. They must never appear in client code or in git. Only `.env.example` is committed.
- **Row-Level Security.** Once sync arrives (milestone M5), every Supabase table will have Row-Level Security so one person can never read another person's data, and this will be covered by automated policy tests.

Findings that show a secret in the repository, a way to read another user's data, or a way to run code on a server are all in scope and welcome.
