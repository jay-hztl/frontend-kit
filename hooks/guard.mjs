#!/usr/bin/env node
/**
 * Frontend Kit — PreToolUse write guard
 *
 * PostToolUse cannot block, so the two rules that were being *advised* and
 * under-followed are enforced here instead, before the file is written:
 *
 *   A. Component reuse — don't reimplement a primitive the project already has.
 *   B. Responsive handling — don't ship a layout-bearing component with no
 *      breakpoint handling when the project has a breakpoint set.
 *
 * Both have an explicit escape hatch, because both have legitimate exceptions.
 * An enforced rule with no documented override becomes a rule people disable.
 *
 * Fails OPEN on every error: a crashed guard must never block the developer.
 */

import { readFileSync, existsSync, readdirSync, statSync, appendFileSync } from 'node:fs'
import { join, basename, extname, relative } from 'node:path'

const allow = () => process.exit(0)

/**
 * Append a signal to the learning ledger. A blocked write is a mistake caught
 * in the act — the highest-value learning signal the kit gets. Discarding it
 * means the same mistake recurs next session.
 */
function logSignal(kitDir, entry) {
  try {
    appendFileSync(join(kitDir, '.signals.jsonl'),
      JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n')
  } catch { /* never let logging break the guard */ }
}

/** How many times this rule has already been broken in this project. */
function priorCount(kitDir, rule) {
  try {
    return readFileSync(join(kitDir, '.signals.jsonl'), 'utf8')
      .split('\n').filter(l => l.includes(`"rule":"${rule}"`)).length
  } catch { return 0 }
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }))
  process.exit(0)
}

// ---------------------------------------------------------------------------
let input = ''
try {
  input = readFileSync(0, 'utf8')
} catch { allow() }

let payload
try { payload = JSON.parse(input) } catch { allow() }

const filePath = payload?.tool_input?.file_path ?? ''
const content = payload?.tool_input?.content ?? ''
const root = process.env.CLAUDE_PROJECT_DIR || payload?.cwd || process.cwd()

if (!filePath || !content) allow()

// Only UI source files
if (!/\.(tsx|jsx|vue|svelte)$/.test(filePath)) allow()
// Never guard the artefacts of the workflow itself
if (/\.(stories|test|spec)\.|__tests__|\.d\.ts$/.test(filePath)) allow()

const KIT = join(root, '.claude', 'frontend-kit')
// Not onboarded → the kit has no authority to enforce anything yet
if (!existsSync(join(KIT, 'project-profile.json'))) allow()

const violations = []

// ---------------------------------------------------------------------------
// A. Component reuse
// ---------------------------------------------------------------------------
const PRIMITIVES = [
  { component: 'Button', tag: 'button' },
  { component: 'Input', tag: 'input' },
  { component: 'Select', tag: 'select' },
  { component: 'Textarea', tag: 'textarea' },
  { component: 'TextArea', tag: 'textarea' },
]

function findComponents(dir, depth = 0, acc = new Map()) {
  if (depth > 5 || acc.size > 400) return acc
  let entries
  try { entries = readdirSync(dir) } catch { return acc }
  for (const e of entries) {
    if (e === 'node_modules' || e.startsWith('.') || e === 'dist' || e === 'build') continue
    const full = join(dir, e)
    let st
    try { st = statSync(full) } catch { continue }
    if (st.isDirectory()) findComponents(full, depth + 1, acc)
    else if (/^[A-Z][A-Za-z0-9]*\.(tsx|jsx)$/.test(e)) {
      acc.set(basename(e, extname(e)), full)
    }
  }
  return acc
}

if (!/fk:reuse-exempt/.test(content)) {
  const existing = findComponents(root)
  const selfName = basename(filePath, extname(filePath))

  for (const { component, tag } of PRIMITIVES) {
    if (!existing.has(component)) continue
    if (selfName === component) continue // the primitive's own definition

    // An inline primitive carrying styling — i.e. a reimplementation, not a
    // bare <input> inside a labelled field wrapper.
    const inlineStyled = new RegExp(`<${tag}\\b[^>]*\\b(className|class)=`, 's')
    if (!inlineStyled.test(content)) continue

    const imported = new RegExp(
      `import\\s+(\\{[^}]*\\b${component}\\b[^}]*\\}|${component})\\s+from`, 's'
    )
    if (imported.test(content)) continue

    violations.push(
      `• REUSE: this file renders a styled <${tag}> inline, but the project already has ` +
      `a \`${component}\` component at \`${relative(root, existing.get(component))}\`.\n` +
      `  Import and use it instead of reimplementing it. If \`${component}\` cannot express ` +
      `what you need, extend it with a prop or variant rather than cloning it.`
    )
  }
}

// ---------------------------------------------------------------------------
// B. Responsive handling
// ---------------------------------------------------------------------------
const bpFile = join(KIT, 'breakpoints.md')

if (existsSync(bpFile) && !/fk:responsive-exempt/.test(content)) {
  // Only judge files that actually carry layout
  const stylingHits = (content.match(/className=|class=|<style/g) || []).length

  if (stylingHits >= 3) {
    let names = ['sm', 'md', 'lg', 'xl', '2xl']
    try {
      // Pull breakpoint names from the first column of the memory file's table
      const rows = readFileSync(bpFile, 'utf8').split('\n')
        .filter(l => l.trim().startsWith('|'))
        .map(l => l.split('|')[1]?.trim().replace(/`/g, ''))
        // must start alphanumeric — excludes the table's `---` separator row
        .filter(n => n && /^[a-z0-9][a-z0-9-]*$/i.test(n) && n.toLowerCase() !== 'name')
      if (rows.length) names = [...new Set([...names, ...rows])]
    } catch { /* keep defaults */ }

    const bpPrefix = new RegExp(`\\b(${names.map(n => n.replace(/[^\w-]/g, '')).join('|')}):`)
    const responsive =
      bpPrefix.test(content) ||          // tailwind md:flex etc.
      /@media|@container/.test(content) ||
      /clamp\s*\(/.test(content) ||
      /useMediaQuery|matchMedia/.test(content) ||
      /flex-wrap|auto-fit|auto-fill|minmax\s*\(/.test(content) // intrinsically responsive

    if (!responsive) {
      violations.push(
        `• RESPONSIVE: this component carries layout but has no breakpoint handling, and ` +
        `\`.claude/frontend-kit/breakpoints.md\` defines: ${names.join(', ')}.\n` +
        `  Every visual change must be correct at every breakpoint. Add the responsive ` +
        `classes/queries the design calls for — and if the design only shows one width, ` +
        `ASK the developer what the others do rather than inventing it.`
      )
    }
  }
}

// ---------------------------------------------------------------------------
if (!violations.length) allow()

// --- record the mistake, and escalate if it is a repeat -------------------
const rel = relative(root, filePath) || filePath
let escalation = ''

for (const v of violations) {
  const rule = v.includes('• REUSE') ? 'REUSE' : 'RESPONSIVE'
  const prior = priorCount(KIT, rule)
  logSignal(KIT, { kind: 'guard-deny', rule, file: rel, session: payload?.session_id ?? null })

  // 3rd+ time means this is not a one-off slip — it is a project fact nobody wrote down
  if (prior + 1 >= 3) {
    escalation +=
      `\n\n⚠ PATTERN: the ${rule} rule has now been broken ${prior + 1} times in this project. ` +
      `That is a convention that is not written down anywhere the kit can see. After fixing ` +
      `this write, invoke the \`kit-self-improve\` skill and record it in ` +
      `\`.claude/frontend-kit/conventions.md\` so future sessions stop repeating it.`
  }
}

deny(
  `Frontend Kit blocked this write — ${violations.length} rule violation(s) in ` +
  `\`${rel}\`:\n\n${violations.join('\n\n')}\n\n` +
  `Fix these and write the file again.\n\n` +
  `Genuine exceptions exist. If a rule truly does not apply here, add a comment to the ` +
  `file stating why — \`// fk:reuse-exempt <reason>\` or \`// fk:responsive-exempt <reason>\` ` +
  `— and the write will proceed. Use these when they are correct, not to get past the check.` +
  escalation
)
