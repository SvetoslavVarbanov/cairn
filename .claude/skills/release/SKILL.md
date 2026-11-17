---
name: release
description: Cut a Cairn release - pick the version, update the changelog, tag main and check the deployment. Use only when the owner asks for a release.
disable-model-invocation: true
---

# Release Cairn

1. **Start clean:** on `main`, pulled, with every CI check green and nothing uncommitted.
2. **Pick the version** (Semantic Versioning; we are in `0.x` until v1.0.0 at M9):
   - a finished milestone or new feature: minor (`0.3.0` to `0.4.0`);
   - fixes only: patch (`0.4.0` to `0.4.1`).
3. **Prepare on a branch** `chore/release-vX.Y.Z`:
   - In `CHANGELOG.md`, move the `Unreleased` entries under `## [X.Y.Z] - YYYY-MM-DD`.
   - `npm version X.Y.Z --no-git-tag-version` to update `package.json` and the lock file.
   - Commit `chore(release): vX.Y.Z`, push, open a pull request, wait for green CI, merge.
4. **Tag main:** `git switch main && git pull`, then `git tag -a vX.Y.Z -m "vX.Y.Z"` and `git push origin vX.Y.Z` (push the tag by name; plain `git push` from main is blocked by the safety hook).
5. **GitHub release:** `gh release create vX.Y.Z --title "vX.Y.Z" --notes-from-tag`, or paste the changelog section as notes.
6. **Check the deployment** (from M4): confirm Vercel deployed `main`, open the production URL, and run the smoke checks: the app loads, it works offline after one visit, and data is still there after a reload.
7. **Tell the owner** in plain words what is in the release and anything to try on the iPhone.
