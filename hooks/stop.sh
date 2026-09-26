#!/usr/bin/env bash
# Frontend Kit — Stop hook (learning consolidation)
#
# Signals accumulate during a session: blocked writes (mistakes caught in the
# act) and developer corrections. They are worthless unless something turns
# them into durable project knowledge before the context is gone.
#
# This hook watches the ledger and prompts consolidation. It escalates from a
# nudge to a forced continuation once enough unconsolidated signals pile up,
# because a nudge alone is exactly what the skills-only approach already proved
# insufficient.

set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
KIT="$ROOT/.claude/frontend-kit"
LEDGER="$KIT/.signals.jsonl"

[ -f "$KIT/project-profile.json" ] || exit 0
[ -f "$LEDGER" ] || exit 0

TOTAL=$(grep -c . "$LEDGER" 2>/dev/null || echo 0)
[ "$TOTAL" -gt 0 ] || exit 0

DENIES=$(grep -c '"kind":"guard-deny"' "$LEDGER" 2>/dev/null || echo 0)
CORRECTIONS=$(grep -c '"kind":"correction"' "$LEDGER" 2>/dev/null || echo 0)

SESSION_ID="$(sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' <<<"$(cat 2>/dev/null || true)" | head -1)"
FORCED_MARKER="${TMPDIR:-/tmp}/frontend-kit-consolidated-${SESSION_ID:-nosession}"

# Encode a multi-line string as a JSON string body (escape \, ", then fold newlines).
json_escape() {
  printf '%s' "$1" \
    | sed 's/\\/\\\\/g; s/"/\\"/g' \
    | awk 'BEGIN{ORS=""} {print (NR>1 ? "\\n" : "") $0}'
}

DIRECTIVE="<frontend-kit-learning>
This session accumulated ${TOTAL} unconsolidated learning signal(s): ${DENIES} blocked write(s) and ${CORRECTIONS} developer correction(s), recorded in \`.claude/frontend-kit/.signals.jsonl\`.

Before finishing, invoke the \`kit-self-improve\` skill and do this:
1. Read the ledger. Look for PATTERNS, not individual events — three REUSE denials is one
   missing convention, not three separate notes.
2. Write only what passes the test: will a future session do better work because this is
   written down? Skip anything obvious from the codebase or already in CLAUDE.md.
3. Route each item — conventions.md for how this project does things, learnings.md for
   corrections and gotchas with their reasons, breakpoints.md / design-tokens.md for values.
4. Truncate \`.signals.jsonl\` once consolidated, so the same signals are not re-learned.
5. Tell the developer in one line what you recorded and where.
</frontend-kit-learning>"

# Below the threshold, or already forced once this session: nudge only.
if [ "$TOTAL" -lt 3 ] || [ -f "$FORCED_MARKER" ]; then
  printf '{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"%s"}}\n' \
    "$(json_escape "$DIRECTIVE")"
  exit 0
fi

# Threshold reached and not yet forced: block the stop so consolidation happens.
# The directive goes to BOTH channels — additionalContext on stdout is the
# documented path for Stop, stderr carries the blocking reason.
touch "$FORCED_MARKER" 2>/dev/null || true

IMPERATIVE="$DIRECTIVE
YOUR NEXT ACTION IS NOT OPTIONAL AND NOT A QUESTION: write the consolidated learnings to
\`.claude/frontend-kit/conventions.md\` and/or \`.claude/frontend-kit/learnings.md\` now,
using the Write or Edit tool, then truncate \`.claude/frontend-kit/.signals.jsonl\`.
Do not reply that there is nothing to do — ${TOTAL} signals are on disk. Do not ask
permission. Do this, state in one line what you recorded, then finish."

printf '{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"%s"}}\n' \
  "$(json_escape "$IMPERATIVE")"
printf '%s\n' "$IMPERATIVE" >&2
exit 2
