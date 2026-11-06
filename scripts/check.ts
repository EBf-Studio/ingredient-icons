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

for (const [id, { file }] of Object.entries(manifest.icons)) {
  if (file !== id) errors.push(`${id}: file should be ${id}`)
  if (id !== GENERIC_ID && !Object.hasOwn(catalog.entries, id)) errors.push(`${id}: not in the catalog ${catalog.release}`)
}
for (const id of [...families(catalog), GENERIC_ID])
  if (!Object.hasOwn(manifest.icons, id)) errors.push(`${id}: ${id === GENERIC_ID ? "the generic icon" : "a family"} has no icon`)

const files = new Set(Object.values(manifest.icons).map(({ file }) => file))
for (const format of Object.keys(SIZES) as Format[])
  for (const size of SIZES[format]) {
    const present = new Set(await readdir(path.join(ICONS_DIR, format, String(size))).catch(() => []))
    for (const file of files)
      if (!present.has(`${file}.${format}`)) errors.push(`missing ${iconPath(format, size, file)}`)
    for (const name of present)
      if (!files.has(path.basename(name, `.${format}`))) errors.push(`orphan ${path.join(ICONS_DIR, format, String(size), name)}`)
  }

if (errors.length) {
  console.error(errors.join("\n"))
  process.exit(1)
}
const generic = Object.hasOwn(manifest.icons, GENERIC_ID)
console.log(`${files.size - Number(generic)} ingredient icons${generic ? " and the generic icon" : ""} OK`)
