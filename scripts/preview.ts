// Prepares the review of freshly generated candidates, before any of them reaches raw/:
// cuts out every image of the sources' inbox/, measures what a reviewer can't
// judge reliably by eye, and draws contact sheets to look at.
// Run: bun run preview [slug…] (default: every candidate in inbox/)
//
// inbox/ holds `<file>.<n>.<jpg|png>` (en:honey, candidate 2 → en_honey.2.jpg).
// Writes .out/preview/sheet-<k>.png (a few slugs per sheet, every candidate side by
// side) and .out/preview/report.json, and prints one line per candidate.

import { mkdir, readdir, rm, writeFile } from "node:fs/promises"
import { availableParallelism } from "node:os"
import path from "node:path"
import sharp, { type OverlayOptions } from "sharp"

import { cutOut } from "./cut-out"
import { fileName, sourcesDir } from "./layout"
import { inspect, type Inspection } from "./inspect"

const OUT = ".out/preview"
const SLUGS_PER_SHEET = 6
const CELL = 192
const TINY = 24
const ZOOM = 4

const inbox = path.join(sourcesDir(), "inbox")
const only = new Set(process.argv.slice(2).map(fileName))
const candidates = (await readdir(inbox).catch(() => []))
  .map((name) => ({ name, match: /^(.+)\.(\d+)\.(jpe?g|png)$/i.exec(name) }))
  .filter(({ match }) => match && (!only.size || only.has(match[1]!)))
  .map(({ name, match }) => ({ name, file: match![1]!, n: Number(match![2]) }))
  .sort((a, b) => a.file.localeCompare(b.file) || a.n - b.n)
if (!candidates.length) {
  console.error(`No candidates in ${inbox}`)
  process.exit(1)
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

type Result = (typeof candidates)[number] & Inspection & { master: Buffer }
const results: Result[] = []
const queue = [...candidates]
await Promise.all(
  Array.from({ length: Math.min(availableParallelism(), queue.length) }, async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      const file = path.join(inbox, c.name)
      const master = await cutOut(file)
      results.push({ ...c, ...(await inspect(file, master)), master })
    }
  }),
)
results.sort((a, b) => a.file.localeCompare(b.file) || a.n - b.n)

const bySlug = Map.groupBy(results, (r) => r.file)
const slugs = [...bySlug.keys()]
const sheets: string[] = []
for (let k = 0; k * SLUGS_PER_SHEET < slugs.length; k++) {
  const file = path.join(OUT, `sheet-${k + 1}.png`)
  await drawSheet(slugs.slice(k * SLUGS_PER_SHEET, (k + 1) * SLUGS_PER_SHEET), file)
  sheets.push(path.resolve(file))
}

const report = results.map(({ master, ...r }) => ({
  slug: r.file.replace("_", ":"),
  candidate: r.n,
  file: path.join(inbox, r.name),
  flags: r.flags,
  pinkShare: r.pinkShare,
  backgroundNoise: r.backgroundNoise,
  fill: r.fill,
}))
await writeFile(path.join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`)

for (const r of report)
  console.log(`${r.slug} #${r.candidate}  ${r.flags.length ? `⚠ ${r.flags.join(", ")}` : "ok"}  (pink ${(r.pinkShare * 100).toFixed(2)}%, fill ${Math.round(r.fill * 100)}%)`)
console.log(`\n${results.length} candidates for ${slugs.length} slugs. Sheets:\n${sheets.join("\n")}`)

/** One row per slug: label, then per candidate the raw, the cut-out on light and dark, and the cut-out at 24 px. */
async function drawSheet(files: string[], out: string) {
  const perRow = Math.max(...files.map((f) => bySlug.get(f)!.length))
  const label = 200
  const block = CELL * 3 + TINY * ZOOM + 4 * 8
  const rowHeight = CELL + 36
  const width = label + perRow * (block + 16)
  const height = files.length * rowHeight + 8
  const layers: OverlayOptions[] = []
  const texts: string[] = []

  for (const [row, f] of files.entries()) {
    const y = 8 + row * rowHeight
    texts.push(text(12, y + 24, f.replace("_", ":"), 18, 700))
    for (const [col, r] of bySlug.get(f)!.entries()) {
      let x = label + col * (block + 16)
      texts.push(text(x, y + CELL + 24, `#${r.n}  ${r.flags.length ? `⚠ ${r.flags.join(", ")}` : "ok"}`, 15, 600, r.flags.length ? "#c0392b" : "#2e6b45"))
      layers.push({ input: await sharp(path.join(inbox, r.name)).resize(CELL, CELL).png().toBuffer(), left: x, top: y })
      x += CELL + 8
      for (const bg of ["#f7f4ee", "#201e1b"]) {
        layers.push({ input: await onBackground(r.master, CELL, bg), left: x, top: y })
        x += CELL + 8
      }
      // What 24 px actually leaves, enlarged without smoothing.
      const tiny = await sharp(r.master).resize(TINY, TINY).png().toBuffer()
      const zoomed = await sharp(await onBackground(tiny, TINY, "#f7f4ee"))
        .resize(TINY * ZOOM, TINY * ZOOM, { kernel: "nearest" })
        .png()
        .toBuffer()
      layers.push({ input: zoomed, left: x, top: y + (CELL - TINY * ZOOM) / 2 })
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${texts.join("")}</svg>`
  layers.push({ input: Buffer.from(svg), left: 0, top: 0 })
  await sharp({ create: { width, height, channels: 3, background: "#ffffff" } })
    .composite(layers)
    .png()
    .toFile(out)
}

async function onBackground(image: Buffer, size: number, background: string) {
  return sharp(image)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten({ background })
    .png()
    .toBuffer()
}

function text(x: number, y: number, content: string, size: number, weight: number, fill = "#201e1b") {
  const escaped = content.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  return `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escaped}</text>`
}
