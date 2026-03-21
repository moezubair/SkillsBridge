#!/usr/bin/env bash
set -euo pipefail
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLSBRIDGE="$(dirname "$BACKEND_DIR")"

run_with() {
  echo "Using: $1" >&2
  cd "$BACKEND_DIR"
  exec "$1" main.py
}

if [[ -x "$SKILLSBRIDGE/.lotushack/bin/python" ]]; then
  run_with "$SKILLSBRIDGE/.lotushack/bin/python"
fi
if [[ -x "$BACKEND_DIR/venv/bin/python" ]]; then
  run_with "$BACKEND_DIR/venv/bin/python"
fi
if command -v python3 >/dev/null 2>&1; then
  run_with "$(command -v python3)"
fi
echo "No Python found. Create venv and: pip install -r requirements.txt" >&2
exit 1
