#!/bin/bash
# Deploy this app to the Railway project "f1-dashboard" (service "web").
# Copies the app without secrets or build output, but with the data/ snapshot, then runs `railway up`.
set -euo pipefail
APP="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
rsync -a \
  --exclude node_modules --exclude .next --exclude '.env*' --exclude '*.tsbuildinfo' \
  --exclude next-env.d.ts --exclude src/generated --exclude pnpm-lock.yaml \
  --exclude public/car3d-reference.jpg --exclude .gitignore \
  "$APP/" "$STAGE/"
cd "$STAGE"
railway up --ci -p 5ecacb97-e637-44bc-be9d-45027793dece -e production -s web
