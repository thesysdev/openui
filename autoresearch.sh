#!/usr/bin/env bash
set -euo pipefail

# Fast precheck.
[ -f packages/react-lang/tsconfig.json ]

pnpm --dir packages/react-lang build
