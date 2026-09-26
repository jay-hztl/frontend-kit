---
name: visual-regression
description: Capture and diff visual baselines so "pixel perfect" is measured rather than asserted. Use before and after changing a shared component, during a lift-and-shift port, when a refactor should be visually identical, and whenever you need proof that a change did not break something else.
model: inherit
effort: medium
---

# Visual regression

"I checked and it looks fine" does not survive a refactor that touches forty components.
This makes the check repeatable and exact.

## Two kinds of baseline, and why both

**Style snapshots** — computed CSS values for key elements at each breakpoint, saved as
JSON. Diffing is exact and deterministic, and a diff names the property that changed
(`gap: 16px → 24px`). This is the one that catches real regressions with no false alarms.

**Screenshots** — a PNG per breakpoint for human comparison. Catches things numbers
cannot: overlap, clipping, a broken image, something rendering in the wrong place.

The kit ships an exact differ for the first. The second stays a human judgement, and this
skill will not pretend otherwise — there is no image-diff library here, and adding one is
a decision for the project, not for a plugin.

## Capture a baseline

Before you change anything. Start the app (`browser-verification` skill), then for each
breakpoint in `.claude/frontend-kit/breakpoints.md`:

1. `resize_window` to that width.
2. Run the snapshot extractor via `javascript_tool`:

```js
(() => {
  const SEL = 'main h1, main h2, main p, main button, main a, [data-testid], .card, header, footer, nav'
  const PROPS = ['display','flexDirection','justifyContent','alignItems','gap',
    'width','height','padding','margin','fontFamily','fontSize','fontWeight','lineHeight',
    'letterSpacing','color','backgroundColor','borderRadius','borderWidth','boxShadow','opacity']
  const out = {}
  document.querySelectorAll(SEL).forEach((el, i) => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect()
    const key = `${el.tagName.toLowerCase()}#${i}${el.className ? '.' + String(el.className).split(' ')[0] : ''}`
    const rec = { _rect: `${Math.round(r.width)}x${Math.round(r.height)}` }
    PROPS.forEach(p => { rec[p] = s[p] })
    out[key] = rec
  })
  return JSON.stringify(out, null, 2)
})()
```

3. Save it to `.claude/frontend-kit/baselines/<route>--<breakpoint>.json`.
4. Also `screenshot` and note it for visual comparison.

Tailor `SEL` to the route — the default is a starting point, not a rule. For a component
library, snapshot the Storybook story URL instead of an app route.

## Compare after a change

Re-capture into `<name>.current.json`, then run the differ that ships with the plugin:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/diff-snapshot.mjs" <baseline.json> <current.json>
```

It exits `0` when identical and `1` when anything differs, printing each change as
`element → property: before → after`. That output goes straight into your report.

## Reading a diff

Not every difference is a regression. Triage in this order:

1. **Intended** — you changed this component on purpose. Update the baseline.
2. **Collateral** — something you did *not* intend to touch moved. This is the whole
   point of the exercise. Investigate before shipping.
3. **Noise** — a dynamic value (a timestamp, a random id, an animation mid-flight).
   Exclude it from `SEL` or settle the page before capturing.

Animations are the usual source of false diffs. Disable them for capture:

```js
document.head.insertAdjacentHTML('beforeend',
  '<style>*,*::before,*::after{animation:none!important;transition:none!important}</style>')
```

## When to bother

Worth it: changing a shared primitive, a token or theme change, a lift-and-shift port
(baseline the *original site* and compare the rebuild against it), a framework upgrade,
a CSS refactor that should be behaviour-neutral.

Not worth it: a one-off page nobody else depends on, or a change where the visual result
*is* the deliverable and you are comparing against a design instead.

## Committing baselines

Baselines are shared truth — commit them so a teammate's change is diffed against the
same reference. Review baseline updates in the PR: an unexplained baseline change is how
a regression gets blessed permanently.
