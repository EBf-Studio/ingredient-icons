// Pins the Open Food Facts ingredient taxonomy and writes taxonomy.json: every
// entry's parents (so an id without an icon can fall back on an ancestor's) and
// the English and French names of the ids that have an icon.
// Run: bun run taxonomy (after a build that adds icons; keeps the release already pinned in taxonomy.json)
//      bun run taxonomy <tag | latest> (moves to another release: move the recipe repository with it)
//
// The source is ingredients.json from the food-taxonomies-json.tgz asset of an
// openfoodfacts-server release: the taxonomy Open Food Facts parses itself, with
// parents already resolved to ids. The recipe repository reads the same asset:
// move both to a new release together, so their ids stay the same.

import { readFile, writeFile } from "node:fs/promises"

import type { Manifest } from "./layout"
import { downloadTaxonomy, pinnedRelease } from "./off"

const LOCALES = ["en", "fr"] as const

const { release, commit, url, sha256, entries } = await downloadTaxonomy(process.argv[2] ?? (await pinnedRelease()))
const manifest: Manifest = JSON.parse(await readFile("manifest.json", "utf8"))
const unknown = Object.keys(manifest.icons).filter((id) => !entries[id])

const parents: Record<string, string[]> = {}
for (const id of Object.keys(entries).sort((a, b) => a.localeCompare(b))) {
  const entryParents = entries[id]!.parents
  if (entryParents?.length) parents[id] = entryParents
}

const names: Record<string, Partial<Record<(typeof LOCALES)[number], string>>> = {}
for (const id of Object.keys(manifest.icons).sort()) {
  const name = entries[id]?.name
  if (!name) continue
  names[id] = Object.fromEntries(LOCALES.flatMap((l) => (name[l] ? [[l, name[l]]] : [])))
}

const taxonomy = {
  source: "Open Food Facts ingredients taxonomy",
  release,
  commit,
  url,
  sha256,
  license: "ODbL-1.0",
  parents,
  names,
}
await writeFile("taxonomy.json", `${JSON.stringify(taxonomy, null, 2)}\n`)
console.log(`${Object.keys(entries).length} taxonomy entries in ${release}, ${Object.keys(names).length} named`)
if (unknown.length) console.log(`Not in the taxonomy: ${unknown.join(" ")}`)
