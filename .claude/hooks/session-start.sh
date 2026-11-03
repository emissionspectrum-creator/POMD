#!/bin/bash
# SessionStart hook: prepare cloud (Claude Code on the web) sessions.
# Local sessions skip this; the local machine already has PyYAML.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# build.py needs PyYAML
if ! python3 -c "import yaml" 2>/dev/null; then
  pip install --quiet pyyaml
fi
