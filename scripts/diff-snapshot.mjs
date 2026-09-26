#!/usr/bin/env node
/**
 * Frontend Kit — style snapshot differ
 *
 * Exact, deterministic comparison of two style snapshots captured by the
 * `visual-regression` skill. Pixel diffing needs an image library this plugin
 * deliberately does not ship; comparing computed styles needs nothing, is
 * exact, and tells you WHICH property changed rather than that "something" did.
 *
 *   node diff-snapshot.mjs <baseline.json> <current.json> [--ignore prop,prop]
 *
 * Exit 0 = identical, 1 = differences found, 2 = could not run.
 */

import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const files = args.filter(a => !a.startsWith('--'))
const ignoreArg = args.indexOf('--ignore')
const IGNORE = new Set(ignoreArg !== -1 ? (args[ignoreArg + 1] ?? '').split(',').filter(Boolean) : [])

if (files.length < 2) {
  console.error('usage: diff-snapshot.mjs <baseline.json> <current.json> [--ignore prop,prop]')
  process.exit(2)
}

const load = f => {
  try { return JSON.parse(readFileSync(f, 'utf8')) }
  catch (e) { console.error(`cannot read ${f}: ${e.message}`); process.exit(2) }
}

const base = load(files[0])
const cur = load(files[1])

const changed = []
const added = []
const removed = []

for (const key of Object.keys(base)) {
  if (!(key in cur)) { removed.push(key); continue }
  for (const [prop, was] of Object.entries(base[key])) {
    if (IGNORE.has(prop)) continue
    const now = cur[key][prop]
    if (now !== was) changed.push({ key, prop, was, now })
  }
}
for (const key of Object.keys(cur)) if (!(key in base)) added.push(key)

if (!changed.length && !added.length && !removed.length) {
  console.log(`✔ identical — ${Object.keys(base).length} elements, no property changed`)
  process.exit(0)
}

if (changed.length) {
  console.log(`\n▸ ${changed.length} property change(s)`)
  // group by element so the report reads as "this thing moved", not a flat list
  const byKey = new Map()
  for (const c of changed) {
    if (!byKey.has(c.key)) byKey.set(c.key, [])
    byKey.get(c.key).push(c)
  }
  for (const [key, list] of byKey) {
    console.log(`\n  ${key}`)
    for (const { prop, was, now } of list) console.log(`    ${prop}: ${was}  →  ${now}`)
  }
}

if (removed.length) {
  console.log(`\n▸ ${removed.length} element(s) present in baseline but MISSING now`)
  removed.forEach(k => console.log(`    ${k}`))
}

if (added.length) {
  console.log(`\n▸ ${added.length} new element(s) not in baseline`)
  added.forEach(k => console.log(`    ${k}`))
}

console.log(`\nTriage each one: intended (update the baseline), collateral (investigate — ` +
            `this is the point), or noise (exclude it from the selector, or disable animations).`)
process.exit(1)
