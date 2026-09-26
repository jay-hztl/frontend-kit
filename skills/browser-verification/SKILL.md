---
name: browser-verification
description: Prove a UI change works by rendering it in a real browser before reporting it done. Use after every frontend change, when the developer asks to check or QA something, when debugging a visual or runtime defect, and whenever you are about to claim a component works. Covers every breakpoint, interaction states, console, network and the accessibility tree.
model: inherit
effort: medium
---

# Browser verification

Reading the code tells you what should happen. Only the browser tells you what does.
No UI change is reported as done without this step.

For a thorough pass, run the `frontend-verifier` agent.

## Start the app — correctly

Use `preview_start`, never a raw `Bash` dev-server command (it will block the session).

If `.claude/launch.json` does not exist, create it from the project's dev script:

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 3000 }
  ]
}
```

Then `preview_start` with `{ "name": "dev" }`. Check `preview_logs` for build errors
before concluding the page itself is broken.

To inspect an external site instead, `preview_start` with `{ "url": "..." }`.

## The sweep

Run all of it. Report each section, including the parts that pass.

### 1. It renders
Page loads, the component is in the DOM, no blank region, no error boundary fallback.

### 2. Every breakpoint
`resize_window` to each width in `.claude/frontend-kit/breakpoints.md`, **plus 1px
below and above each boundary** — that is where media-query off-by-ones hide. Also check
320px and a very wide viewport.

At each width:
- No horizontal page scroll:
  ```js
  document.documentElement.scrollWidth > document.documentElement.clientWidth
  ```
  Find the culprit:
  ```js
  [...document.querySelectorAll('*')].filter(el =>
    el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
    .map(el => el.tagName + '.' + el.className)
  ```
- Nothing clipped, nothing overlapping, text readable
- Touch targets ≥ 44×44 CSS px at touch widths
- Images not stretched or squashed

### 3. Interaction states — drive them
- **Hover**: `computer` with `hover`, then re-read computed styles
- **Keyboard**: Tab all the way through. Is the focus ring visible? Is the order
  logical? Can you reach everything, and escape from everything?
- **Active / disabled / loading / error / empty**: trigger each one
- **Overlays**: does Escape close it, is focus trapped inside while open, does focus
  return to the trigger on close?
- **Forms**: submit empty, submit invalid, submit valid; is the error associated with
  the field and announced?

### 4. Console and network
`read_console_messages` — **any error is a failure.** Watch specifically for React
hydration mismatches, missing `key` warnings, failed asset loads, and CSP violations.
`read_network_requests` for 4xx/5xx and for oversized payloads.

### 5. Accessibility tree
`read_page` shows what assistive technology sees — the real test:
- Every interactive node has an accessible name
- Heading levels descend without skipping
- Images have `alt` or are correctly marked decorative
- Form controls have associated labels
- Landmarks present; exactly one `main`

### 6. Layout stability
Reload and watch for jumps as fonts and images load. Measure it:

```js
new PerformanceObserver(l => l.getEntries().forEach(e =>
  !e.hadRecentInput && console.log('CLS shift:', e.value))).observe({type:'layout-shift', buffered:true})
```

### 7. Compare to the source
Where there is a Figma frame or a live reference, put them side by side and check:
layout → block spacing → typography metrics → colour → borders/shadows/radii → states.

## Measuring, not guessing

When something looks wrong, get the number:

```js
// Everything about one element
(el => { const s = getComputedStyle(el), r = el.getBoundingClientRect();
  return { rect: {w: r.width, h: r.height, x: r.x, y: r.y},
    font: `${s.fontSize}/${s.lineHeight} ${s.fontWeight} ${s.letterSpacing}`,
    color: s.color, bg: s.backgroundColor,
    pad: s.padding, margin: s.margin, gap: s.gap, radius: s.borderRadius,
    display: s.display, position: s.position }; })(document.querySelector('YOUR_SELECTOR'))
```

```js
// Gap between two elements — settles "the spacing looks off" arguments
(a, b) => document.querySelector(b).getBoundingClientRect().top
        - document.querySelector(a).getBoundingClientRect().bottom
```

Report "gap is 16px, the design says 24px", never "the spacing looks a bit tight".

## Report

```
## Verified
<per section, what you observed>

## Defects
<what you saw · at which viewport · how to reproduce · the fix if it's obvious>

## Not verified
<what you couldn't reach, and what you need to check it>
```

If the dev server would not start, say exactly that and show the log. Never substitute
reasoning about the code for an observation you did not make.
