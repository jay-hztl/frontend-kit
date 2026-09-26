---
name: i18n-rtl
description: Build UI that survives translation and right-to-left languages. Use when the project ships more than one locale, when adding user-facing text, when formatting dates, numbers or currency, and when a layout needs to mirror for Arabic, Hebrew, Farsi or Urdu.
model: inherit
effort: medium
---

# Internationalisation and RTL

## Step 1 — Is this project localised?

```bash
grep -oE '"(next-intl|react-i18next|i18next|@lingui/core|react-intl|@formatjs/[a-z-]+)"' package.json
ls -d locales messages public/locales src/i18n 2>/dev/null
grep -rn 'defaultLocale\|locales:' next.config.* 2>/dev/null
```

If nothing is set up, do not introduce an i18n library unasked — it is an architectural
decision. Do still avoid the patterns below that cost nothing to get right now and are
expensive to retrofit.

## Step 2 — Never concatenate translated strings

This is the single most common i18n bug, because it reads fine in English:

```tsx
// Broken — word order is not universal, and plurals are not a suffix
<p>{count} {count === 1 ? 'item' : 'items'} in your {basketName}</p>

// Correct — one message, with named placeholders and real plural rules
<p>{t('basket.summary', { count, basket: basketName })}</p>
```

Let the i18n library handle plurals via ICU (`{count, plural, one {...} other {...}}`).
Several languages have more than two plural forms; Arabic has six. A ternary cannot
express that.

Keep the whole sentence in one message. A translator given three fragments cannot reorder
them, and word order differs between languages.

## Step 3 — Format with `Intl`, never by hand

Built in, zero bundle cost, locale-correct:

```ts
new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-3, 'day')  // "3 days ago"
new Intl.ListFormat(locale).format(['a', 'b', 'c'])                          // "a, b, and c"
```

Never hard-code `$`, `,` as a thousands separator, `MM/DD/YYYY`, or a currency symbol
position. Decimal separators, digit grouping and symbol placement all vary.

## Step 4 — Design for text expansion

German and Finnish commonly run 30–50% longer than English; Japanese is much shorter.

- Never fix the width of a text container to fit the English string
- Buttons and nav items must wrap or truncate deliberately, not overflow
- Test with the longest realistic translation, not lorem ipsum
- Avoid text baked into images — it cannot be translated

Use the **pseudo-locale trick** to find problems before translators do: render every
string wrapped and lengthened (`[!!! Ṡàṽé çhàñĝéṡ !!!]`). Anything untranslated shows up
unwrapped; anything too narrow breaks visibly.

## Step 5 — RTL

If any target locale is Arabic, Hebrew, Farsi or Urdu, the layout must mirror.

**Use logical properties everywhere.** This is the whole job, and it costs nothing:

| Physical (breaks in RTL) | Logical (mirrors automatically) |
|---|---|
| `margin-left` | `margin-inline-start` |
| `padding-right` | `padding-inline-end` |
| `left` / `right` | `inset-inline-start` / `inset-inline-end` |
| `text-align: left` | `text-align: start` |
| `border-left` | `border-inline-start` |

Tailwind: `ms-4` / `me-4` / `ps-4` / `pe-4` / `start-0` / `end-0` instead of
`ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`.

Set `dir` on the html element from the locale (`dir={isRtl ? 'rtl' : 'ltr'}`), and `lang`
correctly — `lang` drives font selection, hyphenation and screen-reader pronunciation.

**Mirror directional icons** — back arrows, chevrons, progress. Do **not** mirror logos,
media playback controls (play always points the same way), or numerals.

**Do not mirror**: phone numbers, code, URLs, and most numbers stay LTR inside RTL text.
Use `dir="ltr"` on those specific nodes.

## Step 6 — The rest

- **Locale in the URL** (`/de/pricing`) for SEO; add `hreflang` alternates and a
  self-referencing canonical. See `seo-nextjs`.
- **Sorting** uses `Intl.Collator`, not `Array.sort()` on raw strings — accented
  characters sort differently per locale.
- **Names, addresses, phone formats** vary structurally. Avoid `firstName`/`lastName`
  assumptions where you can; prefer a single full-name field.
- **Do not detect locale from IP alone** — honour `Accept-Language` and let the user
  override, persistently.
- **Missing translations** should fall back visibly in development and gracefully in
  production. Never render a raw key like `basket.summary` to a user.

## Verify

Switch to the longest locale and to an RTL locale, then run `browser-verification` at
every breakpoint. Check: nothing overflows, nothing is clipped, the layout mirrors, icons
point the right way, numbers and dates read correctly, and no untranslated key is visible.
