#!/usr/bin/env node
/**
 * Frontend Kit — PreToolUse write guard
 *
 * PostToolUse cannot block, so the rules that were being *advised* and
 * under-followed are enforced here instead, before the file is written:
 *
 *   REUSE       don't reimplement a primitive the project already has
 *   RESPONSIVE  don't ship layout with no breakpoint handling
 *   A11Y        the deterministic accessibility defects (div-onClick, img
 *               without alt, inputs with no label anywhere)
 *   THEME       in a dark-mode project, don't write a colour with no dark pair
 *   DEPS        don't add a dependency that duplicates an installed one
 *
 * Every rule has an explicit escape hatch, because every rule has legitimate
 * exceptions. An enforced rule with no documented override becomes a rule
 * people disable wholesale.
 *
 * Fails OPEN on every error: a crashed guard must never block the developer.
 */

import { readFileSync, existsSync, readdirSync, statSync, appendFileSync } from 'node:fs'
import { join, basename, extname, relative } from 'node:path'

const allow = () => process.exit(0)

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

/** A blocked write is a mistake caught in the act — the best signal the kit gets. */
function logSignal(kitDir, entry) {
  try {
    appendFileSync(join(kitDir, '.signals.jsonl'),
      JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n')
  } catch { /* never let logging break the guard */ }
}

function priorCount(kitDir, rule) {
  try {
    return readFileSync(join(kitDir, '.signals.jsonl'), 'utf8')
      .split('\n').filter(l => l.includes(`"rule":"${rule}"`)).length
  } catch { return 0 }
}

// ---------------------------------------------------------------------------
let input = ''
try { input = readFileSync(0, 'utf8') } catch { allow() }

let payload
try { payload = JSON.parse(input) } catch { allow() }

const filePath = payload?.tool_input?.file_path ?? ''
const content = payload?.tool_input?.content ?? ''
const root = process.env.CLAUDE_PROJECT_DIR || payload?.cwd || process.cwd()

if (!filePath || !content) allow()

const KIT = join(root, '.claude', 'frontend-kit')
// Not onboarded → the kit has no authority to enforce anything yet
if (!existsSync(join(KIT, 'project-profile.json'))) allow()

const violations = []
const rel = relative(root, filePath) || filePath

// ===========================================================================
// DEPS — guard package.json writes
// ===========================================================================
const DUPLICATE_GROUPS = [
  { name: 'date handling', members: ['date-fns', 'dayjs', 'moment', 'luxon', 'js-joda'] },
  { name: 'HTTP client', members: ['axios', 'ky', 'got', 'superagent', 'redaxios'] },
  { name: 'global state', members: ['redux', '@reduxjs/toolkit', 'zustand', 'jotai', 'recoil', 'mobx', 'valtio'] },
  { name: 'form handling', members: ['react-hook-form', 'formik', 'final-form', 'react-final-form'] },
  { name: 'CSS-in-JS', members: ['styled-components', '@emotion/react', '@stitches/react', 'goober'] },
  { name: 'utility belt', members: ['lodash', 'lodash-es', 'ramda', 'underscore'] },
  { name: 'icon set', members: ['react-icons', 'lucide-react', '@heroicons/react', 'phosphor-react', '@phosphor-icons/react'] },
  { name: 'carousel', members: ['swiper', 'react-slick', 'embla-carousel-react', 'keen-slider'] },
  { name: 'animation', members: ['framer-motion', 'motion', 'react-spring', '@react-spring/web', 'gsap'] },
  { name: 'data fetching', members: ['@tanstack/react-query', 'swr', 'apollo-client', '@apollo/client'] },
  { name: 'schema validation', members: ['zod', 'yup', 'joi', 'valibot', 'superstruct'] },
  { name: 'test runner', members: ['jest', 'vitest', 'mocha'] },
]

if (/(^|\/)package\.json$/.test(filePath) && !/fk:deps-exempt/.test(content)) {
  let incoming = {}
  try {
    const pkg = JSON.parse(content)
    incoming = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }
  } catch { allow() } // unparseable — not our business

  let existing = {}
  try {
    const cur = JSON.parse(readFileSync(filePath, 'utf8'))
    existing = { ...(cur.dependencies ?? {}), ...(cur.devDependencies ?? {}) }
  } catch { existing = {} }

  const added = Object.keys(incoming).filter(d => !(d in existing))

  for (const dep of added) {
    const group = DUPLICATE_GROUPS.find(g => g.members.includes(dep))
    if (!group) continue
    const already = group.members.filter(m => m !== dep && m in existing)
    if (!already.length) continue
    violations.push(
      `• DEPS: adding \`${dep}\` duplicates the ${group.name} library this project already ` +
      `has (\`${already.join('`, `')}\`).\n` +
      `  Use the installed one. Two libraries for the same job means two APIs to learn, two ` +
      `sets of bugs, and permanent bundle weight — and bundle weight, unlike a bad component, ` +
      `never gets cleaned up later.`
    )
  }

  if (!violations.length) allow()
} else if (/(^|\/)package\.json$/.test(filePath)) {
  allow()
}

// ===========================================================================
// Everything below applies to UI source files only
// ===========================================================================
if (!violations.length) {
  if (!/\.(tsx|jsx|vue|svelte)$/.test(filePath)) allow()
  if (/\.(stories|test|spec)\.|__tests__|\.d\.ts$/.test(filePath)) allow()

  // -------------------------------------------------------------------------
  // REUSE
  // -------------------------------------------------------------------------
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
      else if (/^[A-Z][A-Za-z0-9]*\.(tsx|jsx)$/.test(e)) acc.set(basename(e, extname(e)), full)
    }
    return acc
  }

  const selfName = basename(filePath, extname(filePath))

  if (!/fk:reuse-exempt/.test(content)) {
    const existing = findComponents(root)
    for (const { component, tag } of PRIMITIVES) {
      if (!existing.has(component) || selfName === component) continue
      if (!new RegExp(`<${tag}\\b[^>]*\\b(className|class)=`, 's').test(content)) continue
      if (new RegExp(`import\\s+(\\{[^}]*\\b${component}\\b[^}]*\\}|${component})\\s+from`, 's').test(content)) continue
      violations.push(
        `• REUSE: this file renders a styled <${tag}> inline, but the project already has ` +
        `a \`${component}\` component at \`${relative(root, existing.get(component))}\`.\n` +
        `  Import and use it instead of reimplementing it. If \`${component}\` cannot express ` +
        `what you need, extend it with a prop or variant rather than cloning it.`
      )
    }
  }

  // -------------------------------------------------------------------------
  // RESPONSIVE
  // -------------------------------------------------------------------------
  const bpFile = join(KIT, 'breakpoints.md')
  let bpNames = ['sm', 'md', 'lg', 'xl', '2xl']

  if (existsSync(bpFile)) {
    try {
      const rows = readFileSync(bpFile, 'utf8').split('\n')
        .filter(l => l.trim().startsWith('|'))
        .map(l => l.split('|')[1]?.trim().replace(/`/g, ''))
        // must start alphanumeric — excludes the table's `---` separator row
        .filter(n => n && /^[a-z0-9][a-z0-9-]*$/i.test(n) && n.toLowerCase() !== 'name')
      if (rows.length) bpNames = [...new Set([...bpNames, ...rows])]
    } catch { /* keep defaults */ }
  }

  const stylingHits = (content.match(/className=|class=|<style/g) || []).length

  if (existsSync(bpFile) && !/fk:responsive-exempt/.test(content) && stylingHits >= 3) {
    const bpPrefix = new RegExp(`\\b(${bpNames.map(n => n.replace(/[^\w-]/g, '')).join('|')}):`)
    const responsive =
      bpPrefix.test(content) ||
      /@media|@container/.test(content) ||
      /clamp\s*\(/.test(content) ||
      /useMediaQuery|matchMedia/.test(content) ||
      /flex-wrap|auto-fit|auto-fill|minmax\s*\(/.test(content)

    if (!responsive) {
      violations.push(
        `• RESPONSIVE: this component carries layout but has no breakpoint handling, and ` +
        `\`.claude/frontend-kit/breakpoints.md\` defines: ${bpNames.join(', ')}.\n` +
        `  Every visual change must be correct at every breakpoint. Add the responsive ` +
        `classes/queries the design calls for — and if the design only shows one width, ` +
        `ASK the developer what the others do rather than inventing it.`
      )
    }
  }

  // -------------------------------------------------------------------------
  // A11Y — only checks that are deterministic enough to block on
  // -------------------------------------------------------------------------
  if (!/fk:a11y-exempt/.test(content)) {
    // 1. Click handler on a non-interactive element
    const clickDiv = content.match(/<(div|span|li|td)\b[^>]*\bonClick=/s)
    if (clickDiv && !/role=["'](button|link|menuitem|tab|option|switch|checkbox)["']/.test(content)) {
      violations.push(
        `• A11Y: \`<${clickDiv[1]}>\` has an onClick handler but no interactive role.\n` +
        `  Keyboard users cannot reach or activate it, and screen readers do not announce it ` +
        `as actionable. Use \`<button type="button">\` (or \`<a href>\` if it navigates). A ` +
        `<${clickDiv[1]}> needs role, tabIndex, and onKeyDown for Enter *and* Space to match ` +
        `what <button> gives you for free.`
      )
    }

    // 2. Image with no alt attribute at all (alt="" is valid and deliberate)
    const imgs = content.match(/<(img|Image)\b[^>]*>/gs) || []
    const noAlt = imgs.filter(t => !/\balt\s*=/.test(t))
    if (noAlt.length) {
      violations.push(
        `• A11Y: ${noAlt.length} image(s) with no \`alt\` attribute.\n` +
        `  Every image needs one: describe the information for informative images, or use ` +
        `\`alt=""\` to mark it decorative. Omitting the attribute entirely makes screen ` +
        `readers announce the filename.`
      )
    }

    // 3. Form controls with no labelling mechanism anywhere in the file
    const hasControl = /<(input|select|textarea)\b/.test(content)
    const hasLabelling = /<label\b|aria-label=|aria-labelledby=|htmlFor=|<FormLabel|<Label\b/.test(content)
    if (hasControl && !hasLabelling && !/type=["'](hidden|submit|button)["']/.test(content)) {
      violations.push(
        `• A11Y: this file renders a form control with no label, \`aria-label\` or ` +
        `\`aria-labelledby\` anywhere in it.\n` +
        `  A placeholder is not a label — it disappears on input and usually fails contrast. ` +
        `Associate a \`<label htmlFor>\` with the control's \`id\`, or pass an accessible name.`
      )
    }
  }

  // -------------------------------------------------------------------------
  // THEME — only in projects that demonstrably support dark mode
  // -------------------------------------------------------------------------
  if (!/fk:theme-exempt/.test(content)) {
    let darkModeProject = false
    try {
      for (const f of ['tailwind.config.ts', 'tailwind.config.js', 'tailwind.config.mjs']) {
        const p = join(root, f)
        if (existsSync(p) && /darkMode\s*:/.test(readFileSync(p, 'utf8'))) { darkModeProject = true; break }
      }
      if (!darkModeProject && existsSync(join(KIT, 'design-tokens.md'))) {
        const tok = readFileSync(join(KIT, 'design-tokens.md'), 'utf8')
        darkModeProject = /Dark mode:\s*supported/i.test(tok)
      }
    } catch { /* leave false */ }

    if (darkModeProject) {
      const colourClasses = content.match(/\b(bg|text|border|ring|fill|stroke)-[a-z]+-\d{2,3}\b/g) || []
      const hasDarkVariant = /\bdark:/.test(content) || /prefers-color-scheme/.test(content)
      if (colourClasses.length >= 2 && !hasDarkVariant) {
        violations.push(
          `• THEME: this project supports dark mode, but this file sets ${colourClasses.length} ` +
          `colour class(es) with no \`dark:\` variant.\n` +
          `  Every colour you touch needs both values, or the component breaks the moment ` +
          `someone toggles the theme — a defect nobody sees until a user reports it. Prefer ` +
          `semantic tokens that already carry both over hard-coded palette steps.`
        )
      }
    }
  }
}

// ---------------------------------------------------------------------------
if (!violations.length) allow()

let escalation = ''
const RULE_OF = v =>
  v.includes('• REUSE') ? 'REUSE' :
  v.includes('• RESPONSIVE') ? 'RESPONSIVE' :
  v.includes('• A11Y') ? 'A11Y' :
  v.includes('• THEME') ? 'THEME' : 'DEPS'

for (const v of violations) {
  const rule = RULE_OF(v)
  const prior = priorCount(KIT, rule)
  logSignal(KIT, { kind: 'guard-deny', rule, file: rel, session: payload?.session_id ?? null })

  if (prior + 1 >= 3) {
    escalation +=
      `\n\n⚠ PATTERN: the ${rule} rule has now been broken ${prior + 1} times in this project. ` +
      `That is a convention that is not written down anywhere the kit can see. After fixing ` +
      `this write, invoke the \`kit-self-improve\` skill and record it in ` +
      `\`.claude/frontend-kit/conventions.md\` so future sessions stop repeating it.`
  }
}

const HATCH = {
  REUSE: 'fk:reuse-exempt', RESPONSIVE: 'fk:responsive-exempt',
  A11Y: 'fk:a11y-exempt', THEME: 'fk:theme-exempt', DEPS: 'fk:deps-exempt',
}
const hatches = [...new Set(violations.map(v => HATCH[RULE_OF(v)]))]

deny(
  `Frontend Kit blocked this write — ${violations.length} rule violation(s) in ` +
  `\`${rel}\`:\n\n${violations.join('\n\n')}\n\n` +
  `Fix these and write the file again.\n\n` +
  `Genuine exceptions exist. If a rule truly does not apply here, add a comment to the ` +
  `file stating why — ${hatches.map(h => `\`// ${h} <reason>\``).join(' or ')} — and the ` +
  `write will proceed. Use these when they are correct, not to get past the check.` +
  escalation
)
