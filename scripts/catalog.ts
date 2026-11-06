// The catalog snapshot: Marmalade's ingredient catalog (ids, parents, families, names), whose ids
// key every icon. catalog.json ships with each release, CC0.
// Run: bun run catalog (rewrites catalog.json from the build output of @marmalade/ingredient-catalog
// in a checkout of the recipe repository: $INGREDIENT_CATALOG (the package's folder), else
// ../recipe/packages/ingredient-catalog; run `bun run codegen` in that folder first).

import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import type { Catalog, CatalogNames } from "../packages/core/src/catalog"

export const CATALOG_FILE = "catalog.json"

/** What the snapshot reads of a catalog build (dist/data.js): its other fields stay out. */
export interface CatalogBuild {
  release: string
  entries: readonly { id: string; parent?: string; names: Partial<Record<string, CatalogNames>> }[]
}

/** The snapshot of a catalog build: ids, parents, families and names, sorted by id. */
export function snapshot(build: CatalogBuild): Catalog {
  const parents = new Map(build.entries.map((entry) => [entry.id, entry.parent]))
  const familyOf = (id: string) => {
    const seen = new Set<string>()
    let top = id
    for (
      let parent = parents.get(top);
      parent !== undefined && !seen.has(parent);
      parent = parents.get(top)
    ) {
      seen.add(parent)
      top = parent
    }
    return top
  }
  const sorted = [...build.entries].sort((a, b) => a.id.localeCompare(b.id))
  return {
    release: build.release,
    license: "CC0-1.0",
    entries: Object.fromEntries(
      sorted.map(({ id, parent, names }) => [
        id,
        parent === undefined ? { names } : { parent, family: familyOf(id), names },
      ]),
    ),
  }
}

/** catalog.json, one entry per line, so a catalog release reads as a diff. */
export function formatCatalog(catalog: Catalog) {
  const entries = Object.entries(catalog.entries).map(
    ([id, entry]) => `    ${JSON.stringify(id)}: ${JSON.stringify(entry)}`,
  )
  return `{
  "release": ${JSON.stringify(catalog.release)},
  "license": ${JSON.stringify(catalog.license)},
  "entries": {
${entries.join(",\n")}
  }
}
`
}

export async function readCatalog(file = CATALOG_FILE): Promise<Catalog> {
  return JSON.parse(await readFile(file, "utf8"))
}

/** Families: the entries with no parent. */
export const families = (catalog: Catalog) =>
  Object.keys(catalog.entries).filter((id) => catalog.entries[id]!.parent === undefined)

/**
 * The icon an id shows: its own, else its nearest ancestor's, its family's last. Undefined when
 * none has one, or the id is not in the catalog: the generic icon is the caller's choice.
 */
export function iconOf(id: string, icons: ReadonlySet<string>, catalog: Catalog) {
  const seen = new Set<string>()
  for (
    let at: string | undefined = id;
    at !== undefined && !seen.has(at);
    at = catalog.entries[at]?.parent
  ) {
    if (!catalog.entries[at]) return undefined
    if (icons.has(at)) return at
    seen.add(at)
  }
  return undefined
}

/** The package folder of @marmalade/ingredient-catalog. */
function catalogPackage() {
  const dir = path.resolve(
    process.env.INGREDIENT_CATALOG ?? "../recipe/packages/ingredient-catalog",
  )
  if (!existsSync(path.join(dir, "package.json")))
    throw new Error(
      `@marmalade/ingredient-catalog not found in ${dir}: set INGREDIENT_CATALOG to its folder`,
    )
  return dir
}

if (import.meta.main) {
  const dir = catalogPackage()
  const data = path.join(dir, "dist", "data.js")
  if (!existsSync(data)) throw new Error(`No ${data}: run bun run codegen in ${dir}`)
  const build: CatalogBuild = (await import(data)).default
  const catalog = snapshot(build)
  await writeFile(CATALOG_FILE, formatCatalog(catalog))
  const count = Object.keys(catalog.entries).length
  console.log(
    `${CATALOG_FILE}: ${count} entries (${families(catalog).length} families), release ${catalog.release}`,
  )
}
