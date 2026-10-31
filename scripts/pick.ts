// Moves the chosen candidates from the sources' inbox/ to raw/, as PNG, and clears
// the other candidates of those slugs. --discard clears a slug's candidates without
// picking any (a slug dropped from the batch).
// Run: bun run pick en:honey=2 en:dill=1 [--discard en:oregano …]

import { readFile, readdir, rm } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

import { fileName, parseCandidate, sourcesDir } from "./layout"

const sources = sourcesDir()
const inbox = path.join(sources, "inbox")
const candidates = (await readdir(inbox).catch(() => [] as string[])).flatMap((name) => parseCandidate(name) ?? [])
const subjects = new Set(
  (JSON.parse(await readFile(path.join(sources, "subjects.json"), "utf8")) as { slug: string }[]).map((s) => s.slug),
)

const args = process.argv.slice(2)
const discardAt = args.indexOf("--discard")
const discards = discardAt === -1 ? [] : args.slice(discardAt + 1)
const picks = (discardAt === -1 ? args : args.slice(0, discardAt)).map((arg) => {
  const match = /^([a-z]{2}:[^=]+)=(\d+)$/.exec(arg)
  if (!match) throw new Error(`Expected <slug>=<candidate>, got ${arg}`)
  const slug = match[1]!
  const n = Number(match[2])
  if (!subjects.has(slug)) throw new Error(`${slug} is not in subjects.json`)
  const chosen = candidates.find((c) => c.file === fileName(slug) && c.n === n)
  if (!chosen) throw new Error(`No candidate ${n} for ${slug} in ${inbox}`)
  return { slug, chosen }
})
if (!picks.length && !discards.length) {
  console.error("Usage: bun run pick en:honey=2 en:dill=1 [--discard en:oregano …]")
  process.exit(1)
}

// Every argument is checked above, before anything is written.
for (const { slug, chosen } of picks) {
  await sharp(path.join(inbox, chosen.name))
    .removeAlpha()
    .png()
    .toFile(path.join(sources, "raw", `${fileName(slug)}.png`))
  console.log(`${slug}: candidate ${chosen.n} → raw/${fileName(slug)}.png`)
}
const cleared = new Set([...picks.map((p) => p.slug), ...discards].map(fileName))
for (const c of candidates) if (cleared.has(c.file)) await rm(path.join(inbox, c.name))
if (discards.length) console.log(`Discarded the candidates of ${discards.join(" ")}`)

const left = candidates.filter((c) => !cleared.has(c.file)).length
console.log(left ? `${left} candidates left in inbox/` : "inbox/ is empty")
if (picks.length) console.log("Next: commit and push ingredient-icons-sources (raw/ and subjects.json)")
