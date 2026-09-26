---
name: async-ui-states
description: Build the loading, empty, error and success states that async UI needs. Use whenever a component fetches data, mutates data, or renders anything that arrives later — lists, tables, dashboards, search results, infinite scroll, and anything behind Suspense or an error boundary.
model: inherit
effort: medium
---

# Async UI states

The happy path is the easy quarter of the work. If a component fetches anything, four
states are in scope whether or not the design shows them — and if the design does not
show them, that is a question for the developer, not licence to invent.

## The four states, and the two people forget

| State | Gets built | Notes |
|---|---|---|
| **Loading** | usually | Skeleton or spinner — see below |
| **Success** | always | The happy path |
| **Empty** | *often skipped* | Zero results is not an error, and a blank box is not an empty state |
| **Error** | *often skipped* | Must be recoverable, not a dead end |
| Partial | rarely | Some data loaded, some failed |
| Stale / refetching | rarely | Showing old data while new arrives |

**Empty** needs to say what happened and what to do next: "No invoices yet — create your
first one" with the action, not an empty table with headers. Distinguish *no data yet*
from *no results for this filter*; they need different copy and different actions.

**Error** needs to say what failed, whether it is the user's fault, and offer a retry.
"Something went wrong" with no retry is a dead end. Never render a raw exception message.

## Make impossible states unrepresentable

```ts
type Result<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error; retry: () => void }
  | { status: 'empty' }
  | { status: 'success'; data: T }
```

Not `{ loading: boolean; error?: Error; data?: T }` — that permits
`loading && error && data`, a combination the UI has no rendering for, and which will
eventually happen.

## Loading: skeleton or spinner?

- **Skeleton** when you know the shape of what is coming and it is above the fold. It must
  **match the real content's dimensions** — a skeleton of the wrong height causes exactly
  the layout shift it was meant to prevent.
- **Spinner** for short, indeterminate waits in a small area.
- **Nothing** for waits under ~200ms. A flash of spinner is worse than a brief pause; delay
  showing it.
- **Optimistic** when the mutation nearly always succeeds and can be rolled back visibly.

Whatever you use, reserve the space. Layout shift is a Core Web Vitals failure and the
most common one caused by async UI.

## Announce state changes

Sighted users see the spinner disappear. Screen reader users get nothing unless you say so:

- Wrap the async region in `aria-live="polite"` (or `aria-busy` during load)
- Errors get `role="alert"` so they interrupt
- After a mutation, announce the outcome — "Invoice saved" — not just a toast that may be
  invisible to AT

## React specifics

- **Server Components first.** If data can be fetched on the server, the loading state may
  not need to exist at all in the client bundle.
- **`loading.tsx` / `<Suspense>`** in the Next.js App Router gives you streaming, but note
  Suspense handles *loading* only — errors need an error boundary and empty needs your own
  branch.
- **Error boundaries** catch render errors, not fetch rejections in effects. Handle both.
  Put a boundary at the route level *and* around independently-failing widgets, so one
  broken chart does not blank the dashboard.
- **Avoid waterfalls.** Sequential awaits that do not depend on each other should be
  `Promise.all`. Check whether a child component triggers its own fetch that the parent
  could have done once.
- **Do not derive state in `useEffect`** when it can be computed during render.

## Lists

- Stable keys — never the array index in a list that can reorder
- Virtualise past a few hundred rows (`@tanstack/virtual`, `react-window`)
- Infinite scroll needs a keyboard-reachable "Load more" alternative and a clear end state
- Pagination: preserve position and filters across navigation

## Verify

Force every state and look at it — do not reason about it:

```js
// In the browser console, or by temporarily returning the state from your hook
// Throttle the network to Slow 3G and reload to see the real loading state.
```

Check: no layout shift between loading and loaded, empty state renders real copy, error
offers a retry that works, and the whole cycle is announced. Then `browser-verification`.
