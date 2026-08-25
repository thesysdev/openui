# Changesets

Releases are automated with [changesets](https://github.com/changesets/changesets).

- PRs that change anything under `packages/` should include a changeset: run
  `pnpm changeset`, pick the affected packages and bump levels, and commit the
  generated file. Docs/CI-only changes don't need one.
- On every push to `main`, CI maintains a **Version Packages** PR carrying all
  pending bumps and changelogs. Merging that PR publishes to npm, tags, and
  creates GitHub Releases. Merge it whenever a release should go out.
- All packages are 0.x: a **patch** is the normal bump; a **minor** signals a
  breaking change (it escapes consumers' `^` ranges).
- Packages that runtime-depend on a bumped package are patch-bumped
  automatically — don't add changesets for them.
- Internal `peerDependencies` use hand-maintained bounded ranges (e.g.
  `">=0.3.0 <0.4.0"`), never `workspace:` protocol. If your change makes a
  package require a newer version of an internal peer, move that window in the
  same PR. See `docs/openui-release-management.md` in the design docs repo for
  the full rationale.
