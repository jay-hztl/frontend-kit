---
description: Run or re-run Frontend Kit onboarding for this project
argument-hint: "[optional: figma | lift-and-shift | greenfield]"
---

Run the `project-onboarding` skill for this repository.

If `.claude/frontend-kit/project-profile.json` already exists, show the current profile
first and ask whether to update it or start over — do not silently overwrite work
someone else on the team may have done.

If the developer passed an argument ($ARGUMENTS), treat it as their answer to the
project-type question and skip straight to that branch — but still confirm it back to
them in one line before proceeding.

Complete every step: project type, the matching mandatory connection (Figma MCP or
reference URL), breakpoints, quality gates, and the memory files.
