#!/usr/bin/env bash
# Frontend Kit — Stop hook (learning consolidation)
#
# Signals accumulate during a session: blocked writes (mistakes caught in the
# act) and developer corrections. They are worthless unless something turns
# them into durable project knowledge before the context is gone.
#
# EARLIER DESIGN, AND WHY IT CHANGED: this used to inject a directive telling
# Claude to write its own learnings, escalating to exit 2 (forced continuation)
# once signals piled up. Live testing showed the model recognising the forced
# directive as "an automated hook repeating" and declining to act — correctly,
# from its point of view. Asking the model to do the capture does not work.
#
# So the hook does the capture itself, deterministically, and then merely tells
# Claude what was recorded and invites refinement. Never blocks, never loops.

set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
KIT="$ROOT/.claude/frontend-kit"
LEDGER="$KIT/.signals.jsonl"

[ -f "$KIT/project-profile.json" ] || exit 0
[ -f "$LEDGER" ] || exit 0
[ -s "$LEDGER" ] || exit 0

# Encode a multi-line string as a JSON string body.
json_escape() {
  printf '%s' "$1" \
    | awk 'BEGIN{ORS=""} {gsub(/\\/,"\\\\"); gsub(/"/,"\\\""); if(NR>1) printf "\\n"; printf "%s", $0}'
}

emit() {
  printf '{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"%s"}}\n' \
    "$(json_escape "$1")"
  exit 0
}

# ---------------------------------------------------------------------------
# Deterministic path: the hook writes the learning itself.
# ---------------------------------------------------------------------------
if command -v node >/dev/null 2>&1; then
  SUMMARY="$(node "$(dirname "$0")/consolidate.mjs" "$KIT" 2>/dev/null)"
  if [ -n "$SUMMARY" ]; then
    emit "<frontend-kit-learning>
Frontend Kit just recorded ${SUMMARY} to \`.claude/frontend-kit/learnings.md\` and cleared
the signal ledger. The entry is factual but mechanical — it has what happened, not why.

If you have context the hook lacks, improve the entry now: replace any \`TODO\` lines with
the real rule and its reason, merge it with an existing entry that already covers the same
ground, or move a 'how this project does things' rule into \`conventions.md\` where it
belongs. If the auto-captured text is already accurate, leave it and say nothing.

If an entry is wrong, delete it — a stale rule is worse than no rule.
</frontend-kit-learning>"
  fi
  exit 0
fi

# ---------------------------------------------------------------------------
# Fallback: no Node. Ask, since we cannot write it ourselves.
# ---------------------------------------------------------------------------
TOTAL=$(grep -c . "$LEDGER" 2>/dev/null || echo 0)
[ "$TOTAL" -gt 0 ] || exit 0

emit "<frontend-kit-learning>
${TOTAL} unconsolidated learning signal(s) are in \`.claude/frontend-kit/.signals.jsonl\`
(blocked writes and developer corrections). Node is unavailable, so they could not be
recorded automatically.

Invoke the \`kit-self-improve\` skill: read the ledger, look for PATTERNS rather than
individual events, write what passes the 'will a future session do better work' test to
\`learnings.md\` or \`conventions.md\`, then truncate the ledger.
</frontend-kit-learning>"
