# Contributing Guidelines

Thank you for your interest in contributing to OpenUI. We want contributions to be easy to start, clear to review, and aligned with the direction of the project.

## Start With an Issue

Please open an issue before opening a pull request.

This applies to all contributions, including bug fixes, documentation changes, features, refactors, examples, and package changes. Once a maintainer has approved the issue and confirmed the direction, you can open a pull request linked to that issue.

This helps us avoid duplicate work, keep the project direction coherent, and make sure contributors do not spend time on changes that may not be accepted.

## Contribution Flow

1. Open an issue describing the change you want to make.
2. Wait for a maintainer to approve the issue or suggest a direction.
3. Fork the repository.
4. Create a new branch for your work.
5. Make your changes.
6. Run the relevant checks for the package or area you changed.
7. Open a pull request and link it to the approved issue.

Pull requests without an approved issue may be closed so the discussion can happen in the issue first.

Issues marked `good first issue` or `help wanted` are intended for community contributors. If you want to work on one of these issues, comment on the issue so maintainers and other contributors know you are interested.

## Getting Help

If you are unsure where to start, want feedback on an idea, or need help with an issue, join our [Discord](https://discord.gg/Pbv5PsqUSv). The maintainers and community can help you choose a good first issue, clarify the expected behavior, or review your approach before you begin.

If your pull request has been merged, message anyone with the `@admin` role in Discord and we will give you the Contributor role in the server.

## Development Setup

OpenUI is a pnpm workspace. Packages live in the `packages/` directory.

Install dependencies:

```sh
pnpm install
```

Run commands for a specific package with `pnpm --filter`:

```sh
pnpm --filter @openuidev/react-lang test
pnpm --filter @openuidev/react-lang lint:check
pnpm --filter @openuidev/react-lang build
```

Use the package name that matches the area you are changing.

## OpenUI Agent Skill

The OpenUI agent skill is maintained in the [thesysdev/skills repository](https://github.com/thesysdev/skills/tree/main/skills/openui), which is its source of truth.

To propose changes to the skill or its supporting references, open a pull request in `thesysdev/skills`.

## Before Opening a Pull Request

Before opening a pull request, please make sure that:

- The pull request links to an approved issue.
- The change is focused and avoids unrelated refactors.
- Tests are added or updated when behavior changes.
- Documentation or examples are updated when public behavior changes.
- Relevant lint, test, and build commands have been run.
- Any skipped checks are explained in the pull request description.
- If the change affects a published package under `packages/`, a changeset is
  included: run `pnpm changeset`, pick the affected packages and bump levels
  (patch for fixes and compatible changes; minor for breaking changes — all
  packages are 0.x), and commit the generated file. Releases are automated
  from these; see [`.changeset/README.md`](./.changeset/README.md).

## Bug Reports

Use GitHub Issues to report bugs. Please include:

- A clear description of the issue.
- Steps to reproduce the problem.
- Expected behavior.
- Actual behavior.
- Relevant package, component, or API.
- Environment details, including package versions when possible.

## Feature Requests

Use GitHub Issues for feature requests. Please include:

- The problem or use case you are trying to solve.
- The behavior or API you would like to see.
- Alternatives you considered.
- Examples, screenshots, or code snippets when helpful.

## Labels and triage

Two workflows label issues and pull requests.

[`auto-label.yml`](./.github/workflows/auto-label.yml) adds `type:` and `component:` labels when an issue or PR is opened or edited. The type comes from a conventional-commit title (`fix(react-lang): ...` gets `type: bug` and `component: react-lang`) or from the issue template. PRs get `component:` labels from the files they change, and issues from the package names they mention. It also adds `community: lab project` to project submissions and changes to `docs/lib/lab-projects.ts`, `community: adopters` to `ADOPTERS.md` changes, and `community: collab request` to partnership and integration requests. It only adds labels, so fix any wrong ones by hand.

[`triage.yml`](./.github/workflows/triage.yml) keeps `status: needs-triage` on the items that need a maintainer and takes it off the rest. It runs on issue, comment and review events, and once a day for every open item. An external contributor is anyone who isn't an owner, member or collaborator.

- An item with `status: waiting-for-author-response` is never flagged. The label is removed when someone outside the team replies.
- An item with `status: assigned-for-triage` is flagged if nobody is assigned, or if the label was added more than 14 days ago.
- A PR is flagged when it was opened by an external contributor and no maintainer has replied since their last comment.
- An issue is flagged when any of these is true:
  - It has external input (opened or commented by an external contributor) and no priority label (`P0`–`P3`).
  - It is `P0` or `P1` with no assignee.
  - It is assigned and is `P0` with no activity for a day, or `P1` with none for 30 days.
  - It is unassigned and the latest comment is from an external contributor.

To clear the flag, reply, set a priority, assign someone, or add `status: waiting-for-author-response`. The rules live in [`.github/scripts/triage.mjs`](./.github/scripts/triage.mjs). Test them with `node --test .github/scripts/*.test.mjs`.

## Contribution Guidelines

Please keep contributions focused and easy to review. Large refactors, public API changes, dependency changes, or changes that affect multiple packages should be discussed carefully in the issue before implementation starts.

When changing user-facing behavior, include enough context in the pull request for reviewers to understand the impact. For UI changes, screenshots or short recordings are helpful.

## Code of Conduct

By participating in this project, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
