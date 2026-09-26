---
name: pixel-perfect-design
description: Implement or correct visual design to exact accuracy — typography, spacing, colour, layout — across every breakpoint. Use whenever styling is written or changed, when a design must be matched, or when something "looks off", is misaligned, or has wrong spacing. Enforces scanning the project's existing type scale, spacing scale and breakpoints before writing any value.
model: inherit
effort: high
---

# Pixel-perfect design

"Pixel perfect" is not a compliment you award yourself. It is the result of measuring
instead of estimating.

## Rule zero

Every value you write comes from the design source, the project's tokens, or the
developer. Never from your judgement. If you cannot source a value, ask for it. This is
absolute on figma-to-code projects.

## Step 1 — Scan the project's systems (before writing anything)

You cannot be consistent with a system you have not read.

**Typography.** Find the type scale and use it:
- Tailwind: `theme.fontSize`, `theme.fontFamily`, `theme.letterSpacing` in the config
- CSS: `--font-size-*`, `--text-*`, `--leading-*` custom properties
- Sass: `$font-*` variables, `@mixin text-*`
- Theme objects: `typography` in MUI/Chakra/styled-components themes
- Global styles: base `html`/`body` font-size and the heading defaults

Record, for each style: family, size, weight, line-height, letter-spacing. **Line-height
is the most common cause of "a few pixels off" that nobody can find.** Always set it
explicitly alongside font-size.

**Spacing.** Determine the base unit (4px and 8px are most common) and the scale.

```bash
# What spacing values does this codebase actually use?
grep -rhoE '(gap|padding|margin)(-[a-z]+)?:\s*[0-9.]+(px|rem)' src/ \
  | grep -oE '[0-9.]+(px|rem)' | sort | uniq -c | sort -rn | head -30
```

Values that appear once are probably mistakes. Values that appear often are the scale.

**Colour.** Locate the palette — token files, Tailwind `theme.colors`, CSS custom
properties, theme objects. Note the light/dark handling and the semantic layer
(`--color-text-primary` vs raw `--gray-900`). Use semantic tokens when they exist.

**Layout.** Container max-width, gutters per breakpoint, grid column count, and whether
the project uses container queries.

**Other primitives.** Border radii, shadow scale, border widths, z-index scale,
transition durations and easings. These are systems too, and one-off values in any of
them read as sloppy.

## Step 2 — Breakpoints are mandatory

Read `.claude/frontend-kit/breakpoints.md`. If it does not exist, run the
`responsive-breakpoints` skill now — it either finds them in the code or makes the
developer define them. **Do not write layout code with unknown breakpoints.**

Every visual change is in scope at every breakpoint. Desktop-only is not a deliverable.

## Step 3 — Extract exactly

**From Figma:** `get_variable_defs` before `get_design_context`; variables are truth,
layer values are derived. Auto-layout gap → `gap`, never sibling margins. Note the
sizing mode of each element (hug / fill / fixed) — it tells you the responsive intent.

**From a live site:** `getComputedStyle`, never visual estimation. Re-extract at every
breakpoint; layout mechanisms change between them.

**From a screenshot:** measure what is measurable, and explicitly list what is not
(exact hex under compression, hover states, fluid behaviour) as questions.

## Step 4 — Map before you write

For each extracted value, find the project's equivalent and use it. A literal `#1A73E8`
in a component when `--color-primary` exists is a defect, even when it renders
identically — it breaks theming, dark mode, and the next redesign.

When a design value has no token equivalent, stop and ask: add a token, snap to the
existing scale, or accept a one-off? Do not decide alone. Route through `design-tokens`.

## Step 5 — Implementation craft

- **Match the mechanism**, not the appearance. A centred element is `justify-content:
  center`, not a computed margin that happens to land correctly at 1440px.
- **`gap` over margins** for spacing between siblings. Margins collapse and fight.
- **Logical properties** (`padding-inline`, `margin-block`) if the project uses them or
  localisation is in scope.
- **Mobile-first `min-width` queries** by default — but match the codebase's existing
  direction rather than mixing both.
- **Fluid type with `clamp()`** only if the design specifies fluid behaviour or the
  project already does it. Otherwise step at breakpoints, as the design shows.
- **`aspect-ratio` or explicit dimensions** on all media, so nothing shifts on load.
- **`box-sizing: border-box`** — verify the project sets it globally.
- **Optical alignment**: icons next to text often need a fractional nudge to look
  aligned. If the design has one, replicate it; do not add one on your own initiative.
- **Sub-pixel**: at fractional device pixel ratios, `0.5px` borders and odd-numbered
  centring produce blur. Prefer even values when the design permits.
- **`prefers-reduced-motion`** around anything that animates.
- **Dark mode**: if the project supports it, every colour you touch needs both values.

## Step 6 — Measure the result

Do not assert accuracy — verify it (`browser-verification` skill):

1. Render at each breakpoint, plus 1px either side of each boundary.
2. Overlay or compare side-by-side with the source.
3. Where something looks off, measure both sides with `getComputedStyle` and report the
   two numbers.
4. Check the states: hover, focus-visible, active, disabled, loading, empty, error.
5. Check the content extremes: longest string, zero items, missing image.
6. Console clean.

## The usual suspects

When something is "slightly off", check these in order — it is nearly always one of them:

1. `line-height` not set, or unitless vs px mismatch
2. Default `margin` on `<p>`/`<h*>`/`<ul>` not reset
3. `letter-spacing` omitted
4. Font not loaded yet, or a fallback with different metrics rendering
5. `border-box` vs `content-box`
6. A parent's `padding` conflicting with the child's `margin`
7. Inline-block whitespace between elements
8. Border width counted in the total dimension
9. The design's shadow alpha not copied exactly
10. Icon SVG `viewBox` padding making the glyph sit smaller than its box
