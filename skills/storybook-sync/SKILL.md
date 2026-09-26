---
name: storybook-sync
description: Keep Storybook stories in sync with component changes. Use after creating or modifying a component in a project that has Storybook installed — ask the developer whether the story should be added or updated, then write it in the project's existing story format.
model: inherit
effort: low
---

# Storybook sync

## Step 1 — Is it installed?

```bash
ls -d .storybook 2>/dev/null; grep -o '"@storybook/[^"]*"' package.json | head
```

No Storybook → skip this skill entirely. Do not suggest installing it unless the
developer raises it.

## Step 2 — Ask, do not assume

Storybook coverage is a team norm, not a universal rule. Ask once per component change:

> This project uses Storybook and I've just changed `Button`. Should I update its story?
>
> - **Yes, update it** (Recommended) — add the new `loading` variant to the existing story
> - **Yes, and add the full variant matrix** — every size × variant combination
> - **No, skip it** — you'll handle stories separately

If the developer answered this during onboarding with "always" or "never", honour that
and do not re-ask.

## Step 3 — Match the existing format

Read an existing story file before writing one. The API differs significantly across
versions:

- **CSF3 (Storybook 7/8/9)** — `const meta = { ... } satisfies Meta<typeof C>`, stories
  as plain objects with `args`
- **CSF2 (older)** — template functions with `Template.bind({})`
- Check whether the project uses `tags: ['autodocs']`, and what decorators and
  parameters the existing stories rely on

Match the file location and naming exactly: `Button.stories.tsx` next to the component,
or a separate `stories/` directory — read, do not guess.

## Step 4 — Write a useful story

CSF3 shape:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { children: 'Click me' } }
export const Loading: Story = { args: { children: 'Saving…', loading: true } }
export const Disabled: Story = { args: { children: 'Unavailable', disabled: true } }
```

**Cover what a reviewer actually needs to see:**

- Every variant and size — an `AllVariants` story rendering the grid is worth more than
  ten separate exports for a design-system component
- The states: loading, disabled, error, empty, selected
- **Content extremes** — a story with a very long label is the fastest way to catch
  truncation and wrapping bugs
- Responsive: use the `viewport` parameter to pin stories to your project's breakpoints
- Interaction, via the play function, for anything with behaviour:
  ```tsx
  export const Submits: Story = {
    play: async ({ canvasElement, step }) => {
      const canvas = within(canvasElement)
      await step('submit', async () => {
        await userEvent.click(canvas.getByRole('button', { name: /save/i }))
      })
    },
  }
  ```

**Use `args`, not hard-coded JSX props** — args feed the controls panel, which is the
point of Storybook.

**Add the a11y addon parameters** if `@storybook/addon-a11y` is installed; stories are
the cheapest place to catch accessibility defects.

## Step 5 — Verify

Build or run Storybook and confirm the story renders:

```bash
npm run build-storybook
```

Report any story that errors, including pre-existing ones.

## Keeping in sync

When a change **removes or renames** a prop, the stories that use it break. Grep for the
component name across `*.stories.*` before finishing, and update every story you find —
not just the one you were thinking about.
