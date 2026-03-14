# Autoresearch: react-lang TypeScript build runtime

## Objective
Reduce wall-clock runtime of `@openuidev/react-lang` TypeScript build (`tsc -p .`) while preserving output correctness.

## Metrics
- **Primary**: build_wall_time (s, lower is better)
- **Secondary**: successful build exit, no source behavior changes, maintainability

## How to Run
`./autoresearch.sh` — outputs `METRIC build_wall_time=<number>`.

## Files in Scope
- `packages/react-lang/tsconfig.json`
- `packages/react-lang/src/**`
- `packages/react-lang/package.json`
- `autoresearch.sh`
- `autoresearch.md`
- `autoresearch.ideas.md`

## Off Limits
- Other packages unless absolutely required for local build correctness
- Public API behavior changes

## Constraints
- Build must pass.
- No new dependencies.
- Keep changes minimal and understandable.

## What's Been Tried
- Initial benchmark target (`benchmarks/run-benchmark.ts`) was not runnable in this workspace layout; switched target to `packages/react-lang` build runtime.
