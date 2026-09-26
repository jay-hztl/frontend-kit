---
description: Show what Frontend Kit knows about this project
---

Show the current Frontend Kit state for this project.

1. Read `.claude/frontend-kit/project-profile.json` and summarise: project type, design
   source, connection status, application type, stack and quality gates.
2. Report the breakpoint set from `breakpoints.md`, or flag loudly if it is missing —
   that blocks visual work.
3. Summarise `design-tokens.md` and `conventions.md` in a line each, noting any
   remaining `TODO — ask developer` markers.
4. Show the most recent entries from `learnings.md`.
5. Report the live gate status:
   - figma-to-code → are the Figma MCP tools actually present in this session?
   - lift-and-shift → is `referenceUrl` set, and does it still load?
6. List anything incomplete, and offer to fix it now.

Keep it to a compact summary — a table and a few lines, not a recitation of every file.
