// Moves the chosen candidates from the sources' inbox/ to raw/, as PNG, and clears
// the other candidates of those slugs. --discard clears a slug's candidates without
// picking any, before generating it again.
// Run: bun run pick en:honey=2 en:dill=1 [--discard en:oregano …]

import { readFile, readdir, rm } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

import { fileName, sourcesDir } from "./layout"

const sources = sourcesDir()
const inbox = path.join(sources, "inbox")
const names = await readdir(inbox).catch(() => [] as string[])
const subjects = new Set(
  (JSON.parse(await readFile(path.join(sources, "subjects.json"), "utf8")) as { slug: string }[]).map((s) => s.slug),
)

const args = process.argv.slice(2)
const discardAt = args.indexOf("--discard")
const picks = (discardAt === -1 ? args : args.slice(0, discardAt)).map((arg) => {
  const match = /^([a-z]{2}:[^=]+)=(\d+)$/.exec(arg)
  if (!match) throw new Error(`Expected <slug>=<candidate>, got ${arg}`)
  return { slug: match[1]!, n: Number(match[2]) }
})
const discards = discardAt === -1 ? [] : args.slice(discardAt + 1)
if (!picks.length && !discards.length) {
  console.error("Usage: bun run pick en:honey=2 en:dill=1 [--discard en:oregano …]")
  process.exit(1)
}

const candidatesOf = (slug: string) => names.filter((name) => name.startsWith(`${fileName(slug)}.`))

for (const { slug, n } of picks) {
  if (!subjects.has(slug)) throw new Error(`${slug} is not in subjects.json`)
  const chosen = candidatesOf(slug).find((name) => new RegExp(`\\.${n}\\.(jpe?g|png)$`, "i").test(name))
  if (!chosen) throw new Error(`No candidate ${n} for ${slug} in ${inbox}`)
  await sharp(path.join(inbox, chosen))
    .removeAlpha()
    .png()
    .toFile(path.join(sources, "raw", `${fileName(slug)}.png`))
  console.log(`${slug}: candidate ${n} → raw/${fileName(slug)}.png`)
}

for (const slug of [...picks.map((p) => p.slug), ...discards])
  for (const name of candidatesOf(slug)) await rm(path.join(inbox, name))
if (discards.length) console.log(`Discarded the candidates of ${discards.join(" ")}`)

const left = (await readdir(inbox).catch(() => [])).filter((name) => !name.startsWith("."))
console.log(left.length ? `${left.length} candidates left in inbox/` : "inbox/ is empty")
if (picks.length) console.log("Next: commit and push ingredient-icons-sources (raw/ and subjects.json)")
