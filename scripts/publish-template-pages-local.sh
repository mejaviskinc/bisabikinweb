#!/usr/bin/env bash
# Publish 60 standalone template sites using GitHub CLI browser login.
# No GitHub Actions secrets, Cloudflare, Netlify, or paid Hostinger hosting.
set -Eeuo pipefail
mode="${1:---check}"
if [[ "$mode" != "--check" && "$mode" != "--publish" ]]; then
  echo "Usage: bash scripts/publish-template-pages-local.sh [--check|--publish]" >&2
  exit 2
fi
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

for cmd in node npm git gh rsync; do
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "Command '$cmd' is missing on this computer." >&2
    echo "Install Node.js 22+ and GitHub CLI (gh), then run again." >&2
    exit 1
  }
done
if [[ "$mode" == "--publish" ]]; then
  if ! gh auth status --hostname github.com >/dev/null 2>&1; then
    echo "Log in with your browser: gh auth login --hostname github.com --web --git-protocol https --scopes repo" >&2
    exit 1
  fi
  username="$(gh api user --jq .login)"
  [[ "$username" == "mejaviskinc" ]] || {
    echo "GitHub CLI is signed into '$username', expected mejaviskinc." >&2
    exit 1
  }
fi
echo "Verifying original 60 website demos..."
npm ci --ignore-scripts --no-audit --no-fund
npm test
echo "Building full website assets and 60 standalone interactive demos..."
BBWEB_OFFLINE_BUILD=1 npm run build
node scripts/build-template-pages.mjs
node tests/template-pages-packages.test.mjs
echo "Running zero-write, credential-free validation..."
bash scripts/publish-template-pages.sh --check

if [[ "$mode" == "--check" ]]; then
  echo "All 60 website packages checked. No external repositories changed."
  echo "For browser-authenticated publishing run:"
  echo "  gh auth login --hostname github.com --web --git-protocol https --scopes repo"
  echo "  bash scripts/publish-template-pages-local.sh --publish"
  exit 0
fi

echo "Publishing to 60 PUBLIC repositories as mejaviskinc. Existing unrelated repositories are protected."
GH_OWNER=mejaviskinc bash scripts/publish-template-pages.sh --publish
echo "Publishing requests finished. Check HTTPS on each subdomain before enabling catalog links."
