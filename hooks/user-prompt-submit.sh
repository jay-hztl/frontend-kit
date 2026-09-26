#!/usr/bin/env bash
# Frontend Kit — UserPromptSubmit hook
#
# Two jobs:
#   1. Enforce the setup gate — a figma-to-code project may not proceed to
#      implementation work until the Figma MCP connector is connected; a
#      lift-and-shift project may not proceed without a reference URL.
#   2. Keep the analyst as the entry point for substantive requests.
#
# stdout is appended to the prompt context. We never exit 2 (hard block) — that
# would stop the developer from even asking "how do I connect Figma?". Instead
# we inject a directive Claude must obey, which is resolvable in-conversation.

set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
KIT_DIR="$ROOT/.claude/frontend-kit"
PROFILE="$KIT_DIR/project-profile.json"

[ -f "$PROFILE" ] || exit 0

# Read the raw prompt so we can let setup/meta requests through untouched.
PROMPT="$(cat 2>/dev/null || true)"

# --- correction detection ----------------------------------------------------
# A developer correcting Claude is the second-richest learning signal after a
# blocked write. Left uncaptured, the same correction gets made again next week.
KIT_DIR="$ROOT/.claude/frontend-kit"
LOWER="$(printf '%s' "$PROMPT" | tr '[:upper:]' '[:lower:]')"

if printf '%s' "$LOWER" | grep -qE \
  "^(no|nope|wrong|incorrect)[,. ]|that'?s (not|wrong|incorrect)|don'?t (do|use|add|put)|\
should(n'?t| not) (be|use|have|do)|we (always|never|don'?t) |not like that|\
i (said|told you|already said)|stop (doing|using)|why did you|you (were|are) wrong|\
that'?s not how|use .* instead|actually,? (we|it|the)"; then

  mkdir -p "$KIT_DIR" 2>/dev/null || true
  EXCERPT="$(printf '%s' "$PROMPT" | head -c 300 | tr '\n' ' ' | sed 's/"/'"'"'/g')"
  printf '{"ts":"%s","kind":"correction","excerpt":"%s"}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$EXCERPT" >> "$KIT_DIR/.signals.jsonl" 2>/dev/null || true

  cat <<'EOF'
<frontend-kit-learning>
The developer appears to be CORRECTING you. Treat this as durable project knowledge,
not a one-off instruction.

REQUIRED, in this turn — not "later", not "if asked":
1. Resolve the correction itself.
2. Decide whether it is durable — a project convention, constraint or preference that will
   apply again — or a one-off that only matters right now. Only durable ones get saved.
3. If durable, you MUST append it to `.claude/frontend-kit/learnings.md` (or
   `conventions.md` if it is a "how this project does things" rule) using the Write or
   Edit tool, in this format:

       ### <YYYY-MM-DD> — <short title>
       **What happened:** <the correction>
       **Rule going forward:** <the imperative version>
       **Why:** <the reason, so a future session knows when it stops applying>

   The **Why** line is not optional. A rule without its reason cannot be safely retired.
4. Check for an existing entry that already covers it and amend rather than duplicate.
5. Tell the developer in one line what you recorded and where.

Writing the file is the point. Acknowledging the correction in prose and moving on means
the same correction gets made again next week — which is the exact failure this prevents.
Do not record something the codebase already makes obvious, and never record silently.
</frontend-kit-learning>
EOF
fi

# Escape hatch: an explicit override phrase from the developer.
if printf '%s' "$PROMPT" | grep -qi 'frontend-kit[: ]*\(skip\|bypass\|override\)'; then
  echo "<frontend-kit>Setup gate overridden by the developer for this prompt. Proceed, but state once that pixel accuracy cannot be guaranteed without the design source.</frontend-kit>"
  exit 0
fi

has() { grep -q "$1" "$PROFILE" 2>/dev/null; }

# --- figma-to-code gate ------------------------------------------------------
if has '"projectType"[[:space:]]*:[[:space:]]*"figma-to-code"' && ! has '"figmaConnected"[[:space:]]*:[[:space:]]*true'; then
  cat <<'EOF'
<frontend-kit-gate priority="blocking">
This project is registered as **figma-to-code**, but `figmaConnected` is not `true` in
`.claude/frontend-kit/project-profile.json`.

MANDATORY: do not write, generate or modify any UI/component/styling code for this
request yet. Pixel-perfect output is impossible without the design source, and guessing
values is explicitly forbidden on this project.

Do this instead, in order:
1. Invoke the `figma-to-code` skill.
2. Walk the developer through connecting the Figma MCP connector (the skill has the
   exact steps for Claude Code, desktop and web).
3. Ask for the Figma file/frame URL for this task.
4. Verify the connection by actually calling a Figma tool against that URL.
5. Only then set `"figmaConnected": true` in the profile and continue with the request.

Questions, explanations, planning, reading code and the setup steps themselves are all
allowed right now — only shipping UI code is gated.
</frontend-kit-gate>
EOF
  exit 0
fi

# --- lift-and-shift gate -----------------------------------------------------
if has '"projectType"[[:space:]]*:[[:space:]]*"lift-and-shift"' && ! has '"referenceUrl"[[:space:]]*:[[:space:]]*"http'; then
  cat <<'EOF'
<frontend-kit-gate priority="blocking">
This project is registered as **lift-and-shift**, but no `referenceUrl` is recorded in
`.claude/frontend-kit/project-profile.json`.

MANDATORY: before implementing UI for this request, ask the developer for the live or
staging URL of the site being lifted, confirm it loads in the browser tools, then record
it in the profile. Invoke the `lift-and-shift` skill for the full extraction workflow.
</frontend-kit-gate>
EOF
  exit 0
fi

# --- normal operation --------------------------------------------------------
echo "<frontend-kit>Setup is complete for this project. For any substantive frontend request, start with the \`frontend-analyst\` agent (requirement analysis + routing) before writing code. Trivial one-line edits and direct questions do not need it.</frontend-kit>"
exit 0
