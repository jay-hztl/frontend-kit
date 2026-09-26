# Design tokens

> Frontend Kit memory. Use these instead of literal values. A hard-coded hex or an
> off-scale spacing value in a component is a defect. Loaded at session start.

## Where they live

| Layer | Location | Edit here? |
|---|---|---|
| Primitives | `<src/styles/tokens.css>` | |
| Semantic aliases | `<src/styles/theme.css>` | |
| Tailwind mapping | `<tailwind.config.ts>` | |
| Generated from | `<tokens/source.json / Figma Variables>` | **Generated output must not be edited by hand** |

Figma Variables in use: yes / no — if yes, they are upstream of the code tokens and the
code should mirror them.

## Colour

Semantic tokens components should use:

| Token | Light | Dark | Use for |
|---|---|---|---|
| `--color-text-primary` | | | Body copy |
| `--color-text-secondary` | | | Supporting copy |
| `--color-surface` | | | Page background |
| `--color-surface-raised` | | | Cards, panels |
| `--color-border` | | | Dividers, outlines |
| `--color-primary` | | | Primary actions |
| `--color-danger` | | | Errors, destructive actions |
| `--color-focus` | | | Focus ring |

Dark mode: supported / not supported. Mechanism: `class` / `media` / `data-attribute`.

## Spacing

Base unit: `4px` | `8px`

| Step | Value |
|---|---|
| `1` | 4px |
| `2` | 8px |
| `3` | 12px |
| `4` | 16px |
| `6` | 24px |
| `8` | 32px |
| `12` | 48px |
| `16` | 64px |

## Typography

| Token | Family | Size | Line height | Weight | Letter spacing |
|---|---|---|---|---|---|
| `display` | | | | | |
| `heading-lg` | | | | | |
| `heading-md` | | | | | |
| `heading-sm` | | | | | |
| `body` | | | | | |
| `body-sm` | | | | | |
| `caption` | | | | | |

Always set line-height explicitly alongside font-size — mismatched line-height is the
most common invisible cause of "a few pixels off".

## Other primitives

**Radii:** `sm` · `md` · `lg` · `full`
**Shadows:** `sm` · `md` · `lg` — match blur, spread, offset and alpha exactly
**Border widths:**
**Z-index scale:** dropdown · sticky · overlay · modal · popover · toast
**Transitions:** duration + easing per interaction class

## Rules

- Components use **semantic** tokens, not primitives, wherever a semantic token exists.
- A design value with no token equivalent is a question for the developer — add a token,
  snap to the scale, or accept a documented one-off. Never decide alone.
- New tokens are named by role (`--color-danger`), not appearance (`--color-red`).
- Every new token is added to every theme.

## Tokens added during kit sessions

| Date | Token | Value | Why |
|---|---|---|---|
