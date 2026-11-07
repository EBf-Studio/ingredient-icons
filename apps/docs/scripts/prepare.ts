// Builds @ingredient-icons/core, copies the icons into public/ and writes the data the
// site renders from: lib/generated/icons.json (gallery, icon pages, counts),
// lib/generated/catalog.json (every catalog entry's name and fallback walk, for the
// server), plus public/data/lookup.json (the fallback demo) and public/data/search-icons.json
// (the ⌘K dialog), both fetched on demand. Runs before dev and build.

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import type { Catalog } from "@ingredient-icons/core"
import { FALLBACK_PRESETS } from "../lib/fallback-presets"
import { fallbackKind, fallbackSteps, familyLabel } from "../lib/fallback"

const site = path.resolve(import.meta.dir, "..")
const root = path.resolve(site, "../..")

await Bun.$`bun run --cwd ${path.join(root, "packages/core")} build`.quiet()
const core = await import("@ingredient-icons/core")

const catalog: Catalog = JSON.parse(
  await readFile(path.join(root, "catalog.json"), "utf8"),
)
const manifest: { icons: Record<string, { file: string }> } = JSON.parse(
  await readFile(path.join(root, "manifest.json"), "utf8"),
)
const { version } = JSON.parse(await readFile(path.join(root, "packages/core/package.json"), "utf8"))

const entries = catalog.entries
const LANGUAGES = ["en", "fr", "es", "it", "de", "pt"] as const

// The site names files and pages after ids: it relies on file === id.
for (const [id, { file }] of Object.entries(manifest.icons))
  if (file !== id) throw new Error(`manifest.json: ${id} has file ${file}`)
// The generic icon is no ingredient: out of the gallery, the search and the counts.
const drawn = new Set(Object.keys(manifest.icons).filter((id) => id !== core.GENERIC_ID))
for (const id of drawn) if (!entries[id]) throw new Error(`manifest.json: ${id} is not in catalog.json`)

const parentOf = (id: string) => entries[id]?.parent
const hasIcon = (id: string) => drawn.has(id)
const isFamily = (id: string) => entries[id] !== undefined && entries[id].parent === undefined
const families = Object.keys(entries).filter(isFamily)

// Gallery sections: one per family that has icons, in this order (a family missing here goes last).
const FAMILY_ORDER = [
  "vegetables", "mushrooms", "fruits", "herbs", "spices", "spice-blends", "salts",
  "cheeses", "dairy", "eggs", "meats", "poultry", "charcuterie", "fish", "seafood",
  "grains", "pasta", "noodles", "breads", "baking", "legumes", "plant-proteins",
  "nuts-and-seeds", "oils-and-fats", "vinegars", "sauces", "condiments", "stocks",
  "sugars", "jams-and-spreads", "desserts", "drinks",
]
const rank = (family: string) => {
  const i = FAMILY_ORDER.indexOf(family)
  return i === -1 ? FAMILY_ORDER.length : i
}

/** English name to show. A family's catalog name is often a Wikidata label ("egg as food"): use its id. */
const nameOf = (id: string) => (isFamily(id) ? familyLabel(id) : (entries[id]?.names.en?.name ?? familyLabel(id)))
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

const steps = Object.fromEntries(Object.keys(entries).map((id) => [id, fallbackSteps(id, parentOf, hasIcon)]))
const borrowers = new Map<string, string[]>()
for (const [id, walk] of Object.entries(steps)) {
  const target = walk.at(-1)!
  if (walk.length > 1 && target !== core.GENERIC_ID) borrowers.set(target, [...(borrowers.get(target) ?? []), id])
}
// Covered: catalog entries whose own-or-ancestor walk reaches an icon.
const covered = Object.values(steps).filter((walk) => walk.at(-1) !== core.GENERIC_ID).length

/** Every name (and synonym) of an entry, in every language, without repeats. */
function terms(id: string, { synonyms = true } = {}) {
  const all = new Map<string, string>()
  for (const language of LANGUAGES) {
    const names = entries[id]?.names[language]
    for (const term of [names?.name, ...(synonyms ? (names?.synonyms ?? []) : [])])
      if (term && !all.has(term.toLowerCase())) all.set(term.toLowerCase(), term)
  }
  return [...all.values()]
}

const icons = [...drawn]
  .map((id) => {
    const entry = entries[id]!
    const fallbacks = (borrowers.get(id) ?? []).sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
    return {
      id,
      name: nameOf(id),
      names: Object.fromEntries(
        LANGUAGES.flatMap((language) => {
          const name = entry.names[language]?.name
          return name ? [[language, name]] : []
        }),
      ) as Partial<Record<(typeof LANGUAGES)[number], string>>,
      terms: terms(id),
      parent: entry.parent ?? null,
      family: entry.family ?? null,
      category: entry.family ?? id,
      fallbacks,
      // Names of the ingredients that borrow this icon, for search: "lardons fumés" finds what they show.
      aliases: [...new Set(fallbacks.flatMap((borrower) => terms(borrower, { synonyms: false })))],
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

const categories = families
  .filter((family) => icons.some((icon) => icon.category === family))
  .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
  .map((family) => ({ key: family, title: capitalize(familyLabel(family)) }))

// How many catalog entries have a name in each language.
const nameCoverage = LANGUAGES.map((language) => ({
  language,
  count: Object.values(entries).filter((entry) => entry.names[language]?.name).length,
}))

for (const id of FALLBACK_PRESETS) if (!entries[id]) throw new Error(`fallback preset ${id} is not in catalog.json`)

await mkdir(path.join(site, "lib/generated"), { recursive: true })
await writeFile(
  path.join(site, "lib/generated/icons.json"),
  JSON.stringify({
    version,
    catalogSize: Object.keys(entries).length,
    familyCount: families.length,
    covered,
    nameCoverage,
    // The demo's examples are rendered on the server, before lookup.json arrives.
    presets: FALLBACK_PRESETS.map((id) => ({
      id,
      name: nameOf(id),
      steps: steps[id]!.map((step) => ({ id: step, name: nameOf(step), family: isFamily(step) })),
    })),
    categories,
    icons,
  }),
)
// Server only: name and walk of every catalog entry, for the docs and the home page.
await writeFile(
  path.join(site, "lib/generated/catalog.json"),
  JSON.stringify(
    Object.fromEntries(
      Object.keys(entries).map((id) => [id, { name: nameOf(id), family: isFamily(id), steps: steps[id] }]),
    ),
  ),
)

await rm(path.join(site, "public/icons"), { recursive: true, force: true })
await rm(path.join(site, "public/data"), { recursive: true, force: true })
await cp(path.join(root, "icons"), path.join(site, "public/icons"), { recursive: true })
await mkdir(path.join(site, "public/data"), { recursive: true })
// The fallback demo: every catalog entry with its parent, whether it has an icon, and the
// names and synonyms it can be found by. The demo walks the parents itself.
await writeFile(
  path.join(site, "public/data/lookup.json"),
  JSON.stringify(
    Object.fromEntries(
      Object.entries(entries).map(([id, entry]) => [
        id,
        {
          name: nameOf(id),
          ...(entry.parent ? { parent: entry.parent } : { family: true }),
          ...(drawn.has(id) && { icon: true }),
          terms: terms(id),
        },
      ]),
    ),
  ),
)
// The ⌘K dialog fetches this when it opens: what the gallery searches, minus the catalog tree.
await writeFile(
  path.join(site, "public/data/search-icons.json"),
  JSON.stringify(icons.map(({ id, name, names, terms, aliases }) => ({ id, name, fr: names.fr, terms, aliases }))),
)

const kinds = Object.values(steps).map((walk) => fallbackKind(walk, isFamily))
const count = (kind: string) => kinds.filter((k) => k === kind).length
console.log(
  `${drawn.size} icons (${families.filter((f) => drawn.has(f)).length} of ${families.length} families drawn), ` +
    `${covered} of ${kinds.length} catalog entries covered: ${count("own")} own icon, ${count("ancestor")} ancestor's, ` +
    `${count("family")} family's, ${count("generic")} generic`,
)
for (const { key } of categories) console.log(`  ${key}: ${icons.filter((i) => i.category === key).length}`)
