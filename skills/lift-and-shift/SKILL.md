---
name: lift-and-shift
description: Port an existing live website to a new stack with measured fidelity. Use on any lift-and-shift project, when the developer supplies a live or staging URL as the reference, or when migrating pages from an old site. Covers URL intake, computed-style extraction at every breakpoint, content and asset inventory, SEO parity, and side-by-side verification.
model: opus
effort: high
---

# Lift and Shift

You are rebuilding something that already exists and can be measured. That is a large
advantage over Figma work — use it. **Extract computed styles; never eyeball pixels.**

## Part 1 — Intake (mandatory before implementation)

1. **The reference URL.** Live or staging. Record it as `referenceUrl` in
   `.claude/frontend-kit/project-profile.json` — the setup-gate hook reads this field.
2. **Verify it loads.** Navigate with the browser tools before recording it. A URL that
   404s is not a reference.
3. **Auth.** If pages are gated, ask for reachable equivalents or a staging bypass link.
   Do not ask for and do not enter their credentials.
4. **Fidelity mode** — the single most important question:
   - **Faithful port** — the new site should be visually indistinguishable. The live
     site is the spec, bugs included, and you flag rather than fix.
   - **Port + cleanup** — match the design, but fix obvious defects (a11y, broken
     responsive, inconsistent spacing). Ask which fixes are in scope.
   - **Port + redesign** — keep content and information architecture, restyle. The live
     site is a content reference only; the visual source is elsewhere.
5. **Scope** — which routes are in, which are explicitly out, and the priority order.
6. **Target stack** and any deliberate departures from the original (e.g. jQuery
   carousel → a React component).

## Part 2 — Extraction

Set up: `preview_start` on the reference URL (or navigate an existing tab), then work
breakpoint by breakpoint from `.claude/frontend-kit/breakpoints.md`.

**Structure** — `read_page` for the accessibility tree and `get_page_text` for content.
This gives you the semantic skeleton and the real copy in one pass.

**Computed styles** — this is the part people skip and regret. Use `javascript_tool`:

```js
// Every distinct text style actually used on the page
[...new Set([...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,a,li,span,button,label')]
  .map(el => { const s = getComputedStyle(el);
    return [el.tagName, s.fontFamily, s.fontSize, s.fontWeight, s.lineHeight,
            s.letterSpacing, s.color, s.textTransform].join(' | '); }))].sort()
```

```js
// Colour inventory, by frequency
const c = {};
document.querySelectorAll('*').forEach(el => { const s = getComputedStyle(el);
  [s.color, s.backgroundColor, s.borderTopColor].forEach(v => {
    if (v && v !== 'rgba(0, 0, 0, 0)') c[v] = (c[v] || 0) + 1; }); });
Object.entries(c).sort((a,b) => b[1]-a[1]).slice(0, 40)
```

```js
// Spacing scale in use — reveals the underlying grid (4px? 8px? none?)
const sp = new Set();
document.querySelectorAll('*').forEach(el => { const s = getComputedStyle(el);
  ['marginTop','marginBottom','paddingTop','paddingBottom','paddingLeft','gap']
    .forEach(p => { const v = parseFloat(s[p]); if (v > 0) sp.add(v); }); });
[...sp].sort((a,b) => a-b)
```

```js
// Layout container: max width and gutters
const m = document.querySelector('main, .container, #content, [role="main"]');
m && (({width, maxWidth, paddingLeft, paddingRight, display, gridTemplateColumns}) =>
  ({width, maxWidth, paddingLeft, paddingRight, display, gridTemplateColumns}))(getComputedStyle(m))
```

```js
// The site's own breakpoints, read out of its stylesheets
[...new Set([...document.styleSheets].flatMap(ss => { try { return [...ss.cssRules] } catch { return [] } })
  .filter(r => r.type === 4).map(r => r.conditionText))].sort()
```

Run the last one early — it tells you the *original* breakpoints, which may differ from
the ones you are targeting. Reconcile the difference with the developer explicitly.

**Interaction states** — drive them, do not assume: `hover` over elements and re-read
computed styles, `Tab` to read focus styles, open menus and modals and capture them.

**Transitions** — read `transitionProperty`, `transitionDuration`, `transitionTimingFunction`
and any `animation` on the elements that move.

**Assets** — inventory images, icons, fonts and video. Note formats and dimensions.
Prefer regenerating icons as inline SVG and images through the new stack's optimiser
(`next/image`) rather than copying rendered output.

**Behaviour** — `read_network_requests` to find the APIs the page calls; note anything
that must be reimplemented server-side.

## Part 3 — Do not port the bugs

While extracting, keep a defect list. Common finds on legacy sites: `div` used as a
button, images with no `alt`, heading levels skipped, contrast failures, horizontal
overflow on mobile, layout shift from unsized media, `100vh` breaking on mobile Safari.

Report the list and ask which to fix — the answer depends on the fidelity mode from
Part 1. In *faithful port* mode a11y fixes are usually still approved; ask rather than
assume.

## Part 4 — SEO parity (this is where lift-and-shift projects fail)

A visual match with lost rankings is a failed migration. For every ported page capture
from the original and reproduce in the new one:

- `<title>`, `<meta name="description">`, canonical URL
- OG and Twitter card tags
- Heading hierarchy — same structure, same H1
- Structured data (JSON-LD) — extract with
  `[...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent)`
- `robots` directives, `hreflang` if localised
- **The URL itself.** If the path changes, a 301 redirect is required. Build the
  old→new redirect map as you go and hand it to the developer — this is the single most
  commonly forgotten deliverable in a migration.
- `sitemap.xml` and `robots.txt` parity

Run the `seo-nextjs` skill if the target is Next.js.

## Part 5 — Verification

Side by side, at every breakpoint. Open the reference in one tab and the new build in
another, resize both identically, and compare: layout → block spacing → typography
metrics → colour → borders and shadows → interaction states.

When something differs, measure both with `getComputedStyle` and report numbers, not
impressions. Then check Core Web Vitals against the original (`performance-budget`
skill) — a migration that is slower than what it replaced is a regression.

## Deliverables

Ported pages, the defect list with dispositions, the redirect map, the SEO parity
table, and the breakpoint-by-breakpoint comparison.
