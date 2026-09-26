---
name: component-workflow
description: The end-to-end process for creating or substantially changing a component. Use when building a new component, hook, layout or page section, or when adding variants and props to an existing one. Identifies the application type first, matches the project's conventions, then drives the full chain through types, states, breakpoints, a11y, stories, tests and browser verification.
model: inherit
effort: high
---

# Component workflow

Run the `component-architect` agent for anything substantial. Use this skill directly
for smaller additions.

## Phase 1 — Identify the application type

This comes first because it determines what a "good" component even is here.

| Type | How you recognise it | What it demands |
|---|---|---|
| Marketing / content | CMS SDK, `/blog`, static routes, SEO deps | Server components, SEO, image optimisation, minimal client JS |
| Web app / dashboard | auth, data layer, tables, charts, state manager | Interactivity, loading/empty/error states, keyboard flows |
| E-commerce | cart, PDP/PLP, payment SDK | Product schema, price/currency, stock and variant states, conversion a11y |
| Design system | `packages/`, exports map, Storybook-first | Stable public API, polymorphism, ref forwarding, full variant matrix, docs |
| SPA / app shell | Vite + router, no SSR | Bundle size, code splitting, lazy routes |
| Monorepo | workspaces | Classify the *target package*, not the repo |

Read routes, dependencies and directory names to decide. Ask only if genuinely ambiguous.

## Phase 2 — Learn the local idiom

Read at least two nearby components and extract:

- File structure — folder + `index.ts` barrel, or flat file? Where do types, styles,
  stories and tests sit?
- Naming and casing for files, components, props, handlers
- `function` vs arrow; named vs default export
- `interface FooProps` vs `type FooProps`; exported?
- Styling approach and the variant helper in use (`cva`, `tv`, CSS Modules, …)
- Where `'use client'` lives in this codebase
- Import aliases and ordering

Match all of it. A correct component in a foreign style is a review comment waiting to
happen.

## Phase 3 — Design the API

- Minimum viable props. Composition (`children`, slots) over `render*` props.
- Union variants over boolean soup: `variant: 'primary' | 'ghost'`, not `isPrimary` +
  `isGhost`.
- Controlled/uncontrolled decided deliberately; if both, do `value`/`defaultValue` +
  `onChange` properly.
- Reusable components extend the native element props, merge `className`, spread the
  rest, forward the ref.
- Impossible states unrepresentable — discriminated unions. If `href` excludes
  `onClick`, encode it in the type, do not document it in a comment.
- Server component by default in Next App Router; push `'use client'` down to the leaf
  that actually needs it.

Sketch the props table and confirm it before writing the body, for anything non-trivial.

## Phase 4 — Build the matrix

**Never ship only the happy path.**

- **States**: default, hover, `:focus-visible`, active, disabled, loading, empty, error,
  selected — whichever apply.
- **Breakpoints**: every one in `.claude/frontend-kit/breakpoints.md`.
- **Content**: longest string, zero items, many items, missing image, null fields.
- **Semantics**: the right element before any ARIA. `<button>`, `<a>`, `<nav>`,
  `<ul>`/`<li>` — a `div` with `onClick` is a defect.
- **Tokens**: no raw hex, no off-scale spacing.
- **Theme**: if dark mode exists, both values for every colour.

## Phase 5 — Integrate

- Export the way the project exports (update the barrel if there is one).
- Replacing something? Grep for every consumer and either migrate them or list the
  remaining call sites explicitly.
- Keep the component pure; push fetching to the boundary.
- Avoidable re-renders: stable keys, memoised callbacks where it measurably matters —
  not reflexively.

## Phase 6 — Close the loop

In order. Ask before the optional ones rather than assuming:

1. **Type-check and lint** — actually run them (`tsc --noEmit`, the project's lint
   script). Do not report done on unverified types.
2. **Storybook** — installed? Ask, then run `storybook-sync`.
3. **Unit tests** — runner installed? Ask, then run `unit-testing`.
4. **SEO** — Next.js and content-bearing? Run `seo-nextjs`.
5. **Accessibility** — interactive, form, or navigation? Run `accessibility-audit`.
6. **Browser verification** — always. Run `browser-verification`.
7. **Performance** — above the fold, media-heavy, or in a big list? Run
   `performance-budget`.

## Anti-patterns to refuse

- A `div` with an `onClick` where a `<button>` belongs
- `any`, `as unknown as`, or `@ts-ignore` to silence a real type problem
- A new dependency when something equivalent is already in `package.json`
- Copy-pasting an existing component instead of extending or parameterising it
- A prop that exists only to work around a layout problem in one parent
- `useEffect` to derive state that could be computed during render
- Index as a `key` in a reorderable list
- Styling by nesting into another component's internal class names
