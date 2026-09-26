---
name: design-tokens
description: Find, use and extend the project's design tokens instead of hard-coding values. Use whenever a colour, spacing, font, radius, shadow or z-index value is about to be written, when a design introduces a value the system does not have, or when auditing a codebase for hard-coded style values.
model: inherit
effort: medium
---

# Design tokens

A hard-coded value in a component is a small, invisible debt that comes due at the next
redesign, dark-mode rollout or rebrand. Use the system.

## Step 1 — Find the system

Check, in order, and record what you find in
`.claude/frontend-kit/design-tokens.md`:

- `tailwind.config.*` → `theme` and `theme.extend`; or a v4 `@theme { }` block in CSS
- CSS custom properties — `:root { --* }`, and where the dark-mode overrides live
- A tokens package — `tokens/`, `design-tokens/`, `*.tokens.json`, Style Dictionary
- Theme objects — MUI `createTheme`, Chakra/Mantine `extendTheme`, styled-components
- Sass variables and maps
- vanilla-extract `createThemeContract` / `.css.ts` files
- Figma Variables via `get_variable_defs` — on a figma-to-code project these are the
  upstream source; the code tokens should mirror them

## Step 2 — Prefer semantic over primitive

Two layers usually exist, and the distinction matters:

- **Primitive**: `--blue-600`, `--space-4`, `--font-size-lg` — raw values.
- **Semantic**: `--color-text-primary`, `--color-surface-raised`,
  `--color-border-focus` — intent.

Components use **semantic** tokens. Semantic tokens reference primitives. This is what
makes dark mode and rebranding a config change rather than a codebase sweep. If only
primitives exist, use them, and mention to the developer that a semantic layer would
help — do not build one unasked.

## Step 3 — Map every value before writing it

For each value coming out of a design:

1. Does an exact token exist? Use it.
2. Does a token exist within rounding distance (e.g. design says 15px, scale has 16px)?
   **Ask** — do not snap silently. The designer may have meant 16, or may have meant 15.
3. No token at all? **Ask**, with three options:
   - Add a new token to the system (right when the value will recur)
   - Snap to the nearest existing scale step (right when it was a design slip)
   - One-off literal with a comment saying why (right when it is genuinely unique)

Never pick one of these alone on a figma-to-code project.

## Step 4 — Adding a token properly

When the developer approves a new token:

- Name it by role, not appearance. `--color-danger`, not `--color-red`. A red that
  becomes orange later should not require renaming every usage.
- Follow the existing naming convention exactly — read three neighbours first.
- Add it to every theme the project has (light *and* dark, and any brand themes).
- Add it at the right layer: a new brand colour is a primitive plus one or more
  semantic aliases.
- If tokens are generated from Figma or Style Dictionary, change the **source**, then
  regenerate. Editing generated output gets overwritten.

## Step 5 — Audit

Find hard-coded values that should be tokens:

```bash
# Hex literals in component files
grep -rnE '#[0-9a-fA-F]{3,8}\b' --include='*.tsx' --include='*.jsx' --include='*.vue' --include='*.svelte' src/ | head -40

# rgb/rgba literals
grep -rnE 'rgba?\([0-9]' --include='*.css' --include='*.scss' --include='*.tsx' src/ | head -40

# Arbitrary Tailwind values — each one is a token that may be missing
grep -rnE '\[[0-9]+(px|rem|%)\]|\[#[0-9a-fA-F]{3,8}\]' --include='*.tsx' --include='*.jsx' src/ | head -40

# Font families declared outside the token layer
grep -rn 'font-family' --include='*.css' --include='*.scss' src/ | head -20
```

Report findings grouped by how often each literal appears — a hex used eleven times is
a missing token; a hex used once may be legitimately one-off.

## What belongs in the token system

Colour · spacing scale · font families, sizes, weights, line-heights, letter-spacings ·
border radii · border widths · shadows · z-index layers · transition durations and
easing curves · breakpoints · container widths · icon sizes · opacity steps.

If you are typing a number or a colour into a component and it is not content, ask
yourself which of those it is.
