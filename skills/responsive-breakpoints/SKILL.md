---
name: responsive-breakpoints
description: Discover, define and enforce the project's breakpoint set. Use before any layout or styling work, when breakpoints are unknown or undocumented, when a change must be checked across viewports, or when something breaks on mobile or tablet. Writes the confirmed set to memory so later sessions never have to re-derive it.
model: inherit
effort: medium
---

# Responsive breakpoints

Breakpoints are a project-level contract. Getting them wrong means rebuilding
components, so this is settled before layout work, never during.

## Step 1 — Memory

Read `.claude/frontend-kit/breakpoints.md`. If it exists and is filled in, use it and
stop here. It is the authority.

## Step 2 — Detect

If memory is empty, search the codebase in this order.

**Tailwind** — `tailwind.config.{js,ts,mjs}` or a v4 `@theme` block in CSS:
```bash
grep -A 25 'screens' tailwind.config.* 2>/dev/null
grep -rn '@custom-media\|--breakpoint-' src/ app/ styles/ 2>/dev/null
```
Note whether they use the default scale (`sm:640 md:768 lg:1024 xl:1280 2xl:1536`) or
override it.

**CSS / SCSS variables and maps:**
```bash
grep -rn 'breakpoint\|--bp-\|\$screen-\|\$mq-' --include='*.css' --include='*.scss' --include='*.less' . | head -30
```

**What the code actually does** — the most reliable signal, because it reflects reality
rather than intent:
```bash
grep -rhoE '@media[^{]+' --include='*.css' --include='*.scss' --include='*.tsx' --include='*.ts' . \
  | sed 's/  */ /g' | sort | uniq -c | sort -rn | head -30
```
Widths used many times are the real breakpoints. One-offs are either bugs or genuine
element-level tweaks — ask which.

**Component library themes** — MUI `theme.breakpoints.values`, Chakra/Mantine
`theme.breakpoints`, styled-components theme objects:
```bash
grep -rn 'breakpoints' --include='*.ts' --include='*.tsx' --include='*.js' src/ | head -20
```

**JS-side** — `useMediaQuery`, `matchMedia`, `window.innerWidth` comparisons. These must
agree with the CSS. A mismatch between a JS breakpoint and a CSS breakpoint is a real
bug worth reporting.

**Container queries** — `@container`, `container-type`. If the project uses them, some
components are sized by their container, not the viewport, and must be tested that way.

## Step 3 — Confirm or ask

**Found them** → show the set and ask for one-line confirmation:

> I found these breakpoints in `tailwind.config.ts`: sm 640 / md 768 / lg 1024 / xl 1280.
> Your media queries also use 900px in three places. Should 900 be part of the official
> set, or are those one-offs?

**Found nothing** → this blocks layout work. Ask the developer to define them, with
`AskUserQuestion` and real options:

> This project has no breakpoints defined anywhere I can find. I can't build responsive
> layouts without them. Which should we use?
>
> - **Tailwind default** (Recommended if you're on Tailwind) — 640 / 768 / 1024 / 1280 / 1536
> - **Common three-tier** — mobile <768, tablet 768–1023, desktop ≥1024
> - **Bootstrap 5** — 576 / 768 / 992 / 1200 / 1400
> - **Custom** — tell me your values and names

Also ask, in the same round:
- **Mobile-first or desktop-first?** (`min-width` vs `max-width`.) Mobile-first is the
  default recommendation; consistency with the existing code matters more.
- **`px` or `rem` in media queries?** `rem` respects browser zoom/font-size settings.
- **Is there a max container width**, and what are the gutters at each tier?

## Step 4 — Write memory

Write the confirmed set to `.claude/frontend-kit/breakpoints.md` using the template at
`${CLAUDE_PLUGIN_ROOT}/templates/breakpoints.md`. Record names, values, direction, unit,
container widths, gutters, grid columns and any container-query usage.

Tell the developer the file is written and that future sessions will read it
automatically. Suggest committing it.

## Step 5 — Enforce

For every visual change afterwards:

- The change is correct at **every** breakpoint in the set. Not just the one that was
  mentioned.
- Test at each breakpoint **and at 1px either side of each boundary.** Boundary bugs
  (`min-width: 768` paired with `max-width: 768`, so both rules apply at exactly 768)
  are invisible unless you look there specifically.
- Also check the extremes: 320px (smallest phone still in use) and a very wide viewport
  where an unbounded container stretches text to unreadable line lengths.
- Landscape phone (short viewport height) breaks anything using `100vh` — prefer `dvh`
  or `svh` when the project's browser floor allows.
- Touch targets ≥ 44×44 CSS px at touch widths.
- No horizontal page scroll at any width. Check with:
  ```js
  document.documentElement.scrollWidth > document.documentElement.clientWidth
  ```
  and find the culprit with:
  ```js
  [...document.querySelectorAll('*')].filter(el =>
    el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
  ```

## Principles

- Breakpoints belong to the content, not to device names. "iPad" is not a width.
- Prefer intrinsic responsiveness where the design permits — `flex-wrap`,
  `minmax()`/`auto-fit` grids, `clamp()` — and use breakpoints for the genuine layout
  changes.
- Container queries are the right tool when a component appears in several different
  containers. Check browser-support requirements first.
- On a figma-to-code project you never invent a responsive behaviour. If the design has
  one frame, ask what the others do.
