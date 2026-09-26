---
name: unit-testing
description: Write or update unit tests after a code change, in projects that already have a test runner. Use after modifying component behaviour, adding a hook, or fixing a bug — ask the developer whether tests are wanted, then write behaviour-focused tests in the project's existing framework and run them.
model: inherit
effort: medium
---

# Unit testing

## Step 1 — What is installed?

```bash
grep -oE '"(vitest|jest|@testing-library/[a-z-]+|@playwright/test|cypress)"' package.json | sort -u
ls vitest.config.* jest.config.* 2>/dev/null
grep -A 12 '"scripts"' package.json
```

No runner → skip. Do not install a test framework unasked; that is an architectural
decision belonging to the team.

## Step 2 — Ask

> This project uses Vitest + Testing Library, and I've changed the `Button` loading
> behaviour. Should I add tests?
>
> - **Yes** (Recommended) — cover the loading state and the disabled-while-loading behaviour
> - **Yes, and backfill** — also cover the existing untested variants
> - **No** — skip for now

Honour a standing "always"/"never" from onboarding instead of re-asking every time.

## Step 3 — Test behaviour, not implementation

The single rule that decides whether a test is an asset or a liability: **a refactor
that preserves behaviour must not break the test.**

```tsx
// Good — this is what the user experiences
expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
await user.click(screen.getByRole('button', { name: /save/i }))
expect(await screen.findByText(/saved/i)).toBeInTheDocument()

// Bad — coupled to internals; breaks on any refactor, proves nothing about the UI
expect(wrapper.state('isLoading')).toBe(true)
expect(component.find('.btn--loading')).toHaveLength(1)
```

**Query priority** (Testing Library's, and it is right):
`getByRole` → `getByLabelText` → `getByPlaceholderText` → `getByText` →
`getByDisplayValue` → `getByTestId` (last resort only).

Preferring `getByRole` means your tests double as accessibility tests: if you cannot
query an element by its role and accessible name, neither can a screen reader.

**Use `userEvent`, not `fireEvent`.** `userEvent` simulates the real sequence of events
a browser produces — focus, keydown, keypress, input, keyup. `fireEvent` dispatches one
synthetic event and misses real bugs.

```tsx
const user = userEvent.setup()
await user.click(...)
await user.type(input, 'hello')
await user.keyboard('{Escape}')
```

**Async:** `findBy*` and `waitFor`, never arbitrary `setTimeout`.

## Step 4 — What to cover

For a component:
- It renders with required props
- Each variant/size produces the visible difference it claims to
- Interaction produces the expected outcome — click, type, keyboard, Escape
- Disabled and loading actually prevent interaction
- Error state renders the error and is announced (`role="alert"` / `aria-live`)
- Empty state renders
- Callbacks fire with the right arguments
- Conditional rendering branches both ways
- Accessibility: accessible names exist, focus lands where it should, keyboard path
  works end to end

For a hook — `renderHook` from Testing Library: initial value, updates, cleanup,
error paths.

For a bug fix — **write the failing test first**, confirm it fails for the right
reason, then fix. A regression test that was never seen failing may be testing nothing.

## Step 5 — What not to test

Third-party library internals · CSS values (that is what visual regression is for) ·
implementation details · trivial pass-through props · snapshot tests of large trees
(they break on every change and get rubber-stamped, which is worse than no test).

Small, targeted snapshots are fine. Thousand-line ones are noise.

## Step 6 — Run them

```bash
npx vitest run path/to/Component.test.tsx
```

Use the project's own script if it has one. Report:
- New tests pass
- The full suite still passes (or exactly which pre-existing failures were already there)
- Anything you chose not to cover and why

Never report tests as written without running them.

## Mocking

Mock at the boundary: network (MSW is the right tool if installed), modules with side
effects, time (`vi.useFakeTimers()`). Do not mock the component under test, and do not
mock so deeply that the test only proves the mocks were called.
