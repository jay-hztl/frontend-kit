---
name: kit-self-improve
description: Capture what was learned this session so future sessions start smarter. Use when the developer corrects you, when you discover a project convention the hard way, when a task needed a workflow the kit does not have, or at the end of a substantial piece of work. Updates CLAUDE.md, the kit memory files, and — with permission — creates new project-local skills or agents.
model: opus
effort: medium
---

# Self-improvement

A correction you do not record is a correction you will need again next week. This skill
turns session experience into persistent project knowledge.

## Step 0 — Read the signal ledger first

The kit records its own mistakes. **Always start here**, before relying on recall:

```bash
cat .claude/frontend-kit/.signals.jsonl 2>/dev/null
```

Two kinds of entry land in it automatically:

- `"kind":"guard-deny"` — a write the PreToolUse guard blocked, with the `rule` broken
  and the `file`. This is a mistake caught in the act: the strongest evidence you have.
- `"kind":"correction"` — a prompt where the developer was correcting you, with an excerpt.

**Read it for patterns, not events.** Three `REUSE` denials is *one* missing convention
("always compose from `src/components/primitives`"), not three separate notes. One
isolated denial is probably just a slip and may be worth nothing.

The guard escalates on its own: once a rule has been broken three times it tells you
directly to record a convention. When you see that, the project has an unwritten rule —
find it, name it, and write it down.

## When to run it

- **Signals are sitting in the ledger** (the Stop hook will tell you, and will insist
  once three or more accumulate)
- The developer corrects you about how this project does something
- You discover a convention by reading code that was not written down anywhere
- You had to ask a question that a future session will also have to ask
- A task needed a repeatable workflow the kit does not cover
- You hit a project-specific gotcha (a build quirk, a config trap, an ordering rule)
- The end of a substantial feature

## What to record — and what not to

**Record:**
- Conventions not derivable from a quick read ("form state always goes through
  `useAppForm`, never react-hook-form directly")
- Decisions and their reasons ("we use `px` in media queries deliberately — the design
  system is pixel-based")
- Constraints ("must support Safari 15; no container queries")
- Gotchas ("the design tokens are generated — edit `tokens/source.json`, never
  `tokens/generated.css`")
- Preferences about how the developer wants you to work
- Values the developer supplied that you would otherwise have to ask for again

**Do not record:**
- Anything obvious from a glance at the code or `package.json`
- Anything already in `CLAUDE.md`
- Facts that only mattered to one conversation
- Git history, which is already recorded

Test: *will a future session do better work because this is written down?* If not,
skip it.

## Where it goes

| Kind of knowledge | Destination |
|---|---|
| Project type, design source, connection state | `.claude/frontend-kit/project-profile.json` |
| Breakpoints, container widths, gutters | `.claude/frontend-kit/breakpoints.md` |
| Token locations, naming, new tokens added | `.claude/frontend-kit/design-tokens.md` |
| Code conventions, file layout, idioms | `.claude/frontend-kit/conventions.md` |
| Corrections, gotchas, decisions with reasons | `.claude/frontend-kit/learnings.md` |
| Broad rules every tool and teammate should see | the project's `CLAUDE.md` |
| A repeatable multi-step workflow | a new skill in `.claude/skills/` |
| A role needing its own context and tools | a new agent in `.claude/agents/` |

## Editing CLAUDE.md

You are permitted to update the project's `CLAUDE.md` — create it if absent.

Rules:
- **Append or amend the relevant section.** Never rewrite the file wholesale; the
  developer wrote it and other sessions depend on it.
- Keep it short and imperative. `CLAUDE.md` loads into every session's context — bloat
  is a real cost. Detail belongs in the kit memory files; `CLAUDE.md` points at them.
- Put frontend-kit content under one clearly marked section, so it is easy to review
  and easy to remove.
- **Show the diff and get approval before writing.** This file is shared with the team.

A good section looks like:

```markdown
## Frontend Kit

Project type: figma-to-code. Design source: <figma file url>.
Breakpoints, tokens and conventions: `.claude/frontend-kit/`.

- Never hard-code colour or spacing values — use tokens from `src/styles/tokens.css`.
- All new components are TypeScript with explicit prop interfaces.
- Verify every change at all four breakpoints before calling it done.
```

## Creating a new skill

When a workflow recurred and is worth automating, propose it first:

> I've now done the "add a CMS-backed section" flow three times this week, and it has
> six steps that are easy to get wrong. Want me to write it up as a project skill at
> `.claude/skills/cms-section/SKILL.md`?

On approval, write `.claude/skills/<name>/SKILL.md` with frontmatter:

```markdown
---
name: skill-name
description: What it does and exactly when to use it — this is what triggers it, so be concrete about the situations.
---
```

Keep it project-specific. Generic frontend practice belongs in this plugin, not in the
project's skill directory.

## Creating a new agent

Warranted only when the work needs its own clean context and a restricted tool set —
not for every workflow. Propose it, then write `.claude/agents/<name>.md`:

```markdown
---
name: agent-name
description: When to use this agent.
tools: Read, Grep, Glob, Edit
model: inherit
---
```

## The append format for `learnings.md`

```markdown
### <date> — <short title>
**What happened:** the correction or discovery, in one or two sentences.
**Rule going forward:** the imperative version.
**Why:** the reason, so a future session knows when it stops applying.
```

Dates as absolute values, never "last week".

## Housekeeping

Before adding, check whether an entry already covers it — amend rather than duplicate.
Delete entries that have become wrong; a stale rule is worse than no rule. If
`learnings.md` grows past roughly fifty entries, consolidate the durable ones into
`conventions.md` and prune.

## Close the loop — truncate the ledger

Once consolidated, empty it, or the same signals get re-learned every session and the
Stop hook keeps insisting:

```bash
: > .claude/frontend-kit/.signals.jsonl
```

Do this **only after** the learnings are actually written to disk. Truncating first and
failing to write loses the evidence permanently.

Keep `.signals.jsonl` out of version control — it is per-developer working state, not
shared knowledge. The *consolidated* files (`conventions.md`, `learnings.md`) are what
the team commits. Add it to `.gitignore` if it is not already there.

## Always tell the developer

Never write to memory silently. End with a short line: what you recorded, where, and
that it is committable so their team gets it too.
