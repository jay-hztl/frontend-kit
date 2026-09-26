---
description: Deep-analyse a requirement and produce a routed plan before any code
argument-hint: "<the requirement, a ticket, or a Figma/site URL>"
---

Analyse this requirement thoroughly before writing any code:

$ARGUMENTS

Run the `frontend-analyst` agent. It must:

1. Load `.claude/frontend-kit/` memory, `CLAUDE.md` and the relevant part of the codebase.
2. Classify the request and find the closest existing analogue in this repo.
3. Work the full interrogation checklist — source of truth, scope, states, content
   extremes, data, constraints, definition of done.
4. Ask the questions whose answers would change the code, batched, with concrete
   options and a recommendation. Ask nothing the codebase already answers.
5. Research anything version-specific on the web rather than relying on recall.
6. Output: Understanding · Open questions · Assumptions · Blast radius · Route ·
   Definition of done · Risks.

Do not begin implementation until the open questions are answered.
