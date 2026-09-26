---
name: requirement-analysis
description: Turn a vague frontend request into an unambiguous, routed plan before any code is written. Use as the first step for every non-trivial UI request — new features, components, redesigns, bug reports, "make it like X". Produces the questions that must be answered, the blast radius, the execution route, and the definition of done.
model: opus
effort: high
---

# Requirement analysis

Most frontend rework is not caused by bad code. It is caused by building the right
component to the wrong requirement. This skill exists to make that impossible.

For anything substantial, run the `frontend-analyst` agent, which implements this
process with a clean context. Use this skill directly for smaller requests where
spawning an agent is overkill.

## The two rules

1. **Never guess at something that changes the code.** Ask.
2. **Never ask something the codebase can tell you.** Read.

Violating rule 1 causes rework. Violating rule 2 makes you exhausting to work with.
Both matter.

## Read first

- `.claude/frontend-kit/` — profile, breakpoints, tokens, conventions, learnings
- `CLAUDE.md`
- `package.json` — what is already installed decides what you should reach for
- The closest existing component to what is being asked for

Only now do you know what you actually need to ask.

## The interrogation checklist

Run the request against this. Every unanswerable line is a candidate question.

### Source of truth
- Where does the visual truth live — Figma node, live URL, screenshot, description?
- Does a source exist for *every* breakpoint, or only one?
- Is there an existing component that already does 80% of this?

### Scope and boundaries
- Exactly which files/routes/components are in scope?
- Is anything being replaced? What happens to the old thing?
- Who consumes the thing being changed? (Grep. Report the blast radius.)
- What is explicitly *not* in scope?

### States — the most-skipped section
default · hover · focus-visible · active · disabled · loading · empty · error ·
success · selected · read-only · skeleton

Which are in scope? For anything asynchronous, all of loading/empty/error are in scope
whether or not the design shows them — and if the design does not show them, that is a
question, not a licence to invent.

### Content resilience
- Longest realistic string? Shortest?
- Zero items, one item, a hundred items?
- Missing image, missing avatar, null field?
- Localisation / RTL in scope?
- User-generated content that could break layout or need sanitising?

### Data and behaviour
- Static or dynamic? Props, API, CMS, URL params?
- Exact data shape — ask for the type or the response sample.
- Can this be a server component, or does it need client interactivity?
- Optimistic UI? Error recovery? Retry?
- Does anything need to persist across navigation?

### Non-functional
- Browser/device floor.
- Above the fold? In a large list? Bundle-size sensitive?
- Accessibility level expected (WCAG 2.2 AA is the sane default).
- Analytics/tracking hooks needed?

### Definition of done
- Storybook story? Unit tests? Visual regression? Browser-verified?
- Who reviews it, and against what?

## Asking well

`AskUserQuestion`, batched, max four per round.

- Every question must have a different answer leading to different code. If both
  answers produce the same component, do not ask it.
- Give 2–4 concrete options. Put your recommendation first, labelled `(Recommended)`.
- Say what each option costs in its description.
- Prefer "pick one" over "describe what you want".

**Good:** "The design shows desktop only. At mobile, should the three cards stack
vertically (recommended — matches your existing `FeatureGrid`), scroll horizontally, or
collapse into an accordion?"

**Bad:** "How should this be responsive?"

## When not to ask

Ship it and state the assumption in one line when:
- Both readings produce the same code.
- The codebase has an unambiguous existing convention — follow it and say so.
- It is trivially reversible and the developer is clearly in a hurry.

Do all the work that does not depend on the open question first. Only block when
proceeding under any assumption would be unsafe or would waste the work if wrong.

## Research

Use `WebSearch`/`WebFetch` when the task involves an API, library or platform behaviour
you are not current on. Check the installed version first and read the docs for *that
version*. State what you looked up and where — never present searched information as
recalled fact.

## Output

Understanding · Open questions · Assumptions · Blast radius · Route (which skills and
agents, in order) · Definition of done · Risks.

Then execute the route.
