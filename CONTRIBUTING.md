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

## Contribution Guidelines

Please keep contributions focused and easy to review. Large refactors, public API changes, dependency changes, or changes that affect multiple packages should be discussed carefully in the issue before implementation starts.

When changing user-facing behavior, include enough context in the pull request for reviewers to understand the impact. For UI changes, screenshots or short recordings are helpful.

## Code of Conduct

By participating in this project, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
