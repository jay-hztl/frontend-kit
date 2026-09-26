---
name: project-onboarding
description: One-time setup that teaches Frontend Kit what this project is. Use at the first session in a repo, when .claude/frontend-kit/project-profile.json is missing, or when the developer says the project type changed. Asks whether this is Figma-to-Code or Lift-and-Shift, enforces the matching connection requirement, captures breakpoints and tokens, and writes the memory files that every future session reads automatically.
model: opus
effort: medium
---

# Project onboarding

This runs once per repository. It costs a few minutes and saves every future session
from re-asking the same questions.

## Rule

Do not start implementation work until onboarding completes. If the developer pushes
back — "just write the component" — explain in one sentence that without the design
source the output cannot be pixel-accurate, then run onboarding anyway. It is short.

## Step 1 — Survey before you ask

Read the repo first so your questions are informed and few:

```bash
ls -a && cat package.json 2>/dev/null | head -60
```

Check for: `tsconfig.json`, `tailwind.config.*`, `next.config.*`, `.storybook/`,
`vitest.config.*` / `jest.config.*`, `playwright.config.*`, `CLAUDE.md`, a monorepo
`packages/` or `apps/` layout, and any `styles/`, `theme/` or `tokens/` directory.

You now know the stack. Do not ask about anything you just found.

## Step 2 — The project type question

Ask with `AskUserQuestion`:

> **What type of project is this?**
>
> - **Figma to Code** — you have Figma designs and are implementing them as code.
> - **Lift and Shift** — you are rebuilding or migrating an existing live website.
> - **Greenfield / neither** — new UI with no Figma source and no reference site.
> - **Mixed** — some work comes from Figma, some from an existing site.

Everything after this branches on the answer.

---

## Branch A — Figma to Code

**The Figma connection is mandatory on this project.** Pixel-perfect implementation
from a description is not possible, and this kit will not pretend otherwise.

Hand off to the `figma-to-code` skill, which owns the connection walkthrough and
verification. Come back here once `figmaConnected` is true.

Then collect:
1. The Figma file URL (and the specific page/frame for the current work).
2. Whether the file uses **Figma Variables** for tokens — if yes, they are the source
   of truth for colour/spacing/type and you will read them with `get_variable_defs`.
3. Whether **Code Connect** is set up — if yes, designs map to real components and you
   must use the mapped component instead of building new ones.
4. Which breakpoint frames exist in the file (e.g. 1440 / 768 / 375). If the file only
   has desktop frames, say so plainly: responsive behaviour will have to be specified
   by the developer for every component, because you are forbidden from inventing it.

---

## Branch B — Lift and Shift

**A reachable reference URL is mandatory.** Ask:

1. The live or staging URL of the site being lifted.
2. Whether any of it is behind auth — if so, which pages you can reach without it (do
   not ask for credentials; ask them to give you reachable URLs or a staging bypass).
3. Which pages/sections are in scope, and which are explicitly out.
4. Is this a **faithful port** (match the current site exactly) or a **port + redesign**
   (use the current site for content and structure, but apply new styling)? This changes
   everything about how you treat the reference.
5. Target stack, if it differs from the source.

Then verify the URL actually loads using the browser tools before recording it. Hand
off to the `lift-and-shift` skill for the extraction workflow.

---

## Branch C — Greenfield

Ask what the visual source of truth is: an existing component library, a style guide,
a screenshot, or "your judgement". If the last one — get that in writing, because it is
the only mode where you are permitted to make design decisions, and you should still
present options rather than deciding silently.

---

## Branch D — Mixed

Record both sources. Ask them to state the rule for which is which (usually: new
features from Figma, existing pages from the live site). At the start of each task,
confirm which source applies before extracting anything.

---

## Step 3 — Breakpoints (all branches, mandatory)

Run the detection from the `responsive-breakpoints` skill. If breakpoints exist in the
code, show them and ask for confirmation. If they do not, **ask the developer to define
them** — offer the common presets as options. Write them to
`.claude/frontend-kit/breakpoints.md`.

No visual work happens until this file exists.

## Step 4 — Confirm the quality gates

One `AskUserQuestion` round, using what you found in Step 1 so the options are real:

1. **TypeScript** — detected or not? If `tsconfig.json` exists, confirm that all new
   code must be typed (default: yes, strictly).
2. **Storybook** — installed? Should stories be added/updated by default, asked each
   time, or skipped?
3. **Unit tests** — runner detected? Same three options.
4. **Browser verification** — should every UI change be verified in a browser before
   being reported done? (Default: yes.)

## Step 5 — Write memory

Create `.claude/frontend-kit/` and write:

**`project-profile.json`** — copy the template at
`${CLAUDE_PLUGIN_ROOT}/templates/project-profile.json` and fill it in. The field names
matter: the hooks read `projectType`, `figmaConnected` and `referenceUrl` literally.

**`breakpoints.md`**, **`design-tokens.md`**, **`conventions.md`** — from the templates
in the same directory. Fill in what you know; leave explicit `TODO — ask developer`
markers for what you do not, so future sessions know to ask rather than guess.

**`learnings.md`** — create it empty with a heading. The `kit-self-improve` skill
appends to it.

## Step 6 — Offer CLAUDE.md

Ask whether to add a short Frontend Kit section to the project's `CLAUDE.md` (create it
if absent) pointing at `.claude/frontend-kit/`. This helps teammates and other tools.
Keep it to a few lines — do not duplicate the memory files into it.

## Step 7 — Confirm

Summarise: project type, design source, connection status, breakpoints, stack, gates.
Tell them these files are committable and shareable with their team, and that
`/frontend-kit:status` shows this again, `/frontend-kit:start` re-runs onboarding.

Then proceed to whatever they originally asked for.
