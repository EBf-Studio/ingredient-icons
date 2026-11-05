// The sheet the user reviews in the pull request: per icon this branch adds, rebuilds or
// removes against origin/main, what main shows today, then the new icon on light and dark,
// and at 24 px. Only published files are drawn (no raw), since the pull request is public.
// Run after bun run build: bun run sheet [ids…] (default: every icon whose raw differs from
// origin/main's build.lock.json). Writes .out/sheet/sheet-<k>.png.

import { mkdir, readFile, rm } from "node:fs/promises"
import path from "node:path"
import sharp, { type OverlayOptions } from "sharp"

import { DARK, LIGHT, TINY, ZOOM, onBackground, text, tinyZoomed } from "./draw"
import { onMain } from "./fallback"
import { fileName, iconPath } from "./layout"

const OUT = ".out/sheet"
const ROWS_PER_SHEET = 12
const CELL = 128
const GAP = 12
const LABEL = 210
const ROW = CELL + 16
const HEADER = 34
const MUTED = "#6b665e"

const main = await onMain()
const { raws } = JSON.parse(await readFile("build.lock.json", "utf8")) as { raws: Record<string, string> }

type Status = "new" | "regenerated" | "removed"
const statusOf = (id: string): Status | undefined =>
  !Object.hasOwn(raws, id) ? (main.icons.has(id) ? "removed" : undefined) : !main.icons.has(id) ? "new" : raws[id] !== main.raws[id] ? "regenerated" : undefined

const only = process.argv.slice(2)
const unknown = only.filter((id) => !statusOf(id))
if (unknown.length) throw new Error(`Same as on origin/main, or never built: ${unknown.join(" ")}`)
const ids = (only.length ? only : [...new Set([...Object.keys(raws), ...main.icons])].filter((id) => statusOf(id))).sort()
if (!ids.length) {
  console.error("No icon differs from origin/main")
  process.exit(1)
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })
const files: string[] = []
for (let k = 0; k * ROWS_PER_SHEET < ids.length; k++) {
  const file = path.resolve(OUT, `sheet-${k + 1}.png`)
  await drawSheet(ids.slice(k * ROWS_PER_SHEET, (k + 1) * ROWS_PER_SHEET), file)
  files.push(file)
}
const count = (status: Status) => ids.filter((id) => statusOf(id) === status).length
console.log(`${ids.length} icons against origin/main: ${count("new")} new, ${count("regenerated")} regenerated, ${count("removed")} removed`)
console.log(files.join("\n"))

async function drawSheet(rows: string[], out: string) {
  const columns = [LABEL, CELL, CELL, CELL, TINY * ZOOM]
  const x = columns.map((_, i) => 12 + columns.slice(0, i).reduce((a, b) => a + b + GAP, 0))
  const width = x.at(-1)! + TINY * ZOOM + 12
  const height = HEADER + rows.length * ROW + 8
  const layers: OverlayOptions[] = []
  const texts = [
    text(x[1]!, 22, "today on main", 13, 600, MUTED),
    text(x[2]!, 22, "new, light", 13, 600, MUTED),
    text(x[3]!, 22, "new, dark", 13, 600, MUTED),
    text(x[4]!, 22, "24 px", 13, 600, MUTED),
  ]
  for (const [row, id] of rows.entries()) {
    const y = HEADER + row * ROW
    const status = statusOf(id)!
    const before = main.shown(id)
    texts.push(text(x[0]!, y + 30, id, 16, 700))
    texts.push(text(x[0]!, y + 52, status, 13, 500, status === "new" ? "#2e6b45" : "#a0522d"))
    if (status === "new") texts.push(text(x[0]!, y + 72, before ? `today: ${before.id}` : "today: no icon", 12, 400, MUTED))
    if (before) layers.push({ input: await onBackground(before.image, CELL, LIGHT), left: x[1]!, top: y })
    else texts.push(text(x[1]! + 34, y + CELL / 2 + 5, "no icon", 13, 500, MUTED))
    if (status === "removed") {
      texts.push(text(x[2]! + 30, y + CELL / 2 + 5, "removed", 13, 600, "#a0522d"))
      continue
    }
    const icon = iconPath("png", 256, fileName(id))
    layers.push({ input: await onBackground(icon, CELL, LIGHT), left: x[2]!, top: y })
    layers.push({ input: await onBackground(icon, CELL, DARK), left: x[3]!, top: y })
    layers.push({ input: await tinyZoomed(icon), left: x[4]!, top: y + (CELL - TINY * ZOOM) / 2 })
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${texts.join("")}</svg>`
  layers.push({ input: Buffer.from(svg), left: 0, top: 0 })
  await sharp({ create: { width, height, channels: 3, background: "#ffffff" } })
    .composite(layers)
    .png()
    .toFile(out)
}
