---
name: git-workflow
description: Branch model, commit and PR conventions, what needs explicit permission, and what may never appear in public artifacts. Use before any git or GitHub action.
user-invocable: true
---

# Git Workflow

Remote: `https://github.com/ndlabdev/sv5ui-scheduler` (HTTPS through `gh`; this machine has no SSH key).

## Branch model

- `dev` - integration branch. All feature and fix PRs target `dev`.
- `main` - released branch. Moves only by a `dev -> main` PR at release time. Will be protected (PR required, CI green, no force push).
- Branch from `dev`: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `chore/<slug>`. Add `<issue#>-` after the type when there is an issue.

## Permission

**Never commit, push, amend, rebase, force-push, tag, or open/merge a PR without explicit permission in the current turn.** Approval to fix something is not approval to commit it; approval to commit is not approval to push. One approval does not cover the next action.

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

## Pull requests

`gh pr create --base dev --assignee @me`, body with Summary, Changes, and a checklist confirming `pnpm check`, `pnpm lint`, `pnpm test` are green.

Label by prefix: `fix -> bug`, `feat -> enhancement`, `docs -> documentation`.

## What never appears in public artifacts

README, package description, issues, PRs, commit messages, CHANGELOG, and the docs site are public. They contain **only** what the product does.

- No naming of third-party libraries when describing parity decisions - say "matches common library conventions".
- No internal planning: roadmap, analysis, business reasoning. All of that lives in `docs/`, which is gitignored.
- No AI attribution of any kind.

Before committing any public-facing file, read it once as a stranger would and remove anything that is not a description of what the code does.

## Changelog

Keep a Changelog format. Add entries under `## [Unreleased]` grouped `Added` / `Changed` / `Fixed` / `Removed`, scoped by component: `- **WeekView**: ...`. Say what changed and why, not which files moved.

## Quality gates before any PR

```bash
pnpm check   # 0 errors, 0 warnings
pnpm lint
pnpm test
pnpm build   # when exports changed
```
