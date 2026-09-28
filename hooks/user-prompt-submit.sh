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

# UserPromptSubmit receives a JSON payload on stdin, not bare text — the prompt
# is in its `prompt` field. Treating the whole payload as the prompt meant
# `^`-anchored patterns never matched (the payload starts with `{`) and logged
# excerpts captured transcript paths instead of what the developer actually said.
RAW="$(cat 2>/dev/null || true)"
PROMPT=""
if command -v node >/dev/null 2>&1; then
  PROMPT="$(printf '%s' "$RAW" | node -e \
    'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const p=JSON.parse(s).prompt;process.stdout.write(typeof p==="string"?p:s)}catch{process.stdout.write(s)}})' \
    2>/dev/null)"
fi
# Fall back to the raw payload if extraction is unavailable or fails.
[ -n "$PROMPT" ] || PROMPT="$RAW"

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

# --- onboarding gate ---------------------------------------------------------
# Until v1.1.1 this hook exited here when no profile existed, so a brand-new
# project had NO enforcement at all — the SessionStart hook merely *suggested*
# onboarding, and a suggestion is exactly what this kit has repeatedly proven
# the model can skip. The kit's headline feature was the one thing not enforced.
if [ ! -f "$PROFILE" ]; then
  cat <<'EOF'
<frontend-kit-gate priority="blocking">
This project has NOT been onboarded — `.claude/frontend-kit/project-profile.json` does
not exist. The kit does not know whether this is a Figma-to-Code, Lift-and-Shift or
greenfield project, which breakpoints it uses, or where its design truth lives.

MANDATORY: before writing, generating or modifying any UI/component/styling code for this
request, run onboarding. Invoke the `project-onboarding` skill now.

Start by surveying the repo (package.json, tsconfig, tailwind config, .storybook, test
config) so you do not ask what you can already see. Then ask, with AskUserQuestion:

  **What type of project is this?**
  1. **Figma to Code** — implementing designs from Figma files
  2. **Lift and Shift** — rebuilding or migrating an existing live website
  3. **Greenfield** — new UI, no Figma source and no reference site
  4. **Mixed** — some of each

Then follow the branch: Figma-to-Code requires the Figma MCP connector before any
implementation; Lift-and-Shift requires a reachable reference URL. Capture the breakpoints
and write the memory files. Onboarding is a one-time cost — every later session reads the
profile automatically and never asks again.

Questions, explanations, planning, reading code and onboarding itself are all allowed
right now. Only shipping UI code is gated. The developer can bypass a single prompt with
`frontend-kit: skip`.
</frontend-kit-gate>
EOF
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
