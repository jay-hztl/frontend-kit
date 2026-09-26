#!/usr/bin/env bash
# Frontend Kit — PostToolUse (Write|Edit) hook
#
# When a component/style file is touched, remind Claude of the follow-up chain
# that is easy to forget: TypeScript strictness, Storybook story, unit test,
# a11y and browser verification.
#
# Fires at most once per session so it never becomes noise.

set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
PROFILE="$ROOT/.claude/frontend-kit/project-profile.json"
PKG="$ROOT/package.json"

[ -f "$PROFILE" ] || exit 0

INPUT="$(cat 2>/dev/null || true)"

# Pull file_path and session_id out of the hook payload without a JSON parser.
FILE_PATH="$(printf '%s' "$INPUT" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
SESSION_ID="$(printf '%s' "$INPUT" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"

[ -n "$FILE_PATH" ] || exit 0

# Only care about UI source files.
case "$FILE_PATH" in
  *.tsx|*.jsx|*.vue|*.svelte|*.astro|*.css|*.scss|*.sass|*.less|*.styl) ;;
  *) exit 0 ;;
esac

# Skip files that ARE the follow-up artefacts.
case "$FILE_PATH" in
  *.stories.*|*.test.*|*.spec.*|*__tests__*|*.d.ts) exit 0 ;;
esac

MARKER="${TMPDIR:-/tmp}/frontend-kit-${SESSION_ID:-nosession}.reminded"
[ -f "$MARKER" ] && exit 0
touch "$MARKER" 2>/dev/null || true

CHECKS='- **TypeScript** — if this project uses TS, every new file, prop, hook return and event handler must be typed. No `any`, no implicit `any`, no untyped props.\n- **Responsive** — the change must be correct at EVERY breakpoint recorded in `.claude/frontend-kit/breakpoints.md`, not just desktop.\n- **Tokens** — use design tokens / theme values. Hard-coded hex, px and font-family values are a defect unless the developer approved them.\n- **Accessibility** — semantic element, accessible name, keyboard path, visible focus, 4.5:1 contrast.'

if [ -f "$PKG" ] && grep -q '"storybook"\|"@storybook/' "$PKG"; then
  CHECKS="$CHECKS"'\n- **Storybook** — this project has Storybook. ASK the developer whether to add or update the story for this component, then do it if they say yes.'
fi

if [ -f "$PKG" ] && grep -qE '"vitest"|"jest"[[:space:]]*:|"@testing-library/' "$PKG"; then
  CHECKS="$CHECKS"'\n- **Unit tests** — this project has a test runner. ASK the developer whether to add or update tests for this change, then do it if they say yes.'
fi

if grep -q '"seoFramework"[[:space:]]*:[[:space:]]*"next"' "$PROFILE" 2>/dev/null || { [ -f "$PKG" ] && grep -q '"next"' "$PKG"; }; then
  CHECKS="$CHECKS"'\n- **SEO (Next.js)** — server component by default, correct heading order, `next/image` with dimensions, metadata/JSON-LD updated if this renders a page-level region.'
fi

CHECKS="$CHECKS"'\n- **Browser verification** — before reporting done, render it and look. Invoke the `browser-verification` skill; check the console for errors too.'

printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"<frontend-kit>UI file modified. Definition of done for this change (once per session reminder):\\n%s</frontend-kit>"}}\n' "$CHECKS"
exit 0
