// Looks for pink left in the published icons: cuts out every raw of the sources (or the
// ones named), measures it like preview does, and draws those with a pink flag, their
// pink pixels marked, to pick the icons to regenerate.
// Run: bun run audit [id…]
// Writes .out/audit/sheet-<k>.png and prints one line per flagged icon.

import { mkdir, readdir, rm } from "node:fs/promises"
import { availableParallelism } from "node:os"
import path from "node:path"
import sharp, { type OverlayOptions } from "sharp"

import { cutOut } from "./cut-out"
import { DARK, TINY, ZOOM, onBackground, text, tinyZoomed } from "./draw"
import { PINK_FLAGS, inspect, measures, pinkPixels, type Inspection } from "./inspect"
import { sourcesDir } from "./layout"
import { pool } from "./pool"

const OUT = ".out/audit"
const PER_SHEET = 8
const CELL = 320

const raw = path.join(sourcesDir(), "raw")
const published = (await readdir(raw)).filter((name) => name.endsWith(".png")).map((name) => name.slice(0, -4))
const asked = process.argv.slice(2).map((id) => id.replace(/\.png$/, ""))
const unknown = asked.filter((id) => !published.includes(id))
if (unknown.length) console.log(`⚠ No raw in ${raw} for: ${unknown.join(" ")}`)
const ids = asked.length ? asked.filter((id) => published.includes(id)) : published

type Result = Inspection & { id: string; master: Buffer }
const flagged: Result[] = []
const unreadable: string[] = []
let done = 0
await pool(ids, availableParallelism(), async (id) => {
  const file = path.join(raw, `${id}.png`)
  try {
    const master = await cutOut(file)
    const result = await inspect(file, master)
    if (result.flags.some((flag) => PINK_FLAGS.includes(flag))) flagged.push({ ...result, id, master })
  } catch {
    unreadable.push(id)
  }
  if (++done % 100 === 0) console.log(`${done} of ${ids.length}`)
})
flagged.sort((a, b) => a.id.localeCompare(b.id))

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })
const files: string[] = []
for (let k = 0; k * PER_SHEET < flagged.length; k++) {
  const file = path.resolve(OUT, `sheet-${k + 1}.png`)
  await drawSheet(flagged.slice(k * PER_SHEET, (k + 1) * PER_SHEET), file)
  files.push(file)
}

for (const r of flagged) console.log(`${r.id}  ⚠ ${r.flags.join(", ")}  (${measures(r)})`)
if (unreadable.length) console.log(`⚠ Unreadable: ${unreadable.sort().join(" ")}`)
console.log(`\n${flagged.length} of ${ids.length} icons with pink.${files.length ? ` Sheets:\n${files.join("\n")}` : ""}`)

/** Per icon: the cut-out on dark, the same with its pink pixels in green, and at 24 px. */
async function drawSheet(results: Result[], out: string) {
  const lineHeight = CELL + 36
  const width = 2 * CELL + TINY * ZOOM + 4 * 16
  const height = results.length * lineHeight + 8
  const layers: OverlayOptions[] = []
  const texts: string[] = []
  for (const [row, r] of results.entries()) {
    const y = 8 + row * lineHeight
    texts.push(text(16, y + 22, `${r.id}  ⚠ ${r.flags.join(", ")}`, 18, 700, "#c0392b"))
    const { spots, edge, width: w, height: h } = await pinkPixels(r.master)
    const marked = await sharp(r.master).raw().toBuffer()
    for (let i = 0; i < w * h; i++) if (spots[i] || edge[i]) marked.set([0, 255, 0, 255], i * 4)
    const marks = await sharp(marked, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
    let x = 16
    for (const image of [r.master, marks]) {
      layers.push({ input: await onBackground(image, CELL, DARK), left: x, top: y + 32 })
      x += CELL + 16
    }
    layers.push({ input: await tinyZoomed(r.master), left: x, top: y + 32 + (CELL - TINY * ZOOM) / 2 })
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${texts.join("")}</svg>`
  layers.push({ input: Buffer.from(svg), left: 0, top: 0 })
  await sharp({ create: { width, height, channels: 3, background: "#ffffff" } })
    .composite(layers)
    .png()
    .toFile(out)
}
