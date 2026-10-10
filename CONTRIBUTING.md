# Contributing to rdloom

Thank you for helping. This page explains how we organise the work so every change is easy to follow.

## Branches

| Branch | What it is for |
|---|---|
| `main` | The released, stable version. Nothing is committed here directly: it only receives merges from `release/*` and `hotfix/*`. |
| `develop` | Where finished work comes together and is tested before a release. |
| `feature/<short-name>` | One new component, block or change. Start from `develop`, open a pull request back into `develop`. |
| `fix/<short-name>` | One bug fix. Start from `develop`, open a pull request back into `develop`. |
| `release/<major.minor>` | One branch per version line, for example `release/0.2`. Only fixes and the version bump go here while the version is prepared. |
| `hotfix/<short-name>` | An urgent fix to what is already released. Start from `main`, merge into `main` and `develop`. |

Examples: `feature/date-range-presets`, `fix/table-sort-focus`, `release/0.2`.

## Versions and releases

We use version numbers of the form `major.minor.patch` (for example `0.2.1`).

1. Work is merged into `develop` and tested there.
2. When `develop` is ready, create `release/<major.minor>` from it.
3. On the release branch, update `version` in `packages/cli/package.json` and `packages/mcp/package.json`, and fix only what testing finds.
4. Merge the release branch into `main`, then tag the commit `v<version>`, for example `v0.2.0`. The tag starts the release workflow, which stages the npm packages.
5. Merge `main` back into `develop` so they match.

Use the Actions tab to run **Release** with "dry run" first. It shows what would be published without publishing anything.

## Commits

- Write one plain sentence in the imperative: `Add the date range presets` or `Fix focus loss when sorting the table`.
- Say what changed and why it matters. Keep it specific and short.
- Add details in the body only when they help a reader later.
- Do not include secrets, tokens or personal files.

## Before you open a pull request

```bash
npm ci
npm run build           # generates files, typechecks and runs all unit tests
npm run check:generated # generated files must match the specs
npm run build:docs      # the docs site must build and pass its search checks
```

If you changed anything visible, also run `npm run test:visual`. If you changed a spec, run `npm run gen` and commit what it changes.

Every new component needs: a spec in `specs/`, the component, working examples, tests (including keyboard use and `axe` accessibility), and a docs entry. Look at a recent small component such as `separator` for the pattern.

## Pull requests

- Target `develop` unless it is a hotfix.
- Keep each pull request to one idea.
- Describe what you changed and how you tested it. The template will ask.
- CI must pass before merging.

## Reporting problems

- Bugs and questions: [open an issue](https://github.com/DevHydeOut/rdloom/issues/new/choose).
- Security issues: use [private reporting](https://github.com/DevHydeOut/rdloom/security/advisories/new), as described in [SECURITY.md](SECURITY.md).
