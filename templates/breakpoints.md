# Breakpoints

> Frontend Kit memory. Every visual change must be correct at **every** breakpoint
> listed here. Loaded automatically at session start. Commit this file.

## Source of truth

Defined in: `<tailwind.config.ts | src/styles/breakpoints.css | theme.ts | this file>`

Direction: **mobile-first (`min-width`)** | desktop-first (`max-width`)
Unit: `px` | `rem`

## The set

| Name | Min width | Container max-width | Gutter | Grid columns | Notes |
|------|-----------|---------------------|--------|--------------|-------|
| `base` | 0 | 100% | 16px | 4 | Smallest supported: 320px |
| `sm` | 640px | 100% | 16px | 4 | |
| `md` | 768px | 720px | 24px | 8 | Tablet |
| `lg` | 1024px | 960px | 24px | 12 | Small desktop |
| `xl` | 1280px | 1200px | 32px | 12 | |
| `2xl` | 1536px | 1440px | 32px | 12 | |

_Replace the rows above with this project's real values. Delete tiers that do not exist._

## Container queries

Used: yes / no
If yes, list the components sized by container rather than viewport:

- `ComponentName` — `container-type: inline-size`, breaks at `@container (min-width: …)`

## Verification widths

Test at each of these, **plus 1px either side of every boundary above**:

- `320` — smallest supported device
- every breakpoint value in the table
- `1920` — wide desktop
- landscape phone (short viewport height — catches `100vh` bugs)

## Rules

- Never introduce a media query at a width not in this table without asking first.
- No horizontal page scroll at any width.
- Touch targets ≥ 44×44 CSS px below the `md` tier.
- On a figma-to-code project, responsive behaviour is never invented — if the design has
  only one frame, ask what the others do.

## Open questions

- [ ] TODO — ask developer: <anything still unconfirmed>
