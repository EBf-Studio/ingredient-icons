// What adding icons for some ids would change, before generating them: whether each
// id exists in the taxonomy, what it shows today, and which ids would switch to it.
// A generic icon (en:seed) can take over ids it draws badly (pepper, sesame): read the takeovers.
// Run: bun run impact en:yuzu en:seed …

import { readFile } from "node:fs/promises"

import type { Manifest } from "./layout"

const manifest: Manifest = JSON.parse(await readFile("manifest.json", "utf8"))
const { parents, release }: { parents: Record<string, string[]>; release: string } = JSON.parse(
  await readFile("taxonomy.json", "utf8"),
)
const proposed = process.argv.slice(2)
if (!proposed.length) {
  console.error("Usage: bun run impact en:yuzu en:seed …")
  process.exit(1)
}

const known = new Set([...Object.keys(parents), ...Object.values(parents).flat()])
const current = new Set(Object.keys(manifest.icons))
const next = new Set([...current, ...proposed.filter((id) => known.has(id))])

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
  if (!known.has(id)) console.log(`✗ ${id}: not in the taxonomy (${release})`)
  else if (current.has(id)) console.log(`✗ ${id}: already has an icon`)
  else {
    const today = iconOf(id, current)
    const { gained = [], takenOver = [] } = changes.get(id) ?? {}
    console.log(`✓ ${id}: today ${today ? `→ ${today}` : "no icon"}; +${gained.length} ids without an icon, ${takenOver.length} taken over from another icon`)
    for (const line of takenOver.slice(0, 12)) console.log(`    ${line}`)
    if (takenOver.length > 12) console.log(`    … and ${takenOver.length - 12} more`)
  }
}
console.log(`\nIcons ${current.size} → ${next.size}, ingredients covered ${covered(current)} → ${covered(next)}`)
