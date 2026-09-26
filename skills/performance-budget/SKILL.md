---
name: performance-budget
description: Keep frontend performance and Core Web Vitals within budget. Use when building above-the-fold UI, adding a dependency, working with images or fonts, rendering large lists, after a lift-and-shift migration, or when the developer reports slowness. Measures rather than speculates.
model: inherit
effort: high
---

# Performance budget

Measure first. Frontend performance intuition is unreliable, and optimising the wrong
thing costs time and adds complexity for nothing.

## The targets

| Metric | Good | What drives it |
|---|---|---|
| **LCP** — largest contentful paint | ≤ 2.5s | Hero image/heading: server-render it, preload it, size it |
| **INP** — interaction to next paint | ≤ 200ms | Client JS volume, long tasks, heavy event handlers |
| **CLS** — cumulative layout shift | ≤ 0.1 | Unsized media, late-injected content, font swap |
| **TTFB** | ≤ 800ms | Server/CDN, rendering strategy |
| JS shipped to the client | budget it per route | Dependencies, client component boundaries |

## Measure

**In the browser**, on the running app:

```js
new PerformanceObserver(l => l.getEntries().forEach(e =>
  console.log('LCP', e.startTime, e.element))).observe({type:'largest-contentful-paint', buffered:true})

new PerformanceObserver(l => l.getEntries().forEach(e =>
  !e.hadRecentInput && console.log('CLS', e.value, e.sources?.map(s => s.node))))
  .observe({type:'layout-shift', buffered:true})

new PerformanceObserver(l => l.getEntries().forEach(e =>
  e.duration > 50 && console.log('Long task', e.duration))).observe({type:'longtask', buffered:true})
```

The `element` and `sources` fields are the point — they name the exact node responsible.

**Bundle size**, always against a production build:

```bash
npm run build          # Next.js prints per-route First Load JS
npx source-map-explorer 'dist/**/*.js'   # if a bundler output exists
```

Never benchmark a dev build. Dev-mode numbers are meaningless.

**Lighthouse** on `next build && next start`, not `next dev`.

## The fixes, in order of typical impact

### 1. Ship less JavaScript
- Server Components by default in the Next.js App Router; move `'use client'` down to
  the leaf that needs it. This is usually the single biggest win available.
- `next/dynamic` or `React.lazy` for anything below the fold or behind an interaction —
  modals, rich text editors, charts, maps, date pickers.
- Check the weight of a dependency before adding it (bundlephobia-style reasoning), and
  check whether something already installed does the job.
- Import the specific module, not the barrel: `import debounce from 'lodash/debounce'`.
- Large date/i18n libraries often have a much smaller modern equivalent — `Intl` is
  built in and free.

### 2. Images
- `next/image` (or the framework equivalent) with explicit dimensions
- Modern formats — AVIF/WebP with fallbacks
- `priority` on the LCP image only; everything else lazy
- Correct `sizes` so mobile does not download a desktop-width image
- A blur placeholder prevents the visual pop-in

### 3. Fonts
- `next/font` or `@font-face` with `font-display: swap`
- Preload only the fonts used above the fold
- Subset to the characters actually needed
- `size-adjust` / `ascent-override` on the fallback to reduce swap-induced shift
- Variable fonts instead of five static weights

### 4. Layout stability (CLS)
- Every image, video, iframe and ad slot has reserved dimensions or `aspect-ratio`
- Never inject content above existing content after load — banners push everything down
- Skeletons match the real content's dimensions
- Animate `transform` and `opacity` only; animating `width`/`top`/`height` triggers
  layout on every frame

### 5. Interaction responsiveness (INP)
- Break long tasks; `startTransition` for non-urgent state updates
- Debounce/throttle high-frequency handlers (input, scroll, resize)
- Virtualise long lists (`@tanstack/virtual`, `react-window`) past a few hundred rows
- Passive listeners for scroll/touch
- Do not run expensive work in render — memoise where you have *measured* a problem

### 6. Network
- Preconnect to critical third-party origins
- Prefetch likely next routes (Next.js `Link` does this by default)
- Cache headers on static assets
- Audit third-party scripts — analytics and tag managers are frequently the largest
  single cost on the page. Load them with `next/script` `strategy="afterInteractive"` or
  `"lazyOnload"`.

## React-specific

- Stable `key`s; never array index in a reorderable list
- Do not create new object/array/function props inline in hot paths
- Colocate state — lifting it too high re-renders half the tree
- `useMemo`/`useCallback` where profiling showed a problem, not preemptively; they have
  their own cost
- Avoid `useEffect` for derived values that can be computed during render

## Lift-and-shift check

After a migration, compare the new build to the original on the same metrics. A
rewrite that is slower than the legacy site it replaced is a regression, no matter how
much cleaner the code is. Measure both, report both.

## Reporting

Give the measured numbers before and after, name the specific element or module
responsible for each metric, and list the fixes applied. Do not claim an improvement you
did not measure.
