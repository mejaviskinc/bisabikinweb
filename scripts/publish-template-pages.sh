#!/usr/bin/env bash
# Manual, opt-in publication: create 60 PUBLIC GitHub Pages repositories.
# GH_TOKEN must come from GitHub Actions Secrets, never from code or chat.
set -euo pipefail
if [[ "$#" -ne 1 || "$1" != "--publish" ]]; then
  echo "Dry run. Pass --publish only after reviewing the website bundles."
  exit 0
fi
if [[ ! -v GH_TOKEN || ! -v GH_OWNER ]]; then
  echo "GH_TOKEN and GH_OWNER must be set by the protected GitHub Actions workflow." >&2
  exit 1
fi
if [[ "$GH_OWNER" != "mejaviskinc" ]]; then
  echo "Refusing unexpected repository owner" >&2
  exit 1
fi
for cmd in gh git rsync; do command -v "$cmd" >/dev/null || { echo "Missing $cmd" >&2; exit 1; }; done
gh auth setup-git >/dev/null
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PACKAGE_DIR="$ROOT/template-pages-dist"
[[ -f "$PACKAGE_DIR/manifest.json" ]] || { echo "Build the 60 sites first." >&2; exit 1; }
count=0
for i in $(seq 1 60); do
  name="bisabikinweb-template$i"
  fullname="$GH_OWNER/$name"
  host="template$i.bisabikinweb.site"
  from="$PACKAGE_DIR/template$i"
  expected="$(cat "$from/.bbweb-template-id")"
  [[ "$(cat "$from/CNAME")" == "$host" ]] || { echo "Incorrect CNAME for $host" >&2; exit 1; }
  if gh repo view "$fullname" --json name >/dev/null 2>&1; then
    echo "Repository exists: $fullname"
  else
    gh repo create "$fullname" --public --description "BisaBikinWeb website demo $i - $host" >/dev/null
    echo "Created $fullname"
  fi
  tmp="$(mktemp -d)"
  git clone --quiet "https://github.com/$fullname.git" "$tmp"
  if [[ -f "$tmp/.bbweb-template-id" ]]; then
    [[ "$(cat "$tmp/.bbweb-template-id")" == "$expected" ]] || {
      echo "Refusing overwrite: $fullname belongs to another template" >&2
      rm -rf "$tmp"; exit 1;
    }
  elif [[ -n "$(find "$tmp" -mindepth 1 -maxdepth 1 ! -name '.git' -print -quit)" ]]; then
    echo "Refusing overwrite: $fullname contains unrelated files" >&2
    rm -rf "$tmp"; exit 1;
  fi
  rsync -a --delete --exclude '.git' "$from/" "$tmp/"
  git -C "$tmp" config user.name "github-actions[bot]"
  git -C "$tmp" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  git -C "$tmp" switch -C main >/dev/null
  git -C "$tmp" add -A
  if ! git -C "$tmp" diff --cached --quiet; then
    git -C "$tmp" commit -qm "Publish BisaBikinWeb template $i"
    git -C "$tmp" push -q origin main
  fi
  rm -rf "$tmp"
  if gh api "repos/$fullname/pages" >/dev/null 2>&1; then
    gh api -X PUT "repos/$fullname/pages" -f "cname=$host" >/dev/null
  else
    gh api -X POST "repos/$fullname/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null
    gh api -X PUT "repos/$fullname/pages" -f "cname=$host" >/dev/null
  fi
  echo "Published and configured Pages: $host"
  count=$((count+1))
  sleep 2
done
echo "Requested publication for $count of 60 sites. HTTPS certificates require separate verification."
