---
name: seo-nextjs
description: Make Next.js pages and components search-engine and social-share ready. Use when building or changing anything content-bearing in a Next.js app, when adding a route, during a lift-and-shift migration where rankings must be preserved, or when the developer mentions SEO, metadata, sitemaps, structured data or Core Web Vitals.
model: inherit
effort: medium
---

# SEO for Next.js

SEO is mostly a rendering and semantics problem, which makes it a frontend problem.

First: confirm the router. `app/` is the App Router; `pages/` is the Pages Router. The
metadata APIs differ completely and mixing them silently does nothing. Check
`package.json` for the Next version and use the API for **that** version.

## Rendering — the decision that matters most

Everything else is downstream of whether the content is in the initial HTML.

- **Server Components by default.** Content inside a `'use client'` subtree that only
  appears after hydration is weaker for indexing and worse for LCP. Push the client
  boundary to the leaf that needs interactivity.
- Choose deliberately per route: static (default), `revalidate` for ISR, or dynamic.
  Marketing and content pages should be static or ISR.
- Verify by looking at the actual HTML, not the rendered DOM:
  ```bash
  curl -s http://localhost:3000/your-route | grep -o '<h1[^>]*>[^<]*' 
  ```
  If the content is not in that output, search engines are working harder than they
  should to find it.

## Metadata (App Router)

Static:
```ts
export const metadata: Metadata = {
  title: 'Page title — Brand',
  description: 'Under ~160 characters, specific, written for a human.',
  alternates: { canonical: '/the-path' },
  openGraph: { title, description, url, siteName, images: [{ url, width: 1200, height: 630 }], type: 'website' },
  twitter: { card: 'summary_large_image', title, description, images: [url] },
}
```

Dynamic routes use `generateMetadata()`. Set a `title.template` in the root layout so
child pages only supply their own part. Set `metadataBase` in the root layout, or
relative OG image URLs resolve wrongly in production.

Pages Router uses `next/head` with explicit tags — no `metadata` export.

## Checklist per page

- **One** `<h1>`, containing the page's actual subject
- Heading levels descend without skipping (h1 → h2 → h3)
- `title` unique per route, ~50–60 chars
- `description` unique per route, ~140–160 chars
- Canonical URL set — critical on anything reachable at more than one path
- OG + Twitter tags with a 1200×630 image
- `robots` directives where a page should not be indexed
- `hreflang` / `alternates.languages` if localised

## Structured data

Add JSON-LD in the server component:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
/>
```

Match the schema type to the page: `Article`/`BlogPosting`, `Product` + `Offer`,
`BreadcrumbList`, `FAQPage`, `Organization`, `LocalBusiness`, `Event`. Only mark up what
is genuinely visible on the page — marking up absent content is a policy violation, not
a clever trick.

## Images and fonts

- `next/image` with explicit `width`/`height` or `fill` + a sized container. This
  prevents layout shift, which is a ranking factor.
- `priority` on the LCP image only. Everything else lazy-loads by default.
- `alt` that describes the image; `alt=""` for purely decorative ones. Never omit it.
- `next/font` for self-hosted fonts — it removes the render-blocking request and sets
  `size-adjust` to reduce font-swap shift.

## Semantics

`<header>`, `<nav>`, `<main>` (exactly one), `<article>`, `<aside>`, `<footer>`. Real
`<a href>` for navigation — a click handler on a `div` is invisible to crawlers.
Descriptive link text: "Read the 2026 pricing guide", never "click here".

## Site-level files

- `app/sitemap.ts` — generate from real routes, not a hard-coded list that drifts
- `app/robots.ts`
- `app/opengraph-image.tsx` for dynamic OG images
- `app/not-found.tsx` returning a real 404 status

## Core Web Vitals

- **LCP** ≤ 2.5s — usually the hero image or heading. `priority` it, preload the font,
  keep it server-rendered.
- **INP** ≤ 200ms — driven by client JS. Fewer client components, split heavy work.
- **CLS** ≤ 0.1 — dimension every image, embed and ad slot; reserve space for anything
  that loads late; avoid injecting banners above existing content.

Run the `performance-budget` skill for measurement.

## Lift-and-shift migrations

The highest-risk SEO scenario. For every migrated URL:

1. Capture the original's title, description, canonical, OG tags, headings and JSON-LD.
2. Reproduce them.
3. **If the path changes, add a 301 redirect** in `next.config.js` `redirects()`. Keep a
   complete old→new map and hand it over — this is the most commonly forgotten
   deliverable in a migration and the most expensive to discover later.
4. Diff old vs new `sitemap.xml` and `robots.txt`.
5. Verify rendered HTML parity with `curl`, not just visual parity.

## Verify

```bash
curl -s http://localhost:3000/route | grep -E '<title>|<meta name="description"|rel="canonical"|og:|application/ld\+json'
```

Then run Lighthouse against a production build (`next build && next start`) — dev-mode
numbers are meaningless.
