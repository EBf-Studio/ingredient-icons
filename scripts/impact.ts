// What adding icons for some ids would change, before generating them: whether each id is in the
// catalog, what it shows today, and which entries would switch to it (an entry without an icon
// shows its nearest ancestor's, its family's last). "Today" counts the raws already in the
// sources but not published yet. A broad icon (a parent of many) can take over entries it draws badly:
// read the takeovers. The reserved generic icon (GENERIC_ID) is no catalog entry and nothing
// falls back on it: skipped.
// Run: bun run impact acorn-squash garam-masala …

import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"

import { iconOf, readCatalog } from "./catalog"
import { GENERIC_ID, sourcesDir, type Manifest } from "./layout"

const manifest: Manifest = JSON.parse(await readFile("manifest.json", "utf8"))
const catalog = await readCatalog()
const args = process.argv.slice(2)
if (args.includes(GENERIC_ID)) console.log(`- ${GENERIC_ID}: reserved id, not an ingredient: nothing falls back on it, skipped`)
const proposed = args.filter((id) => id !== GENERIC_ID)
if (!args.length) {
  console.error("Usage: bun run impact acorn-squash garam-masala …")
  process.exit(1)
}

const published = new Set(Object.keys(manifest.icons))
const pending = new Set<string>()
const sources = (() => {
  try {
    return sourcesDir()
  } catch {
    console.log("⚠ Sources not found: raws not published yet are not counted")
  }
})()
if (sources) {
  const subjects: { slug: string }[] = JSON.parse(await readFile(path.join(sources, "subjects.json"), "utf8"))
  for (const { slug } of subjects)
    if (!published.has(slug) && existsSync(path.join(sources, "raw", `${slug}.png`))) pending.add(slug)
}
/** Where to look at the icon an id shows: the published icon, or the raw of one not published yet. */
const picture = (id: string) =>
  pending.has(id) ? `${id} (not published: ${path.join(sources!, "raw", `${id}.png`)})` : `${id} (${path.resolve("icons/png/128", `${id}.png`)})`
const current = new Set([...published, ...pending])

const exists = (id: string) => Object.hasOwn(catalog.entries, id)
const next = new Set([...current, ...proposed.filter(exists)])

const entries = Object.keys(catalog.entries)
const isFamily = (id: string) => catalog.entries[id]!.parent === undefined
/** How many entries show their own icon, an ancestor's, their family's (or none): the share on the family's is what new icons shrink. */
const breakdown = (icons: Set<string>) => {
  const counts = { own: 0, ancestor: 0, family: 0, generic: 0 }
  for (const id of entries) {
    const icon = iconOf(id, icons, catalog)
    if (icon === id) counts.own++
    else if (icon && isFamily(icon)) counts.family++
    else if (icon) counts.ancestor++
    else counts.generic++
  }
  return counts
}

/** For each proposed icon, the entries that would switch to it, with what they show today. */
const takeovers = new Map<string, string[]>()
for (const id of entries) {
  const before = iconOf(id, current, catalog)
  const after = iconOf(id, next, catalog)
  if (!after || before === after || after === id) continue
  takeovers.set(after, [...(takeovers.get(after) ?? []), `${id} (was ${before ?? "the generic icon"})`])
}

for (const id of proposed) {
  if (!exists(id)) console.log(`✗ ${id}: not in the catalog ${catalog.release} (bun run catalog to refresh it)`)
  else if (published.has(id)) console.log(`✗ ${id}: already has an icon (to regenerate it, edit its subject)`)
  else if (pending.has(id)) console.log(`✗ ${id}: already has a raw, waiting to be published`)
  else {
    const today = iconOf(id, current, catalog)
    const takenOver = takeovers.get(id) ?? []
    console.log(`✓ ${id}: today ${today ? `→ ${picture(today)}` : "the generic icon"}; ${takenOver.length} entries switch to it`)
    for (const line of takenOver.slice(0, 12)) console.log(`    ${line}`)
    if (takenOver.length > 12) console.log(`    … and ${takenOver.length - 12} more`)
  }
}
const ingredientIcons = (icons: Set<string>) => icons.size - Number(icons.has(GENERIC_ID))
if (proposed.length) {
  const [before, after] = [breakdown(current), breakdown(next)]
  console.log(`\nIcons ${ingredientIcons(current)} → ${ingredientIcons(next)}, of the ${entries.length} catalog entries:`)
  for (const [kind, label] of [["own", "own icon"], ["ancestor", "an ancestor's"], ["family", "their family's"]] as const)
    console.log(`  ${label}: ${before[kind]} → ${after[kind]}`)
  // Only a family without an icon yet leaves entries here (bun run catalog warns about it).
  if (before.generic || after.generic) console.log(`  the generic icon: ${before.generic} → ${after.generic}`)
}
if (pending.size) console.log(`(counting ${pending.size} raws not published yet)`)
