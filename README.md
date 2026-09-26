# Frontend Kit

**A Claude Code plugin for frontend developers who ship pixel-perfect work.**

Frontend Kit makes Claude behave like a senior frontend engineer on *your* project
rather than a generic code generator. It learns what kind of project you are on, refuses
to guess at values it should be asking about, and drives every change through the same
chain a careful engineer would: analyse → implement → type → test → verify.

---

## Why this exists

Most AI-generated frontend code fails in the same three ways:

1. **It guesses.** A spacing value that "looks about right", a hover state nobody
   designed, a mobile layout invented on the spot. You find out at design review.
2. **It builds the happy path.** Desktop only. No loading state, no empty state, no
   long-string case, no keyboard path.
3. **It forgets context.** Every session starts from zero — the same questions, the same
   corrections, the same conventions re-explained.

Frontend Kit is built around fixing exactly those three things.

| Problem | What the kit does |
|---|---|
| Guessing | Hard rule: every value comes from the design source, an existing token, or you. It asks instead of inventing — and on Figma projects that rule is absolute. |
| Happy path only | Every change is checked at every breakpoint, in every state, with content extremes, in a real browser. |
| No memory | Onboarding writes `.claude/frontend-kit/` into your repo. Every future session loads it automatically. Commit it and your whole team shares it. |

---

## Installation

```bash
claude plugin marketplace add jay-hztl/frontend-kit
```

```bash
claude plugin install frontend-kit@frontend-kit-marketplace
```

Or from a local clone:

```bash
claude plugin marketplace add /path/to/Frontend-kit
```

Restart the session after installing so the hooks register.

### Requirements

- Claude Code (CLI, desktop, web or an IDE extension)
- Node-based frontend project (any framework — React, Next.js, Vue, Svelte, Angular, Astro)
- **Figma-to-Code projects:** the Figma MCP connector (the kit walks you through it)
- **Lift-and-Shift projects:** a reachable live or staging URL

---

## First run: the onboarding gate

The first time you start a session in a repo, the kit asks one question:

> **What type of project is this?**
>
> 1. **Figma to Code** — you're implementing designs from Figma
> 2. **Lift and Shift** — you're rebuilding or migrating an existing live website
> 3. **Greenfield** — new UI, no Figma source, no reference site
> 4. **Mixed** — some of each

Your answer sets up everything downstream, and it is asked **once per project**.

### If you choose Figma to Code

The Figma connection becomes **mandatory**. Claude will not write UI code until it is
connected, because pixel-perfect output from a text description is not a thing that
exists. It will:

1. Check whether the Figma MCP tools are already available
2. Walk you through connecting them if not (three routes — local Dev Mode server,
   remote connector, or the Claude app's connector directory)
3. **Verify the connection by actually calling a Figma tool against your file** — it
   does not take "yes I connected it" as proof
4. Ask which breakpoint frames exist, whether you use Figma Variables, and whether Code
   Connect is set up
5. Record `"figmaConnected": true` and stop gating

Until that flag is set, a hook injects a blocking directive on every prompt. You can
still ask questions, plan, read code and do the setup — only shipping UI code is gated.

Need to override for one prompt? Include `frontend-kit: skip` in your message.

### If you choose Lift and Shift

A reachable **reference URL is mandatory** and gets verified before it is recorded. The
kit also asks the question that decides everything else:

- **Faithful port** — the live site is the spec, bugs included
- **Port + cleanup** — match the design but fix a11y and responsive defects
- **Port + redesign** — keep content and IA, restyle from another source

Then it extracts real computed styles at every breakpoint rather than eyeballing
screenshots, and builds you a **301 redirect map** — the deliverable most migrations
forget until rankings drop.

### Every project type

Before any layout work, the kit establishes your **breakpoints** — found in your config,
inferred from the media queries you actually use, or asked for if they do not exist
anywhere. This is non-negotiable: building responsive layouts against unknown
breakpoints means rebuilding them later.

---

## How it works day to day

```
You: "Add a pricing card to the marketing page"
                    │
                    ▼
      ┌─────────────────────────────┐
      │ SessionStart hook            │  loads project profile, breakpoints,
      │                              │  tokens, conventions, learnings
      └─────────────────────────────┘
                    │
      ┌─────────────────────────────┐
      │ UserPromptSubmit hook        │  enforces the setup gate
      └─────────────────────────────┘
                    │
                    ▼
      ┌─────────────────────────────┐
      │ frontend-analyst             │  reads the codebase, finds the closest
      │ (the entry point)            │  existing component, asks the questions
      └─────────────────────────────┘  that change the code, routes the work
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   pixel-perfect  component  (skills: tokens, a11y,
     designer     architect   SEO, TS, perf…)
        └───────────┼───────────┘
                    ▼
      ┌─────────────────────────────┐
      │ PostToolUse hook             │  reminds: TS, breakpoints, tokens,
      └─────────────────────────────┘  a11y, Storybook, tests, verification
                    │
                    ▼
      ┌─────────────────────────────┐
      │ frontend-verifier            │  renders it, resizes to every breakpoint,
      │                              │  tabs through it, reads the console
      └─────────────────────────────┘
```

You do not invoke any of this manually. Say what you want; the kit routes it.

---

## Commands

| Command | What it does |
|---|---|
| `/frontend-kit:start` | Run or re-run onboarding |
| `/frontend-kit:analyze <requirement>` | Deep requirement analysis → routed plan, before any code |
| `/frontend-kit:design <figma url \| description>` | Pixel-perfect implementation across all breakpoints |
| `/frontend-kit:component <name + behaviour>` | Full component workflow |
| `/frontend-kit:verify [route]` | Browser verification sweep |
| `/frontend-kit:audit [target] [a11y\|perf\|seo\|tokens]` | Audit and report findings by severity |
| `/frontend-kit:breakpoints` | Detect, confirm or update the breakpoint set |
| `/frontend-kit:status` | Show everything the kit knows about this project |
| `/frontend-kit:learn` | Persist this session's learnings to project memory |

---

## Agents

| Agent | Model | Effort | Role |
|---|---|---|---|
| **frontend-analyst** | `opus` | high | The entry point. Analyses the requirement, reads the codebase, asks only what it cannot find out itself, researches unfamiliar APIs on the web, and produces a routed plan with a blast radius and a definition of done. |
| **pixel-perfect-designer** | `opus` | high | Implements designs to exact accuracy. Extracts from Figma variables or computed styles, maps to your tokens, implements every breakpoint, verifies against the source. |
| **component-architect** | `opus` | medium | Identifies your application type, learns your local idiom from neighbouring components, designs the API before writing the body, builds the full state matrix. |
| **frontend-verifier** | `sonnet` | medium | Drives the real browser. Every breakpoint plus boundary widths, interaction states, console, network, accessibility tree, layout stability. |

---

## Skills

Skills load automatically when relevant. You can also name one directly.

**Setup & routing**
| Skill | Triggers on |
|---|---|
| `project-onboarding` | First session, or project type changed |
| `requirement-analysis` | Any non-trivial request, before code |
| `figma-to-code` | Figma URLs, figma-to-code projects, connection gate |
| `lift-and-shift` | Live-site references, migrations |

**Design & implementation**
| Skill | Triggers on |
|---|---|
| `pixel-perfect-design` | Any styling work; "looks off", misalignment, spacing |
| `responsive-breakpoints` | Before layout work; mobile/tablet bugs |
| `design-tokens` | Any colour, spacing, font, radius or shadow value |
| `component-workflow` | Creating or substantially changing a component |
| `form-handling` | Any form, input, search, filter, login or checkout |
| `async-ui-states` | Anything that fetches or mutates — loading/empty/error |
| `i18n-rtl` | Multi-locale projects; RTL mirroring, Intl formatting |
| `visual-regression` | Proving a change is visually neutral; lift-and-shift ports |

**Quality gates**
| Skill | Triggers on |
|---|---|
| `typescript-standards` | Any project with a `tsconfig.json` — non-optional |
| `seo-nextjs` | Next.js content-bearing changes, new routes, migrations |
| `accessibility-audit` | Interactive components, forms, navigation, audits |
| `performance-budget` | Above-the-fold UI, images, fonts, large lists, new deps |
| `storybook-sync` | Component changed and Storybook is installed |
| `unit-testing` | Behaviour changed and a test runner is installed |
| `browser-verification` | After every UI change, before reporting done |

**Meta**
| Skill | Triggers on |
|---|---|
| `kit-self-improve` | Corrections, discovered conventions, end of a feature |

---

## Model and effort assignment

Every agent and skill declares a `model` and an `effort` level, so the right amount of
thinking gets spent on each kind of work instead of one setting covering everything.

### The rule that shapes it

A **skill's** `model` override applies *for the rest of the turn*, not just while the
skill runs — and most of these skills trigger automatically. So skills here **only ever
pin upward or inherit, never downward.** A skill that quietly dropped the session to a
weaker model mid-task would damage whatever else was in flight. Cheap skills get a lower
`effort` instead, which tunes cost without touching the model.

**Agents** are different — they run in their own context, so pinning a smaller model
there is safe and is used deliberately.

### Pinned up to `opus` — correctness here gates everything downstream

| Skill | Effort | Why |
|---|---|---|
| `requirement-analysis` | high | This *is* the thinking step. A misread requirement wastes all the work after it. |
| `figma-to-code` | high | Extraction + translation under a never-guess rule; many constraints held at once. |
| `lift-and-shift` | high | Computed-style extraction, SEO parity, the redirect map — detail-dense and expensive to get wrong. |
| `project-onboarding` | medium | One-time, and everything else reads what it writes. |
| `kit-self-improve` | medium | Judging what's durable enough to persist is genuine judgment. |

### `inherit` + tuned effort — respects your `/model` choice

| Skill | Effort |
|---|---|
| `pixel-perfect-design`, `component-workflow`, `accessibility-audit`, `performance-budget`, `form-handling` | high |
| `responsive-breakpoints`, `design-tokens`, `seo-nextjs`, `typescript-standards`, `unit-testing`, `browser-verification`, `async-ui-states`, `i18n-rtl`, `visual-regression` | medium |
| `storybook-sync` | low |

`storybook-sync` is low because it is genuinely mechanical: read the existing story
format, write a matching one. `accessibility-audit` and `performance-budget` are high
because both are diagnosis — deciding *which* of many possible causes is the real one.

### Why `frontend-verifier` runs on `sonnet`

It is the one agent pinned below opus, on purpose. Verification is procedural and
tool-heavy — a dozen viewport resizes, console reads and accessibility-tree dumps per
sweep. Sonnet does that accurately and much faster, and the judgment it needs ("is this
clipped?") is observational rather than inferential. The expensive thinking already
happened upstream in the analyst.

### Graceful degradation

If your plan or your organization's `availableModels` allowlist excludes a pinned model,
Claude Code skips the override and keeps the session model. Nothing errors. The same
applies in auto mode for models it does not support.

### Changing it

Edit the `model` and `effort` fields in `agents/*.md` and `skills/*/SKILL.md`. Valid
models: `opus`, `sonnet`, `haiku`, `fable`, a full model ID, or `inherit`. Valid effort:
`low`, `medium`, `high`, `xhigh`, `max`.

To run the whole kit on your session model, set every `model:` to `inherit` — the effort
levels alone still give you most of the benefit.

Slash commands deliberately carry no `model`: each one delegates to an agent that
already declares its own, and pinning at the command layer would override the agent's.

---

## How it learns

The kit gets better at *your* project as you use it, without you maintaining anything.

**It records its own mistakes.** Every write the guard blocks is appended to
`.claude/frontend-kit/.signals.jsonl` with the rule broken and the file. A blocked write
is a mistake caught in the act — the strongest signal available.

**It notices when you correct it.** A prompt like "no, we always use tokens from
`theme.css`" is detected as a correction and logged with what you said.

**It writes the learning itself.** At the end of a turn, a `Stop` hook consolidates the
ledger into `learnings.md` — grouping repeated violations into one rule with its reason,
and capturing your corrections verbatim. Then it archives and clears the ledger so
nothing is learned twice.

That last part is deliberate and was arrived at the hard way. Earlier versions asked
Claude to write its own learnings, then escalated to forcing it. Live testing showed the
model recognising the forced directive as *"the same automated hook repeating"* and
declining to act — reasonably. **Asking the model to record its lessons does not work.**
So the hook does it: the ledger already holds the rule, the files, the counts and your
words. Capture is guaranteed; Claude's role is reduced to *refining* an entry that
already exists.

Noise control: a single blocked write is treated as a slip and recorded as nothing. Two
or more of the same rule is a pattern — that becomes a written convention. Corrections
are always captured, since you said them on purpose.

`.signals.jsonl` is per-developer working state — gitignore it. `learnings.md` and
`conventions.md` are the shared output, and belong in version control.

## Project memory

Onboarding creates this in **your** repo:

```
.claude/frontend-kit/
├── project-profile.json    # type, design source, stack, gates, connection state
├── breakpoints.md          # the set, container widths, gutters, verification widths
├── design-tokens.md        # where tokens live, the scales, what's been added
├── conventions.md          # file layout, naming, code style, framework specifics
└── learnings.md            # corrections and gotchas, dated
```

**Commit these files.** They are how your teammates get the same behaviour — and how
every future session skips the questions you already answered.

The `kit-self-improve` skill keeps them current: when you correct Claude, it records the
correction and the reason. It can also update your `CLAUDE.md` and create project-local
skills and agents — always showing you the diff and asking first.

---

## The rules the kit enforces

These are the non-negotiables written into every agent and skill:

**Never invent a value.** Colours, spacing, type sizes, radii, shadows, animation
durations and responsive behaviours come from the design source, from an existing token,
or from you. On a Figma project there are no exceptions — if the design shows one
breakpoint, Claude asks what the others do rather than extrapolating.

**Never ask what the codebase can answer.** It reads `package.json`, `tsconfig.json`,
your Tailwind config and your neighbouring components before asking anything. Questions
are batched, capped at four per round, and come with concrete options and a
recommendation.

**Every breakpoint, every time.** Plus 1px either side of each boundary, plus 320px and
a wide viewport. "Works on desktop" is 25% of the job.

**Every state.** Default, hover, focus-visible, active, disabled, loading, empty, error.
Plus content extremes: longest realistic string, zero items, missing image.

**Semantic HTML before ARIA.** A `<div onClick>` where a `<button>` belongs is treated as
a defect, not a style preference.

**Tokens, not literals.** A hard-coded hex that renders identically to the token is
still a defect — it breaks theming, dark mode and the next rebrand.

**Two rules are enforced by a hook, not just advised.** A `PreToolUse` guard inspects
every UI file *before* it is written and blocks the write on any of five
rules: reimplementing a component the project already has (REUSE), layout with no
breakpoint handling (RESPONSIVE), the deterministic accessibility defects — a click
handler on a `<div>`, an `<img>` with no `alt`, a form control with no label (A11Y),
a colour with no `dark:` pair in a dark-mode project (THEME), and adding a dependency
that duplicates an installed one (DEPS). Skills
are guidance the model can under-weight; this one is not negotiable.

Both have a documented escape hatch, because both have real exceptions — put
`// fk:reuse-exempt`, `// fk:responsive-exempt`, `// fk:a11y-exempt`,
`// fk:theme-exempt` or `// fk:deps-exempt` — each with a reason — in the file, and the
write proceeds. An enforced rule with no override is a rule people disable.

The guard fails **open**: if Node is missing or it errors, the write goes through. You
should never be blocked because a checker could not start.

**Verify by looking.** No UI change is reported as done on the strength of the code
alone. If the dev server would not start, the kit says so rather than reasoning about
what the code probably does.

---

## Configuration

Everything lives in `.claude/frontend-kit/project-profile.json`. The fields the hooks
read literally — do not rename them:

| Field | Effect |
|---|---|
| `projectType` | `figma-to-code` \| `lift-and-shift` \| `greenfield` \| `mixed` — drives the gate |
| `figmaConnected` | `true` releases the Figma gate |
| `referenceUrl` | An `http…` value releases the lift-and-shift gate |
| `qualityGates.storybook` | `always` \| `ask` \| `never` \| `not-installed` |
| `qualityGates.unitTests` | same |
| `qualityGates.browserVerification` | `always` \| `ask` \| `never` |

### Turning off the gate

Per prompt, include `frontend-kit: skip`. Permanently, set `projectType` to
`greenfield`. The kit will tell you once that pixel accuracy is not guaranteed without
a design source, then get out of your way.

---

## Plugin structure

```
frontend-kit/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── hooks/
│   ├── hooks.json
│   ├── session-start.sh          # loads memory / forces onboarding
│   ├── user-prompt-submit.sh     # setup gate
│   ├── pre-write-guard.sh        # blocks writes that break reuse/responsive
│   ├── guard.mjs                 # the guard's logic
│   └── post-edit-reminder.sh     # definition-of-done reminder
├── agents/                       # 4 agents
├── skills/                       # 16 skills
├── commands/                     # 9 slash commands
└── templates/                    # memory file templates
```

Three hooks are plain Bash needing only `grep` and `sed`. The write guard uses Node,
which every frontend project already has, and fails open if it is absent.

---

## FAQ

**Does it work with frameworks other than React/Next?**
Yes. The analysis, design, breakpoint, token, a11y, performance and verification skills
are framework-agnostic. `seo-nextjs` is the only Next-specific one, and it stays quiet
elsewhere.

**Does it really block me without Figma?**
It blocks *writing UI code* on projects you told it are Figma-to-Code. Questions,
planning, reading code, refactors and the setup itself all proceed normally. Use
`frontend-kit: skip` to override a single prompt.

**Will it spam questions?**
No. It reads your codebase first and is explicitly instructed never to ask what it can
find out. Questions are batched and capped at four, each with options and a
recommendation. If an answer would not change the code, it makes the call and states
the assumption in one line.

**Can I customise it?**
Yes. Edit `.claude/frontend-kit/conventions.md` to encode your rules — agents read it
every session. Or run `/frontend-kit:learn` and let Claude write new project-local
skills and agents for workflows specific to your team.

**Does it modify my CLAUDE.md?**
Only with your approval, only by appending to a clearly marked section, and it shows you
the diff first.

---

## License

MIT
