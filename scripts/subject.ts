// Adds a slug's subject to the sources' subjects.json, or replaces it, leaving every
// other line as it is (the file keeps one entry per line).
// Run: bun run subject en:honey "a glass jar of golden honey with a wooden dipper"

import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { sourcesDir } from "./layout"

const entry = (slug: string, subject: string) => `  { "slug": ${JSON.stringify(slug)}, "subject": ${JSON.stringify(subject)} }`

/** subjects.json with that slug's subject set: its own line replaced, or a new last line. */
export function setSubject(text: string, slug: string, subject: string) {
  // Taxonomy ids keep accents and other letters (en:pošip), never spaces, quotes or colons.
  if (!/^[a-z]{2}:[^\s":,]+$/u.test(slug)) throw new Error(`Not an Open Food Facts id: ${slug}`)
  if (!subject.trim() || /\n/.test(subject)) throw new Error("The subject is one sentence on one line")
  const lines = text.split("\n")
  const at = lines.findIndex((line) => line.includes(`"slug": ${JSON.stringify(slug)},`))
  if (at !== -1) lines[at] = entry(slug, subject) + (lines[at]!.trimEnd().endsWith(",") ? "," : "")
  else {
    const close = lines.findLastIndex((line) => line.trim() === "]")
    const last = close - 1
    if (close < 1 || !lines[last]!.trim().startsWith("{")) throw new Error("subjects.json is not one entry per line")
    lines[last] = `${lines[last]!.trimEnd()},`
    lines.splice(close, 0, entry(slug, subject))
  }
  const out = lines.join("\n")
  const slugs = (JSON.parse(out) as { slug: string }[]).map((s) => s.slug)
  if (slugs.filter((s) => s === slug).length !== 1) throw new Error(`${slug} appears more than once in subjects.json`)
  return { text: out, added: at === -1 }
}

if (import.meta.main) {
  const [slug, subject, ...rest] = process.argv.slice(2)
  if (!slug || !subject || rest.length) {
    console.error('Usage: bun run subject en:honey "a glass jar of golden honey with a wooden dipper"')
    process.exit(1)
  }
  const file = path.join(sourcesDir(), "subjects.json")
  const { text, added } = setSubject(await readFile(file, "utf8"), slug, subject)
  await writeFile(file, text)
  console.log(`${slug}: subject ${added ? "added" : "replaced"}`)
}
