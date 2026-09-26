---
description: Verify the current UI in a real browser at every breakpoint
argument-hint: "[route or component to check]"
---

Verify this in a real browser:

$ARGUMENTS

Run the `frontend-verifier` agent and the `browser-verification` skill.

Start the dev server with `preview_start` (never a raw Bash command), then run the full
sweep:

1. It renders
2. Every breakpoint from `.claude/frontend-kit/breakpoints.md`, plus 1px either side of
   each boundary, plus 320px and a wide viewport
3. Interaction states — hover, keyboard tab-through, focus visibility, active,
   disabled, loading, error, empty; Escape and focus-return on overlays
4. Console errors and network failures
5. Accessibility tree — names, heading order, labels, landmarks
6. Layout stability on reload
7. Side-by-side comparison with the design source, if there is one

Report what you observed, not what the code implies. Measure with `getComputedStyle`
and give numbers for anything that looks off. List anything you could not verify and
what you would need in order to check it.
