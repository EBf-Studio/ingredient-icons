// Pins the Open Food Facts ingredient taxonomy and writes taxonomy.json: every
// entry's parents (so an id without an icon can fall back on an ancestor's) and
// the English and French names of the ids that have an icon.
// Run: bun run taxonomy (after a build that adds icons)

import { readFile, writeFile } from "node:fs/promises"

import type { Manifest } from "./layout"

const REPO = "openfoodfacts/openfoodfacts-server"
const FILE = "taxonomies/food/ingredients.txt"
const LOCALES = ["en", "fr"] as const

interface Entry {
  id: string
  parents: string[]
  names: Map<string, string>
}

// Same slugs as Open Food Facts for the names in this taxonomy: lowercase, spaces as hyphens.
const toId = (locale: string, name: string) => `${locale}:${name.toLowerCase().replace(/\s+/g, "-")}`

/** Entries are blocks separated by blank lines: "< parent" lines, then "xx: name, synonym…" lines. */
export function parseTaxonomy(content: string) {
  const entries: Entry[] = []
  let current: Entry | null = null
  const flush = () => {
    if (current?.id) entries.push(current)
    current = null
  }
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim()
    if (line === "" || line.startsWith("#")) {
      flush()
      continue
    }
    if (line.startsWith("stopwords:") || line.startsWith("synonyms:")) continue
    current ??= { id: "", parents: [], names: new Map() }
    if (line.startsWith("<")) {
      // "< en: Smoked bacon" names the parent: it becomes the id that entry gets.
      const [locale, ...name] = line.slice(1).split(":")
      const parentName = name.join(":").trim()
      if (locale?.trim() && parentName) current.parents.push(toId(locale.trim(), parentName))
      continue
    }
    const colon = line.indexOf(":")
    if (colon === -1) continue
    const key = line.slice(0, colon).trim()
    if (!/^[a-z]{2,3}$/.test(key)) continue
    const name = line.slice(colon + 1).split(",")[0]?.trim()
    if (!name) continue
    current.names.set(key, name)
    if (!current.id) current.id = toId(key, name)
  }
  flush()
  return entries
}

const commits = await fetch(`https://api.github.com/repos/${REPO}/commits?path=${FILE}&per_page=1`)
if (!commits.ok) throw new Error(`GitHub API: ${commits.status}`)
const [latest] = (await commits.json()) as { sha: string }[]
if (!latest) throw new Error(`No commit touches ${FILE}`)
const { sha } = latest
const content = await (await fetch(`https://raw.githubusercontent.com/${REPO}/${sha}/${FILE}`)).text()
const entries = parseTaxonomy(content)
const byId = new Map(entries.map((entry) => [entry.id, entry]))

const manifest: Manifest = JSON.parse(await readFile("manifest.json", "utf8"))
const unknown = Object.keys(manifest.icons).filter((id) => !byId.has(id))

const parents: Record<string, string[]> = {}
for (const entry of [...entries].sort((a, b) => a.id.localeCompare(b.id)))
  if (entry.parents.length) parents[entry.id] = entry.parents

const names: Record<string, Partial<Record<(typeof LOCALES)[number], string>>> = {}
for (const id of Object.keys(manifest.icons).sort()) {
  const entry = byId.get(id)
  if (!entry) continue
  names[id] = Object.fromEntries(LOCALES.flatMap((l) => (entry.names.has(l) ? [[l, entry.names.get(l)!]] : [])))
}

const taxonomy = {
  source: "Open Food Facts ingredients taxonomy",
  url: `https://github.com/${REPO}/blob/${sha}/${FILE}`,
  commit: sha,
  license: "ODbL-1.0",
  parents,
  names,
}
await writeFile("taxonomy.json", `${JSON.stringify(taxonomy, null, 2)}\n`)
console.log(`${entries.length} taxonomy entries at ${sha.slice(0, 7)}, ${Object.keys(names).length} named`)
if (unknown.length) console.log(`Not in the taxonomy: ${unknown.join(" ")}`)
