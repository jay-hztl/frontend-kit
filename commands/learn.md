---
description: Record what was learned this session into project memory
argument-hint: "[optional: the specific thing to remember]"
---

Run the `kit-self-improve` skill.

$ARGUMENTS

If the developer named something specific above, record that. Otherwise review this
session and identify what is worth persisting:

- Corrections the developer made
- Conventions discovered by reading code that were not written down
- Questions you had to ask that a future session will also have to ask
- Project-specific gotchas
- Values or decisions that should not have to be re-derived

Apply the test: *will a future session do better work because this is written down?*
Skip anything obvious from a glance at the codebase, already in `CLAUDE.md`, or relevant
only to this conversation.

Route each item to the right destination — profile, breakpoints, tokens, conventions,
learnings, `CLAUDE.md`, or a new project-local skill or agent.

Before writing to `CLAUDE.md` or creating a new skill or agent, show the proposed
content and get approval. Check for an existing entry that already covers it and amend
rather than duplicate.

Finish by telling the developer exactly what you recorded and where, and that the files
are committable so their team gets it too.
