---
name: git-workflow
description: Issue, branch, commit, PR and release flow, what needs explicit permission, and what may never appear in public artifacts. Use before any git or GitHub action.
user-invocable: true
---

# Git Workflow

Remote: `https://github.com/ndlabdev/sv5ui-scheduler` (HTTPS through `gh`; this machine has no SSH key).

## Permission

**Never commit, push, amend, rebase, force-push, tag, publish, or open/merge a PR without explicit permission in the current turn.** Approval to fix something is not approval to commit it; approval to commit is not approval to push. One approval does not cover the next action. Creating issues, labels and repository settings is also a GitHub action that needs permission.

## The flow

```
issue -> branch from dev -> PR into dev (CI green, squash) -> ... -> release PR dev into main (merge commit) -> tag vX.Y.Z -> publish workflow
```

### 1. Issue

Every bug or feature starts as an issue created from a template, which adds `bug` or `enhancement` plus `status: needs-triage`.

Triage replaces `status: needs-triage` with `status: confirmed` and adds one `area:` label. Set `status: in-progress` when a branch exists.

| Label                                                                                           | Meaning                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `bug`, `enhancement`, `documentation`, `accessibility`                                          | Kind of work                               |
| `status: needs-triage`, `status: confirmed`, `status: in-progress`                              | Where the issue stands                     |
| `area: views`, `area: interactions`, `area: store`, `area: time`, `area: sidebar`, `area: i18n` | Part of the code                           |
| `breaking`                                                                                      | Needs a major bump (minor while below 1.0) |
| `release`                                                                                       | A release PR from `dev` into `main`        |

### 2. Branch

Branch from an up-to-date `dev`: `fix/<issue#>-<slug>`, `feat/<issue#>-<slug>`, `docs/...`, `chore/...`, `refactor/...`, `test/...`.

Never branch from `main` for normal work: `main` lacks everything unreleased on `dev`, so the fix would be written and tested against old code and conflict on the way in. The only exception is a hotfix (below).

### 3. Pull request into `dev`

```bash
gh pr create --base dev --assignee @me --label bug
```

- Fill the PR template; the body carries `Closes #<issue>` so merging closes the issue.
- Add one entry to `CHANGELOG.md` under `## [Unreleased]`.
- CI (`.github/workflows/ci.yml`, check name `ci`) must be green. `dev` is protected: no direct push.
- **Squash merge**, title in Conventional Commits form. The branch is deleted on merge.

Label by prefix: `fix -> bug`, `feat -> enhancement`, `docs -> documentation`.

### 4. Release

When `dev` holds enough for a release:

1. Branch `chore/release-vX.Y.Z` from `dev`. Bump `version` in `package.json`, rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD` and open a fresh empty `## [Unreleased]` above it. PR into `dev`, squash merge.
2. Open the release PR: `gh pr create --base main --head dev --title "Release vX.Y.Z" --label release`.
3. Merge it with a **merge commit**, never squash. A squash rewrites the history of `dev` on `main`, and every later release PR then conflicts.
4. Tag the merge commit on `main` and push the tag:

    ```bash
    git fetch origin && git tag -a vX.Y.Z origin/main -m "vX.Y.Z" && git push origin vX.Y.Z
    ```

5. `.github/workflows/publish.yml` runs on the tag. It refuses a tag that does not match `package.json` or is not on `main`, and a version without a CHANGELOG section. It builds, runs `npm publish --provenance` (versions with a `-` go to the `next` dist-tag) and creates the GitHub release from that CHANGELOG section.

Versioning below 1.0: `fix` bumps the patch, `feat` bumps the minor, `breaking` bumps the minor and says so in CHANGELOG under `### Changed`.

### 5. Hotfix

Only for a bug in the released version that cannot wait for the next release:

1. Branch `hotfix/<issue#>-<slug>` from `main`, fix, bump the patch version and move the entry into a new `## [X.Y.Z]` section.
2. PR into `main`, merge commit, tag, publish as above.
3. PR `main` into `dev` with a merge commit so `dev` gets the fix and the version.

## Protection

- `main`: PR required, CI `ci` green and up to date, no force push, no deletion, applies to admins.
- `dev`: PR required, CI `ci` green, no force push, no deletion, applies to admins.
- Default branch is `dev`, so new PRs target it. Rebase merge is disabled.
- `NPM_TOKEN` is a repository secret: an npm automation token with publish rights on the `@sv5ui` scope.

## Commits

Conventional Commits, scope = component or module in lowercase:

```
feat(store): add EventStore with snapshot and restore
fix(week-view): keep event in place across DST fall-back
test(time): add DST golden table for Australia/Sydney
chore(ci): run gates on dev
```

Allowed types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`.

- Stage only the files of this change. Never a blanket `git add -A` that sweeps in unrelated untracked files.
- The commit message carries the **why**. That is where reasoning goes, since the code carries no comments.
- **No AI or tool attribution**, in commits or PR bodies: no `Co-Authored-By: Claude`, no `Generated with Claude Code`, no footer of any kind.

## What never appears in public artifacts

README, package description, issues, PRs, commit messages, CHANGELOG, release notes and the docs site are public. They contain **only** what the product does.

- No naming of third-party libraries when describing parity decisions: say "matches common library conventions".
- No internal planning: roadmap, analysis, business reasoning, licensing or tiers. All of that lives in `docs/`, which is gitignored.
- No AI attribution of any kind, and no em dashes, emoji or arrow characters.

Before committing any public-facing file, read it once as a stranger would and remove anything that is not a description of what the code does.

## Changelog

Keep a Changelog format. Add entries under `## [Unreleased]` grouped `Added` / `Changed` / `Fixed` / `Removed`, scoped by component: `- **WeekView**: ...`. Say what changed and why, not which files moved. Link the PR at the end of the entry once it exists: `([#12](https://github.com/ndlabdev/sv5ui-scheduler/pull/12))`.

## Quality gates before any PR

```bash
pnpm check   # 0 errors, 0 warnings
pnpm lint
pnpm test
pnpm build   # when exports changed
```
