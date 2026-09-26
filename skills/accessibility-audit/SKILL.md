---
name: accessibility-audit
description: Check and fix accessibility on components and pages. Use when building anything interactive — buttons, forms, modals, menus, tabs, carousels — when auditing a page, when porting a legacy site, and whenever a div is about to be given an onClick. Targets WCAG 2.2 AA.
model: inherit
effort: high
---

# Accessibility audit

Accessibility is not a phase at the end. It is a set of decisions made while writing the
component, and almost all of them are free if made at the right moment.

## The decision that prevents most defects

**Use the semantic element.** A `<button>` gives you, for free: keyboard activation with
Enter and Space, focus management, the correct role and accessible name, disabled
semantics, and form participation. A `<div onClick>` gives you none of these and needs
about twelve lines of code to catch up — code that is always subtly wrong.

| Intent | Element |
|---|---|
| Performs an action | `<button type="button">` |
| Navigates somewhere | `<a href>` |
| Submits a form | `<button type="submit">` |
| Groups related list items | `<ul>` / `<ol>` + `<li>` |
| Primary navigation | `<nav aria-label="...">` |
| Page's main content | `<main>` (exactly one) |
| Expandable section | `<details>`/`<summary>`, or a button with `aria-expanded` |
| Modal | `<dialog>` or a `role="dialog"` with `aria-modal` + focus trap |

ARIA is a patch for when semantics genuinely cannot express something. The first rule
of ARIA is not to use ARIA.

## The checklist

### Names
Every interactive element has an accessible name. Icon-only buttons need one explicitly:
```tsx
<button aria-label="Close dialog"><XIcon aria-hidden="true" /></button>
```
The decorative icon inside gets `aria-hidden="true"` so it is not announced twice.

Link text must make sense alone — screen reader users often navigate by pulling up a
list of links. "Read more" ×8 on a page is useless.

### Keyboard
- Everything reachable by Tab, in a logical order
- Nothing is a keyboard trap (except a deliberate, escapable modal trap)
- `:focus-visible` styling that is genuinely visible — never `outline: none` without a
  replacement
- Escape closes overlays; Enter/Space activate buttons; arrow keys move within
  composite widgets (menus, tabs, listboxes)
- Custom controls implement the keyboard interactions from the WAI-ARIA Authoring
  Practices pattern for that widget — look it up rather than improvising

### Focus management
- Opening a modal moves focus into it; closing returns focus to the trigger
- Focus is trapped inside an open modal
- Route changes move focus to the new page's heading or main landmark
- Focus never lands on a hidden element

### Forms
- Every input has a `<label>` associated by `htmlFor`/`id`. A placeholder is not a label —
  it disappears on input and fails contrast.
- Required fields marked in the accessible name, not by colour alone
- Errors associated with the field via `aria-describedby`, announced via `role="alert"`
  or `aria-live="polite"`
- `aria-invalid` on failing fields
- Related radios/checkboxes grouped in `<fieldset>` with a `<legend>`
- Correct `autocomplete` and `inputmode` attributes

### Colour and contrast
- Body text ≥ 4.5:1; large text (≥18.66px bold or ≥24px) ≥ 3:1
- UI components and focus indicators ≥ 3:1 against their surroundings
- Colour is never the only carrier of meaning — pair it with an icon, text or pattern
- Check in both light and dark themes

### Images and media
- Informative images: `alt` describing the information
- Decorative images: `alt=""`
- Functional images (an icon that is a link): `alt` describing the destination
- Never `alt="image of..."` — screen readers already announce it as an image
- Video needs captions; audio needs a transcript

### Structure
- One `<h1>` per page; heading levels descend without skipping
- Landmarks: `header`, `nav`, `main`, `footer`
- A skip link to main content as the first focusable element
- `<html lang="en">` set correctly
- Tables use `<th>` with `scope`; layout is not done with tables

### Motion and zoom
- `prefers-reduced-motion` respected for anything that moves
- No content flashing more than three times per second
- Content reflows without horizontal scroll at 320px width / 400% zoom
- Text remains readable at 200% zoom — avoid fixed pixel heights around text

### Dynamic content
- Async status announced via `aria-live` regions
- `aria-busy` during loading where appropriate
- Toasts are announced and are dismissible by keyboard, with enough time to read

## Verifying

**The accessibility tree first.** `read_page` in the browser tools shows exactly what
assistive technology sees. If an element has no accessible name there, it has no
accessible name anywhere.

**Tab through the whole page.** This takes ninety seconds and finds more real defects
than any automated tool.

**Automated checks** catch roughly a third of issues — useful, not sufficient:
- `@axe-core/playwright` or `jest-axe`, if installed
- `eslint-plugin-jsx-a11y` — check whether it is in the lint config, and turn it on if
  the developer wants it
- Lighthouse's accessibility audit
- `@storybook/addon-a11y` for per-component checks

**Quick console check:**
```js
// Interactive elements with no accessible name
[...document.querySelectorAll('button,a,input,select,textarea,[role="button"]')]
  .filter(el => !(el.getAttribute('aria-label') || el.textContent.trim() ||
                  el.getAttribute('title') || el.labels?.length))

// Images missing alt entirely
[...document.querySelectorAll('img:not([alt])')]

// Heading order
[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => h.tagName + ' ' + h.textContent.trim().slice(0,50))
```

## Reporting

Group by severity — blockers (unusable by keyboard or screen reader) first, then
serious, then minor. For each: what, where, which WCAG criterion, and the fix. Offer to
apply the fixes.
