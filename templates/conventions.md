# Project conventions

> Frontend Kit memory. How this codebase does things. New code matches these, even when
> a different approach would be equally good in the abstract. Loaded at session start.

## Application type

`marketing | web-app | ecommerce | design-system | spa | monorepo`

What it implies here: <server-first and SEO-critical / interactivity-heavy / public API
stability / …>

## File layout

- Components live in: `<src/components/>`
- One component per: `<folder with index.ts barrel | flat file>`
- Types live in: `<the component file | a sibling types.ts | src/types/>`
- Stories live in: `<beside the component | .storybook/stories/>`
- Tests live in: `<beside the component | __tests__/>`
- Styles live in: `<CSS module beside component | Tailwind classes inline | styled/>`

## Naming

- Files: `<PascalCase.tsx | kebab-case.tsx>`
- Components: PascalCase
- Hooks: `use<Thing>`
- Handlers: `handle<Thing>` internally, `on<Thing>` as a prop
- Booleans: `is` / `has` / `should` prefix

## Code style

- Declaration: `<function Foo() {} | const Foo = () => {}>`
- Exports: `<named | default>`
- Props type: `<interface FooProps | type FooProps>`, `<exported | local>`
- Extends native props: `<yes, React.ComponentPropsWithoutRef<'x'> | no>`
- Import alias: `<@/ | relative>`
- Variant helper: `<cva | tv | clsx only | none>`

## Framework specifics

- `'use client'` boundary lives at: `<leaf components | route level>`
- Data fetching happens in: `<server components | a hooks layer | a services layer>`
- State management: `<none | context | zustand | redux | …>` — used for:
- Forms: `<library and wrapper>`

## Quality gates

- TypeScript: required / optional — strict: yes / no
- Storybook: always / ask / never
- Unit tests: always / ask / never
- Browser verification: always / ask
- Accessibility target: WCAG 2.2 AA
- Lint/format: `<eslint config | biome | prettier>` — run with `<command>`

## Do not

- <project-specific prohibitions — e.g. "never import from `legacy/` in new code">
- <"never edit `tokens/generated.css`; edit the source and regenerate">

## Commands

| Purpose | Command |
|---|---|
| Dev server | |
| Build | |
| Type-check | |
| Lint | |
| Test | |
| Storybook | |
