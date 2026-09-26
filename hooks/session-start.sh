#!/usr/bin/env bash
# Frontend Kit — SessionStart hook
#
# Loads the project profile from .claude/frontend-kit/ and injects it as session
# context. If no profile exists, injects a directive that forces onboarding
# before any frontend work begins.
#
# stdout from a SessionStart hook is added to Claude's context verbatim.

set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
KIT_DIR="$ROOT/.claude/frontend-kit"
PROFILE="$KIT_DIR/project-profile.json"
PKG="$ROOT/package.json"

# ---------------------------------------------------------------------------
# Lightweight stack detection (no jq / node dependency)
# ---------------------------------------------------------------------------
detect() {
  [ -f "$PKG" ] || { echo "none (no package.json found at project root)"; return; }

  local found=""
  add() { found="${found:+$found, }$1"; }

  grep -q '"next"' "$PKG" && add "Next.js"
  grep -q '"nuxt"' "$PKG" && add "Nuxt"
  grep -q '"@remix-run/' "$PKG" && add "Remix"
  grep -q '"@angular/core"' "$PKG" && add "Angular"
  grep -q '"svelte"' "$PKG" && add "Svelte"
  grep -q '"astro"' "$PKG" && add "Astro"
  grep -q '"vue"' "$PKG" && add "Vue"
  grep -qE '"react"[[:space:]]*:' "$PKG" && add "React"
  grep -q '"typescript"' "$PKG" && add "TypeScript"
  grep -q '"tailwindcss"' "$PKG" && add "Tailwind"
  grep -q '"styled-components"' "$PKG" && add "styled-components"
  grep -q '"@emotion/' "$PKG" && add "Emotion"
  grep -q 'sass\|node-sass' "$PKG" && add "Sass"
  grep -q '"storybook"\|"@storybook/' "$PKG" && add "Storybook"
  grep -q '"vitest"' "$PKG" && add "Vitest"
  grep -qE '"jest"[[:space:]]*:' "$PKG" && add "Jest"
  grep -q '"@playwright/test"' "$PKG" && add "Playwright"
  grep -q '"cypress"' "$PKG" && add "Cypress"
  grep -q '"@testing-library/' "$PKG" && add "Testing Library"

  echo "${found:-package.json present, no known frontend framework detected}"
}

echo "<frontend-kit>"
echo "The **frontend-kit** plugin is active for this session."
echo ""
echo "Detected stack: $(detect)"
echo ""

if [ -f "$PROFILE" ]; then
  # ---- Known project -------------------------------------------------------
  echo "## Project profile (.claude/frontend-kit/project-profile.json)"
  echo '```json'
  cat "$PROFILE"
  echo '```'
  echo ""

  for f in breakpoints.md design-tokens.md conventions.md learnings.md; do
    if [ -f "$KIT_DIR/$f" ]; then
      echo "## Memory: $f"
      cat "$KIT_DIR/$f"
      echo ""
    fi
  done

  echo "### Operating rules for this session"
  echo "- Do NOT re-ask the onboarding questions. The profile above is the answer."
  echo "- Route every substantive frontend request through the \`frontend-analyst\` agent first."
  echo "- Honour the recorded breakpoints, tokens and conventions. If a value you need is missing from memory, ASK the developer — never invent it."
  echo "- If the profile says \`\"projectType\": \"figma-to-code\"\`, the Figma MCP connection is mandatory before any design/component implementation work."
else
  # ---- First run -----------------------------------------------------------
  echo "## STATUS: NOT ONBOARDED — onboarding is required"
  echo ""
  echo "No profile exists at \`.claude/frontend-kit/project-profile.json\`."
  echo ""
  echo "**Before doing ANY frontend work in this session, you MUST run the onboarding flow.**"
  echo "Invoke the \`project-onboarding\` skill now and follow it exactly."
  echo ""
  echo "Open with this question, using the AskUserQuestion tool:"
  echo ""
  echo "> **What type of project is this?**"
  echo "> 1. **Figma to Code** — implementing designs from Figma files."
  echo "> 2. **Lift and Shift** — rebuilding / migrating an existing live website."
  echo "> 3. **Neither / Greenfield** — building new UI without a Figma source or a reference site."
  echo ""
  echo "Branch rules:"
  echo "- **Figma to Code** → the Figma MCP connector is MANDATORY. Guide the developer through connecting it and do not proceed to implementation until it is connected and a file URL has been supplied."
  echo "- **Lift and Shift** → a reachable live/staging URL is MANDATORY. Ask for it and confirm it loads."
  echo "- **Greenfield** → collect the design source of truth instead."
  echo ""
  echo "Then capture breakpoints, design tokens and conventions, and write the memory files. Onboarding is a one-time cost; every later session reads the profile automatically."
fi

echo "</frontend-kit>"
exit 0
