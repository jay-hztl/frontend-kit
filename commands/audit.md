---
description: Audit accessibility, performance, SEO and token hygiene
argument-hint: "[route, component, or 'all'] [a11y | perf | seo | tokens]"
---

Audit the frontend:

$ARGUMENTS

If no area is specified, run all four. If no target is specified, ask which route or
component to audit rather than attempting the whole codebase blind.

**Accessibility** (`accessibility-audit` skill) — semantic elements, accessible names,
keyboard path, focus management, forms, contrast, structure, motion, dynamic content.
Verify against the accessibility tree via `read_page`, not just by reading source.

**Performance** (`performance-budget` skill) — measure LCP, CLS, INP and long tasks in
the browser; bundle size against a **production** build. Name the specific element or
module responsible for each number.

**SEO** (`seo-nextjs` skill, if Next.js) — rendering strategy, metadata, canonical, OG,
structured data, headings, images, sitemap/robots. Check the rendered HTML with `curl`,
not the hydrated DOM.

**Tokens** (`design-tokens` skill) — find hard-coded hex, rgb and arbitrary values that
should be tokens. Group findings by how often each literal repeats.

Report findings grouped by severity, each with location, the rule it breaks, and the
fix. Then ask which to apply.
