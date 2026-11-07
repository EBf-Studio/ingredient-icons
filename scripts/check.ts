// Checks that the manifest, the icon files and the catalog agree:
// every icon exists in every format and size, no file is orphaned,
// every id is a catalog entry (except the reserved generic icon),
// and every family and the generic icon have an icon.
// Run: bun run check (CI runs it on every push)

import { readFile, readdir } from "node:fs/promises"
import path from "node:path"

import { families, readCatalog } from "./catalog"
import { GENERIC_ID, ICONS_DIR, SIZES, iconPath, type Format, type Manifest } from "./layout"

const manifest: Manifest = JSON.parse(await readFile("manifest.json", "utf8"))
const catalog = await readCatalog()
const errors: string[] = []

const ids = new Set(manifest.icons)
for (const id of ids)
  if (id !== GENERIC_ID && !Object.hasOwn(catalog.entries, id)) errors.push(`${id}: not in the catalog ${catalog.release}`)
for (const id of [...families(catalog), GENERIC_ID])
  if (!ids.has(id)) errors.push(`${id}: ${id === GENERIC_ID ? "the generic icon" : "a family"} has no icon`)

for (const format of Object.keys(SIZES) as Format[])
  for (const size of SIZES[format]) {
    const present = new Set(await readdir(path.join(ICONS_DIR, format, String(size))).catch(() => []))
    for (const id of ids)
      if (!present.has(`${id}.${format}`)) errors.push(`missing ${iconPath(format, size, id)}`)
    for (const name of present)
      if (!ids.has(path.basename(name, `.${format}`))) errors.push(`orphan ${path.join(ICONS_DIR, format, String(size), name)}`)
  }

if (errors.length) {
  console.error(errors.join("\n"))
  process.exit(1)
}
const generic = ids.has(GENERIC_ID)
console.log(`${ids.size - Number(generic)} ingredient icons${generic ? " and the generic icon" : ""} OK`)
