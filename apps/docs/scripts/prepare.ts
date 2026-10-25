// Builds @ingredient-icons/core, copies the icons into public/ and writes the data the
// site renders from: lib/generated/icons.json (gallery and icon pages), plus
// public/data/lookup.json (the fallback demo) and public/data/search-icons.json (the ⌘K
// dialog), both fetched on demand. Runs before dev and build.

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const site = path.resolve(import.meta.dir, "..")
const root = path.resolve(site, "../..")

await Bun.$`bun run --cwd ${path.join(root, "packages/core")} build`.quiet()
const core = await import("@ingredient-icons/core")

const taxonomy: { commit: string; parents: Record<string, string[]>; names: Record<string, { en?: string; fr?: string }> } =
  JSON.parse(await readFile(path.join(root, "taxonomy.json"), "utf8"))
const manifest: { icons: Record<string, { file: string }> } = JSON.parse(
  await readFile(path.join(root, "manifest.json"), "utf8"),
)
const { version } = JSON.parse(await readFile(path.join(root, "packages/core/package.json"), "utf8"))

// Gallery sections, in display order. An icon goes to the first section one of its
// ancestors (or itself) belongs to; the rest end up in the pantry.
const CATEGORIES: { key: string; title: string; roots: string[] }[] = [
  { key: "vegetables", title: "Vegetables", roots: ["en:vegetable", "en:salad", "en:mushroom", "en:rhubarb", "en:olive"] },
  { key: "fruits", title: "Fruits", roots: ["en:fruit", "en:berries", "en:coconut"] },
  { key: "herbs-spices", title: "Herbs & spices", roots: ["en:herb", "en:spice", "en:pepper", "en:mixed-spices", "en:salt", "en:juniper-berry"] },
  { key: "dairy-eggs", title: "Dairy & eggs", roots: ["en:dairy", "en:cheese", "en:egg"] },
  { key: "meat", title: "Meat & poultry", roots: ["en:meat", "en:poultry", "en:pork", "en:beef", "en:sheep"] },
  { key: "seafood", title: "Fish & seafood", roots: ["en:fish", "en:shellfish", "en:mollusc", "en:crustacean", "en:tuna"] },
  { key: "grains", title: "Grains, pasta & bread", roots: ["en:cereal", "en:flour", "en:pasta", "en:dough", "en:rice", "en:bread", "en:biscuit", "en:noodle", "en:quinoa"] },
  { key: "legumes-nuts", title: "Legumes, nuts & seeds", roots: ["en:legume", "en:pulse", "en:nut", "en:seed", "en:sunflower-seed"] },
  { key: "pantry", title: "Pantry", roots: [] },
]

function ancestors(id: string): string[] {
  const seen = new Set([id])
  const order = [id]
  for (let i = 0; i < order.length; i++)
    for (const parent of taxonomy.parents[order[i]!] ?? [])
      if (!seen.has(parent)) {
        seen.add(parent)
        order.push(parent)
      }
  return order
}

function categoryOf(id: string): string {
  const all = new Set(ancestors(id))
  for (const category of CATEGORIES) if (category.roots.some((r) => all.has(r))) return category.key
  return "pantry"
}

/** Path from an id to the id whose icon it gets, following findIcon's breadth-first walk. */
function chain(id: string): string[] | undefined {
  const icon = core.findIcon(id)
  if (!icon) return undefined
  const from = new Map<string, string | undefined>([[id, undefined]])
  const queue = [id]
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]!
    if (current === icon.id) {
      const steps = [current]
      for (let step = from.get(current); step; step = from.get(step)) steps.unshift(step)
      return steps
    }
    for (const parent of taxonomy.parents[current] ?? [])
      if (!from.has(parent)) {
        from.set(parent, current)
        queue.push(parent)
      }
  }
  throw new Error(`no path from ${id} to ${icon.id}`)
}

const lookup: Record<string, string[]> = {}
const fallbacks = new Map<string, string[]>()
for (const id of Object.keys(taxonomy.parents)) {
  const steps = chain(id)
  if (!steps) continue
  lookup[id] = steps
  const target = steps.at(-1)!
  if (target !== id) fallbacks.set(target, [...(fallbacks.get(target) ?? []), id])
}

const slugOf = (file: string) => file.replace(/^en_/, "")
const icons = Object.entries(manifest.icons)
  .map(([id, { file }]) => ({
    id,
    file,
    slug: slugOf(file),
    en: core.iconName(id, "en") ?? id.replace(/^\w+:/, "").replaceAll("-", " "),
    fr: core.iconName(id, "fr"),
    category: categoryOf(id),
    parents: taxonomy.parents[id] ?? [],
    fallbacks: (fallbacks.get(id) ?? []).sort((a, b) => Number(!a.startsWith("en:")) - Number(!b.startsWith("en:")) || a.localeCompare(b)),
  }))
  .sort((a, b) => a.en.localeCompare(b.en))

await mkdir(path.join(site, "lib/generated"), { recursive: true })
await writeFile(
  path.join(site, "lib/generated/icons.json"),
  JSON.stringify({
    version,
    taxonomyCommit: taxonomy.commit,
    taxonomySize: Object.keys(taxonomy.parents).length,
    resolvable: Object.keys(lookup).length,
    categories: CATEGORIES.map(({ key, title }) => ({ key, title })),
    icons,
  }),
)

await rm(path.join(site, "public/icons"), { recursive: true, force: true })
await rm(path.join(site, "public/data"), { recursive: true, force: true })
await cp(path.join(root, "icons"), path.join(site, "public/icons"), { recursive: true })
await mkdir(path.join(site, "public/data"), { recursive: true })
await writeFile(path.join(site, "public/data/lookup.json"), JSON.stringify(lookup))
// The ⌘K dialog fetches this when it opens: names and English aliases, no taxonomy.
await writeFile(
  path.join(site, "public/data/search-icons.json"),
  JSON.stringify(
    icons.map(({ id, slug, file, en, fr, fallbacks }) => ({
      id,
      slug,
      file,
      en,
      fr,
      aliases: fallbacks.filter((f) => f.startsWith("en:")).map((f) => f.slice(3).replaceAll("-", " ")),
    })),
  ),
)

console.log(`${icons.length} icons, ${Object.keys(lookup).length} taxonomy ids resolve to one`)
for (const { key } of CATEGORIES) console.log(`  ${key}: ${icons.filter((i) => i.category === key).length}`)
