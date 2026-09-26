---
description: Detect, confirm or update this project's breakpoint set
argument-hint: "[optional: the breakpoint values to record]"
---

Run the `responsive-breakpoints` skill.

$ARGUMENTS

If the developer supplied values above, confirm them back and write them to
`.claude/frontend-kit/breakpoints.md`.

Otherwise:

1. Read `.claude/frontend-kit/breakpoints.md` — if it is already filled in, show it and
   ask whether anything needs changing.
2. If not, detect breakpoints from `tailwind.config.*`, CSS custom properties, Sass
   variables, theme objects, and — most reliably — the `@media` queries actually used in
   the codebase, counted by frequency.
3. Show what you found and ask for confirmation, flagging any one-off widths that may
   be mistakes.
4. If nothing exists, ask the developer to define the set, offering the common presets
   as concrete options alongside "custom".
5. Also settle: mobile-first or desktop-first, `px` or `rem`, container max-widths and
   gutters per tier, and whether container queries are in use.
6. Write the file and tell them it is committable.
