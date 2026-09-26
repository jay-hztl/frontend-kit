---
name: figma-to-code
description: Connect Claude to Figma and translate designs into code with no invented values. Use on any figma-to-code project, whenever the developer shares a figma.com URL, and whenever the setup gate reports that figmaConnected is not true. Covers the connector walkthrough, connection verification, design extraction via the Figma MCP tools, and the extraction-to-implementation handoff.
model: opus
effort: high
---

# Figma to Code

## Part 1 — The connection is mandatory

On a figma-to-code project, no UI code ships before Figma is connected. Not a
placeholder, not a "rough version to iterate on". The reason is simple and worth saying
to the developer once: without the design source, every value in the component is a
guess, and guesses get rebuilt.

### Check whether it is already connected

Do not ask. Look. Figma MCP tools appear in your tool list with names like
`get_design_context`, `get_variable_defs`, `get_screenshot`, `get_metadata`,
`get_code_connect_map`. If they are present, connection is live — skip to Part 2.

If they are not present, run the walkthrough.

### The walkthrough

Tell the developer which of these applies and give them the steps verbatim.

**Option 1 — Figma connector (recommended, works everywhere)**

1. Open Figma → **Preferences** → enable **Enable local MCP Server** (Figma Desktop
   app, on a paid seat — Dev Mode MCP requires a Professional plan or above).
2. In Claude Code run:

```bash
claude mcp add --transport http figma http://127.0.0.1:3845/mcp
```

3. Restart the session, or run `/mcp` to confirm `figma` shows as connected.

**Option 2 — Remote Figma connector (no desktop app)**

Add Figma from the connector directory in the Claude app (Settings → Connectors), or:

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

Then complete the OAuth flow in the browser when prompted.

**Option 3 — Already using Claude Desktop / claude.ai**
Settings → Connectors → add **Figma** → authorise.

### Verify — do not take their word for it

Ask for a Figma file or frame URL, then actually call a Figma tool against it
(`get_metadata` is cheap). Report what came back.

- **Worked** → set `"figmaConnected": true` in
  `.claude/frontend-kit/project-profile.json`, record the file URL, and continue.
- **Failed** → do not set the flag. Report the exact error and the likely cause:
  - Tools missing entirely → the MCP server is not registered; re-run the add command.
  - Connection refused on 127.0.0.1:3845 → Figma Desktop is not running, or the local
    MCP server toggle is off.
  - 403 / permission → the account lacks Dev Mode access on a paid seat, or lacks
    access to that specific file.
  - "Node not found" → the URL has no `node-id`; ask them to right-click the frame →
    **Copy link to selection**.

### If they genuinely cannot connect

Say plainly what the consequences are: you can build structure and behaviour, but every
spacing, colour and type value has to be supplied by them, value by value, and the
result should not be called pixel-perfect. Get explicit agreement before proceeding
that way, and record it in the profile as `"figmaConnected": false` with a note.

---

## Part 2 — Getting a usable URL

You need a link **to a selection**, not to the file. Ask them to select the frame and
use **Copy link to selection** (⌘L / Ctrl+L). A valid URL contains `node-id=`.

For any given task ask for:
- The frame for each breakpoint that exists (desktop, tablet, mobile).
- Any component variant frames (states, sizes).
- The interaction spec, if hover/transition behaviour is in scope — Figma rarely
  carries this, so it usually has to be described.

---

## Part 3 — Extraction

Call these in order and use what they return, in preference to reading pixels:

1. **`get_code_connect_map`** — first, always. If the design's components are mapped to
   real code components, you must use the mapped component. Building a duplicate when a
   mapping exists is a defect.
2. **`get_variable_defs`** — the design's variables. These are the tokens. A colour
   that has a variable must be referenced through the project's equivalent token, never
   pasted as a hex literal.
3. **`get_design_context`** — structure, auto-layout, constraints, hierarchy. Auto-layout
   translates to flex/grid; read the direction, gap, padding, alignment and sizing mode
   (hug / fill / fixed) and map them honestly.
4. **`get_screenshot`** — your reference image for the final visual comparison.
5. **`get_metadata`** — for large frames, to navigate the node tree without pulling
   everything at once.
6. **`download_assets`** — for icons and images that are not already in the codebase.
   Prefer SVG for icons. Check whether the project already has the icon before adding it.

## Part 4 — Translation rules

| Figma | Code |
|---|---|
| Auto-layout vertical/horizontal | `flex-direction: column / row` |
| Item spacing | `gap` — never margins between siblings |
| Padding | `padding` on the container |
| Hug contents | `width: fit-content` / intrinsic sizing |
| Fill container | `flex: 1` / `width: 100%` |
| Fixed | explicit width/height — question it, it is often wrong at other breakpoints |
| Absolute position | `position: absolute` — but check it is not a layout that should be flex |
| Constraints (left/right/scale) | how the element behaves as the container resizes |
| Text style | a token/utility, applying `font-size` + `line-height` + `weight` + `letter-spacing` together |
| Effect / drop shadow | `box-shadow` — match blur, spread, offset and alpha exactly |
| Variable | the project's matching design token |

## Part 5 — What you must ask about, never decide

On a figma-to-code project the developer owns every design decision. Ask when:

- Only one breakpoint frame exists → "The design shows 1440px only. What should this do
  at tablet and mobile?" Do not extrapolate.
- A value has no token equivalent in the codebase → ask whether to add a token, snap to
  the existing scale, or use a one-off.
- Hover / focus / active / disabled / loading / error states are not in the file → ask.
  Never design a hover state yourself.
- Content in the design is placeholder → ask what real content looks like, and what the
  longest realistic string is.
- Two frames disagree, or the design contradicts an existing shipped component → surface
  the conflict, do not silently pick one.
- An interaction is implied but unspecified (what does this button do?) → ask.

Batch these into one `AskUserQuestion` round per task where you can.

## Part 6 — Close out

Hand to the `pixel-perfect-designer` agent for implementation, then verify against the
`get_screenshot` reference at every breakpoint. Record any new tokens via the
`design-tokens` skill, and any durable project fact via `kit-self-improve`.
