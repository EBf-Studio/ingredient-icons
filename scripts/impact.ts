// What adding icons for some ids would change, before generating them: whether each
// id exists in the taxonomy, what it shows today, and which ids would switch to it.
// "Today" counts the raws already in the sources but not published yet.
// A generic icon (en:seed) can take over ids it draws badly (pepper, sesame): read the takeovers.
// Run: bun run impact en:yuzu en:seed …

import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { fileName, sourcesDir, type Manifest } from "./layout"
import { downloadTaxonomy, type Entries } from "./off"

const manifest: Manifest = JSON.parse(await readFile("manifest.json", "utf8"))
const { parents, release }: { parents: Record<string, string[]>; release: string } = JSON.parse(
  await readFile("taxonomy.json", "utf8"),
)
const proposed = process.argv.slice(2)
if (!proposed.length) {
  console.error("Usage: bun run impact en:yuzu en:seed …")
  process.exit(1)
}

const published = new Set(Object.keys(manifest.icons))
const pending = new Set<string>()
try {
  const sources = sourcesDir()
  const subjects: { slug: string }[] = JSON.parse(await readFile(path.join(sources, "subjects.json"), "utf8"))
  for (const { slug } of subjects)
    if (!published.has(slug) && existsSync(path.join(sources, "raw", `${fileName(slug)}.png`))) pending.add(slug)
} catch {
  console.log("⚠ Sources not found: raws not published yet are not counted")
}
const current = new Set([...published, ...pending])

// taxonomy.json only lists entries in the parent graph: look the others up in the pinned release.
const inGraph = new Set([...Object.keys(parents), ...Object.values(parents).flat()])
const outside = proposed.filter((id) => !inGraph.has(id))
const entries = outside.length ? await pinnedEntries() : {}
const exists = (id: string) => inGraph.has(id) || Object.hasOwn(entries, id)

const next = new Set([...current, ...proposed.filter(exists)])

/** Same breadth-first walk as findIcon in packages/core. */
function iconOf(id: string, icons: Set<string>) {
  let level = [id]
  const seen = new Set(level)
  for (let depth = 0; depth <= 6 && level.length; depth++) {
    const hit = level.find((candidate) => icons.has(candidate))
    if (hit) return hit
    level = level.flatMap((candidate) => (parents[candidate] ?? []).filter((p) => !seen.has(p) && seen.add(p)))
  }
  return undefined
}

const universe = (icons: Set<string>) => new Set([...Object.keys(parents), ...icons])
const covered = (icons: Set<string>) => [...universe(icons)].filter((id) => iconOf(id, icons)).length

const changes = new Map<string, { gained: string[]; takenOver: string[] }>()
for (const id of universe(next)) {
  const before = iconOf(id, current)
  const after = iconOf(id, next)
  if (!after || before === after || after === id) continue
  const entry = changes.get(after) ?? { gained: [], takenOver: [] }
  if (before) entry.takenOver.push(`${id} (was ${before})`)
  else entry.gained.push(id)
  changes.set(after, entry)
}

for (const id of proposed) {
  if (!exists(id)) console.log(`✗ ${id}: not in the Open Food Facts taxonomy ${release}`)
  else if (published.has(id)) console.log(`✗ ${id}: already has an icon (to regenerate it, edit its subject)`)
  else if (pending.has(id)) console.log(`✗ ${id}: already has a raw, waiting to be published`)
  else {
    const today = iconOf(id, current)
    const { gained = [], takenOver = [] } = changes.get(id) ?? {}
    console.log(`✓ ${id}: today ${today ? `→ ${today}` : "no icon"}; +${gained.length} ids without an icon, ${takenOver.length} taken over from another icon`)
    for (const line of takenOver.slice(0, 12)) console.log(`    ${line}`)
    if (takenOver.length > 12) console.log(`    … and ${takenOver.length - 12} more`)
  }
}
console.log(`\nIcons ${current.size} → ${next.size}, ingredients covered ${covered(current)} → ${covered(next)}`)
if (pending.size) console.log(`(counting ${pending.size} raws not published yet)`)

/** Every entry of the pinned release, downloaded once into .out/. */
async function pinnedEntries(): Promise<Entries> {
  const cache = path.join(".out", `taxonomy-${release}.json`)
  if (existsSync(cache)) return JSON.parse(await readFile(cache, "utf8"))
  const { entries } = await downloadTaxonomy(release)
  await mkdir(".out", { recursive: true })
  await writeFile(cache, JSON.stringify(entries))
  return entries
}
