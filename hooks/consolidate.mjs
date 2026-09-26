#!/usr/bin/env node
/**
 * Frontend Kit — deterministic learning consolidation
 *
 * Earlier versions asked the model to write its own learnings. It didn't —
 * and when the Stop hook forced continuation, the model correctly identified
 * the directive as an automated repeating prompt and declined to act on it.
 *
 * So the hook writes the learning itself. Everything needed is already in the
 * ledger: which rule, which files, how many times, what the developer said.
 * No model cooperation required, no loop to fight. The model's remaining job
 * is to REFINE an entry that already exists — an optional improvement rather
 * than a required action.
 *
 * Prints a one-line summary on stdout for the Stop hook to relay.
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const kit = process.argv[2]
if (!kit) process.exit(1)

const ledgerPath = join(kit, '.signals.jsonl')
if (!existsSync(ledgerPath)) process.exit(1)

let rows = []
try {
  rows = readFileSync(ledgerPath, 'utf8').split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
} catch { process.exit(1) }

if (!rows.length) process.exit(1)

const denies = rows.filter(r => r.kind === 'guard-deny')
const corrections = rows.filter(r => r.kind === 'correction')

// Capture corrections immediately (an explicit statement from the developer),
// but wait for a second denial before calling it a pattern rather than a slip.
const byRule = new Map()
for (const d of denies) {
  if (!byRule.has(d.rule)) byRule.set(d.rule, [])
  byRule.get(d.rule).push(d.file)
}
const patterns = [...byRule.entries()].filter(([, files]) => files.length >= 2)

if (!corrections.length && !patterns.length) process.exit(1)

const today = new Date().toISOString().slice(0, 10)
const RULE_TEXT = {
  REUSE: {
    rule: 'Compose from the components that already exist in this project instead of reimplementing them inline.',
    why: 'Auto-recorded from repeated blocked writes. Duplicated primitives drift apart — they stop sharing fixes, tokens and accessibility behaviour.',
  },
  RESPONSIVE: {
    rule: 'Every layout-bearing component must handle every breakpoint in breakpoints.md.',
    why: 'Auto-recorded from repeated blocked writes. A desktop-only component is about a quarter of the work and gets caught in review, not before.',
  },
}

let out = `\n### ${today} — auto-captured by Frontend Kit\n`
out += `_Recorded from ${rows.length} session signal(s). Review and refine — the hook has the ` +
       `facts but not your reasoning._\n\n`

for (const [rule, files] of patterns) {
  const uniq = [...new Set(files)]
  const t = RULE_TEXT[rule] ?? { rule: `${rule} rule repeatedly broken.`, why: 'Auto-recorded.' }
  out += `**What happened:** the \`${rule}\` guard blocked ${files.length} write(s)` +
         ` (${uniq.slice(0, 5).join(', ')}${uniq.length > 5 ? ', …' : ''}).\n`
  out += `**Rule going forward:** ${t.rule}\n`
  out += `**Why:** ${t.why}\n\n`
}

for (const c of corrections) {
  const excerpt = String(c.excerpt ?? '').trim().slice(0, 240)
  if (!excerpt) continue
  out += `**What happened:** the developer corrected Claude — "${excerpt}"\n`
  out += `**Rule going forward:** TODO — restate this as an imperative rule.\n`
  out += `**Why:** TODO — record the reason, so a future session knows when it stops applying.\n\n`
}

const learnings = join(kit, 'learnings.md')
try {
  if (!existsSync(learnings)) {
    writeFileSync(learnings,
      '# Learnings\n\n> Frontend Kit memory. Corrections, gotchas and decisions captured during\n' +
      '> sessions. Loaded at session start. Commit this file.\n\n---\n')
  }
  appendFileSync(learnings, out)
} catch { process.exit(1) }

// Archive then clear, so the same signals are never re-learned.
try {
  appendFileSync(join(kit, '.signals-archive.jsonl'), rows.map(r => JSON.stringify(r)).join('\n') + '\n')
  writeFileSync(ledgerPath, '')
} catch { /* the learning is already written; a failed clear is not fatal */ }

const parts = []
if (patterns.length) parts.push(`${patterns.length} repeated rule violation pattern(s)`)
if (corrections.length) parts.push(`${corrections.length} developer correction(s)`)
process.stdout.write(parts.join(' and '))
