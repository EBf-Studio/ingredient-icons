// Checks that the manifest, the icon files and the taxonomy agree:
// every icon exists in every format and size, no file is orphaned,
// and every id is an Open Food Facts taxonomy entry, except the reserved generic icon.
// Run: bun run check (CI runs it on every push)

import { readFile, readdir } from "node:fs/promises"
import path from "node:path"

import { GENERIC_ID, ICONS_DIR, SIZES, fileName, iconPath, type Format, type Manifest } from "./layout"

const manifest: Manifest = JSON.parse(await readFile("manifest.json", "utf8"))
const taxonomy: { names: Record<string, unknown> } = JSON.parse(
  await readFile("taxonomy.json", "utf8"),
)
const errors: string[] = []

for (const [id, { file }] of Object.entries(manifest.icons)) {
  if (file !== fileName(id)) errors.push(`${id}: file should be ${fileName(id)}`)
  if (id !== GENERIC_ID && !taxonomy.names[id]) errors.push(`${id}: not in the Open Food Facts taxonomy`)
}

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
