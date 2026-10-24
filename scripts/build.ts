// Builds every icon from the private sources: cut-out, every size and format,
// manifest.json, and a review page in .out/. Output is deterministic, so an
// unchanged raw leaves its files untouched in git.
// Run: bun run build (sources at ../ingredient-icons-sources or $INGREDIENT_ICONS_SOURCES)

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

import { cutOut } from "./cut-out"
import {
  ICONS_DIR,
  PATH_TEMPLATE,
  SIZES,
  SOURCES_DIR,
  STYLE_VERSION,
  fileName,
  iconPath,
  type Format,
  type Manifest,
} from "./layout"

const subjects: { slug: string }[] = JSON.parse(
  await readFile(path.join(SOURCES_DIR, "subjects.json"), "utf8"),
)
const raw = new Set(await readdir(path.join(SOURCES_DIR, "raw")))

await rm(ICONS_DIR, { recursive: true, force: true })
for (const [format, sizes] of Object.entries(SIZES))
  for (const size of sizes) await mkdir(path.join(ICONS_DIR, format, String(size)), { recursive: true })

const icons: Manifest["icons"] = {}
const missing: string[] = []
for (const { slug: id } of [...subjects].sort((a, b) => a.slug.localeCompare(b.slug))) {
  const file = fileName(id)
  if (!raw.has(`${file}.png`)) {
    missing.push(id)
    continue
  }
  const master = await cutOut(path.join(SOURCES_DIR, "raw", `${file}.png`))
  for (const format of Object.keys(SIZES) as Format[])
    for (const size of SIZES[format]) {
      const resized = sharp(master).resize(size, size)
      const out =
        format === "png"
          ? resized.png({ compressionLevel: 9, effort: 10 })
          : resized.webp({ quality: 90, alphaQuality: 100, effort: 6 })
      await out.toFile(iconPath(format, size, file))
    }
  icons[id] = { file }
}

const manifest: Manifest = { style: STYLE_VERSION, sizes: SIZES, path: PATH_TEMPLATE, icons }
await writeFile("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`)

await mkdir(".out", { recursive: true })
await writeFile(".out/review.html", reviewPage(Object.keys(icons)))

console.log(`${Object.keys(icons).length} icons${missing.length ? `, ${missing.length} without a raw: ${missing.join(" ")}` : ""}`)
console.log(`Review: ${path.resolve(".out/review.html")}`)

/** Each icon large, in a list row and inline in text, on light and dark backgrounds. */
function reviewPage(ids: string[]) {
  const card = (id: string) => {
    const src = `../${iconPath("webp", 256, fileName(id))}`
    return `<figure><img class="big" src="${src}"><figcaption><img class="row" src="${src}">${id}</figcaption><p>in text <img class="inline" src="${src}"> ${id.slice(id.indexOf(":") + 1)}</p></figure>`
  }
  const grid = ids.map(card).join("")
  return `<!doctype html><meta charset="utf-8"><title>ingredient-icons review</title><style>
body{margin:0;font:14px system-ui}section{padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.light{background:#f7f4ee;color:#201e1b}.dark{background:#201e1b;color:#f7f4ee}
figure{margin:0;padding:10px;border-radius:14px;background:#0000000a;text-align:center}.dark figure{background:#ffffff0d}
.big{width:96px;height:96px}figcaption{display:flex;gap:6px;align-items:center;justify-content:center;font-weight:600}
.row{width:32px;height:32px}.inline{width:20px;height:20px;vertical-align:-5px}p{margin:6px 0 0;font-size:12px;opacity:.8}
</style><section class="light">${grid}</section><section class="dark">${grid}</section>`
}
