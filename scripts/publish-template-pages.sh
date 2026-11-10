#!/usr/bin/env bash
# GitHub Pages publisher for template1..template60.
# No network writes happen in --check mode.
# Requires explicit --publish and an owner-provided token via Actions Secrets.
set -Eeuo pipefail

mode="${1:---check}"
if [[ "$mode" != "--check" && "$mode" != "--publish" ]]; then
  echo "Usage: bash scripts/publish-template-pages.sh [--check|--publish]" >&2
  exit 2
fi

root="$(cd "$(dirname "$0")/.." && pwd)"
bundle="$root/template-pages-dist"
[[ -f "$bundle/manifest.json" ]] || {
  echo "No bundles found. First run: BBWEB_OFFLINE_BUILD=1 npm run build && node scripts/build-template-pages.mjs" >&2
  exit 1
}
for i in $(seq 1 60); do
  site="$bundle/template$i"
  host="template$i.bisabikinweb.site"
  [[ -f "$site/index.html" && -f "$site/.bbweb-template-id" && -f "$site/CNAME" ]] || {
    echo "Incomplete template bundle: $site" >&2; exit 1;
  }
  [[ "$(cat "$site/CNAME")" == "$host" ]] || {
    echo "Unexpected custom domain for template$i" >&2; exit 1;
  }
  [[ "$(cut -d ' ' -f 1 "$site/.bbweb-template-id")" == "$i" ]] || {
    echo "Template ownership marker is missing or incorrect: $site" >&2; exit 1;
  }
done
echo "Preflight passed: 60 unique Pages bundles with correct CNAME and ownership markers."

if [[ "$mode" == "--check" ]]; then
  echo "Read-only check complete. No GitHub repositories or DNS records were changed."
  exit 0
fi

# GitHub Actions uses GH_TOKEN from a protected repository secret.
# For local deployment, gh auth login --web --scopes repo is sufficient:
# gh securely manages credentials, no PAT need be pasted into source or chat.
if [[ -z "${GH_TOKEN:-}" ]] && ! gh auth status --hostname github.com >/dev/null 2>&1; then
  echo "No authenticated GitHub CLI session. On your Mac run: gh auth login --hostname github.com --web --git-protocol https --scopes repo" >&2
  exit 1
fi
GH_OWNER="${GH_OWNER:-mejaviskinc}"
if [[ "${GH_OWNER:-}" != "mejaviskinc" ]]; then
  echo "Refusing unexpected GitHub repository owner." >&2
  exit 1
fi
for cmd in gh git rsync; do
  command -v "$cmd" >/dev/null || { echo "Missing dependency: $cmd" >&2; exit 1; }
done

# Confirm the credential belongs to the account that owns the domains.
logged_in="$(gh api user --jq .login)"
if [[ "$logged_in" != "$GH_OWNER" ]]; then
  echo "Publishing token belongs to '$logged_in', expected '$GH_OWNER'. No repositories changed." >&2
  exit 1
fi
gh auth setup-git >/dev/null

# Retry transient GitHub API propagation/rate-limit errors without force-pushing.
try_api() {
  local attempt=1
  while ! gh api "$@"; do
    if ((attempt >= 4)); then
      echo "GitHub Pages API failed after $attempt attempts. Rerun safely after inspecting permissions/rate limits." >&2
      return 1
    fi
    echo "GitHub Pages API retry $attempt/3 after delay..." >&2
    sleep $((attempt * 15))
    attempt=$((attempt+1))
  done
}
published=0
for i in $(seq 1 60); do
  name="bisabikinweb-template$i"
  fullname="$GH_OWNER/$name"
  host="template$i.bisabikinweb.site"
  source="$bundle/template$i"
  expected="$(cat "$source/.bbweb-template-id")"

  if gh repo view "$fullname" --json name >/dev/null 2>&1; then
    visibility="$(gh repo view "$fullname" --json visibility --jq .visibility)"
    if [[ "$visibility" != "PUBLIC" ]]; then
      echo "Refusing to update a non-public repository: $fullname" >&2
      exit 1
    fi
  else
    gh repo create "$fullname" --public --description "BisaBikinWeb interactive website template $i for $host" >/dev/null
    echo "Created $fullname"
  fi

  workdir="$(mktemp -d)"
  git clone --quiet "https://github.com/$fullname.git" "$workdir"
  if [[ -f "$workdir/.bbweb-template-id" ]]; then
    if [[ "$(cat "$workdir/.bbweb-template-id")" != "$expected" ]]; then
      echo "Refusing unrelated repository (ownership marker mismatch): $fullname" >&2
      rm -rf "$workdir"
      exit 1
    fi
  elif [[ -n "$(find "$workdir" -mindepth 1 -maxdepth 1 ! -name .git -print -quit)" ]]; then
    echo "Refusing to overwrite existing unrelated files: $fullname" >&2
    rm -rf "$workdir"
    exit 1
  fi

  rsync -a --delete --exclude '.git' "$source/" "$workdir/"
  git -C "$workdir" config user.name "github-actions[bot]"
  git -C "$workdir" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  git -C "$workdir" switch -C main >/dev/null
  git -C "$workdir" add -A
  if ! git -C "$workdir" diff --cached --quiet; then
    git -C "$workdir" commit -qm "Publish BisaBikinWeb website template $i"
    git -C "$workdir" push -q origin main
  fi
  rm -rf "$workdir"

  # Explicitly fix the source branch too if this is a rerun on an older Pages repo.
  if gh api "repos/$fullname/pages" >/dev/null 2>&1; then
    try_api -X PUT "repos/$fullname/pages" -f "cname=$host" -f "source[branch]=main" -f "source[path]=/" >/dev/null
  else
    try_api -X POST "repos/$fullname/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null
    try_api -X PUT "repos/$fullname/pages" -f "cname=$host" -f "source[branch]=main" -f "source[path]=/" >/dev/null
  fi

  actual="$(gh api "repos/$fullname/pages" --jq .cname)"
  if [[ "$actual" != "$host" ]]; then
    echo "Pages custom domain did not persist for $fullname; expected $host, got '$actual'." >&2
    exit 1
  fi
  published=$((published+1))
  echo "Configured GitHub Pages $published/60: $host"
  # Avoid aggressive bursts of GitHub repository creation and Pages API calls.
  sleep 8
done
echo "Requested publication for all $published sites. HTTPS certificates and public site content still require validation."
