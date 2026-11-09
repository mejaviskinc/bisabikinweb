#!/usr/bin/env bash
# Compare base and candidate using the same browser, OS and viewport.
# This script never deploys and never silently approves changed screenshots.
set -Eeuo pipefail
BASE_REF="${UI_BASE_SHA:-HEAD^}"
BASE_DIR="$(mktemp -d)"
BASE_PID=""
CANDIDATE_PID=""
cleanup() {
  if [[ -n "$BASE_PID" ]]; then kill "$BASE_PID" 2>/dev/null || true; fi
  if [[ -n "$CANDIDATE_PID" ]]; then kill "$CANDIDATE_PID" 2>/dev/null || true; fi
  git worktree remove --force "$BASE_DIR" 2>/dev/null || rm -rf "$BASE_DIR"
}
trap cleanup EXIT

echo "Preparing base revision: $BASE_REF"
git worktree add --detach "$BASE_DIR" "$BASE_REF"
(
 cd "$BASE_DIR"
 npm ci --ignore-scripts --no-audit --no-fund
 BBWEB_OFFLINE_BUILD=1 npm run build
)
python3 -m http.server 4174 --bind 127.0.0.1 --directory "$BASE_DIR/site-dist" > /tmp/bbw-base-http.log 2>&1 &
BASE_PID=$!
for i in $(seq 1 30); do
 if curl -fsS -o /dev/null http://127.0.0.1:4174/; then break; fi
 sleep 1
done
curl -fsS -o /dev/null http://127.0.0.1:4174/
echo "Creating baseline screenshots from base revision"
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174 npx playwright test --config tests/visual/playwright.config.mjs --grep '@visual' --update-snapshots

echo "Testing and building candidate"
npm test
BBWEB_OFFLINE_BUILD=1 npm run build
npm run test:output

python3 -m http.server 4173 --bind 127.0.0.1 --directory site-dist > /tmp/bbw-candidate-http.log 2>&1 &
CANDIDATE_PID=$!
for i in $(seq 1 30); do
 if curl -fsS -o /dev/null http://127.0.0.1:4173/; then break; fi
 sleep 1
done
curl -fsS -o /dev/null http://127.0.0.1:4173/
echo "Running candidate visual regression and interaction tests"
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npx playwright test --config tests/visual/playwright.config.mjs
echo "UI quality gate PASSED; no production deployment requested."
