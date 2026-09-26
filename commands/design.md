---
description: Implement a design to pixel accuracy across every breakpoint
argument-hint: "<Figma node URL, reference URL, or what to build>"
---

Implement this design to pixel accuracy:

$ARGUMENTS

Run the `pixel-perfect-designer` agent.

Mandatory sequence:

1. Confirm the breakpoint set from `.claude/frontend-kit/breakpoints.md`. If it is
   missing, run `responsive-breakpoints` first — do not start layout work without it.
2. Scan the project's typography scale, spacing scale, colour tokens and layout system
   before writing any value.
3. Extract from the source properly — Figma variables and design context, or
   `getComputedStyle` on the live reference. Never estimate from a rendered image.
4. Map every extracted value to an existing token. Where no token exists, **ask** —
   add a token, snap to the scale, or accept a one-off. Do not decide alone.
5. Implement every breakpoint and every state.
6. Verify in the browser at each breakpoint plus 1px either side of each boundary, and
   compare side by side with the source.

Report the values taken from the source, the tokens mapped to, what you verified, and
anything you had to ask about or could not resolve.
