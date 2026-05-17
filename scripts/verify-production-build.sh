#!/usr/bin/env bash
set -euo pipefail

echo "→ Building production artifacts…"
npm run build

echo "→ Checking client dist…"
test -f client/dist/index.html

echo "→ Checking server dist…"
test -f server/dist/index.js

echo "✓ Production build verified"
