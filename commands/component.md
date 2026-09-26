---
description: Build a new component through the full kit workflow
argument-hint: "<component name and what it should do>"
---

Build this component:

$ARGUMENTS

Run the `component-architect` agent through the full `component-workflow`:

1. **Identify the application type** from the codebase — it determines the right API shape.
2. **Learn the local idiom** — read two nearby components and match their structure,
   naming, styling approach, export style and client-boundary placement.
3. **Design the API** and confirm the props table before writing the body.
4. **Build the full matrix** — every state, every breakpoint, content extremes,
   semantic HTML, tokens not literals.
5. **Close the loop** — type-check and lint (actually run them), then ask about
   Storybook and unit tests if installed, run SEO checks if this is Next.js and
   content-bearing, and verify in the browser.

Report the files changed, the conventions matched, the API you settled on, the matrix
you covered, and the verification results.
