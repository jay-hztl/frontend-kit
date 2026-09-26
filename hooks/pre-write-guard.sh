#!/usr/bin/env bash
# Frontend Kit — PreToolUse (Write) shim
#
# Delegates to guard.mjs, which enforces the component-reuse and responsive
# rules before a UI file is written. PostToolUse cannot block, so the check has
# to live here.
#
# Fails OPEN: if Node is unavailable, or the guard errors, the write proceeds.
# A developer must never be blocked because a linter could not start.

set -uo pipefail

command -v node >/dev/null 2>&1 || exit 0
exec node "$(dirname "$0")/guard.mjs"
