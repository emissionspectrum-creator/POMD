#!/bin/bash
# SessionStart hook (local and cloud):
#   1. cloud only: install PyYAML for build.py
#   2. both: bring the current branch up to date with origin/main
# Messages printed to stdout are added to Claude's context.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ]; then
  if ! python3 -c "import yaml" 2>/dev/null; then
    pip install --quiet pyyaml || echo "[sync] WARNING: pip install pyyaml failed."
  fi
fi

if ! timeout 30 git fetch --quiet origin main 2>/dev/null; then
  echo "[sync] WARNING: git fetch origin main failed; working copy may be out of date."
  exit 0
fi

branch=$(git rev-parse --abbrev-ref HEAD)
behind=$(git rev-list --count HEAD..origin/main)
ahead=$(git rev-list --count origin/main..HEAD)

if [ "$behind" -eq 0 ]; then
  echo "[sync] $branch is up to date with origin/main (ahead $ahead)."
  exit 0
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "[sync] WARNING: $branch is $behind commit(s) behind origin/main, but there are uncommitted changes, so it was not updated. Tell the user before editing."
  exit 0
fi

if git rebase --quiet origin/main >/dev/null 2>&1; then
  echo "[sync] Rebased $branch onto origin/main (+$behind commit(s) pulled, $ahead local commit(s) kept)."
else
  git rebase --abort >/dev/null 2>&1
  echo "[sync] WARNING: rebasing $branch onto origin/main hit conflicts and was aborted. Tell the user and resolve before editing (see CLAUDE.md, 同步)."
fi
exit 0
