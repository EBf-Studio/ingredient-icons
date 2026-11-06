// Prepares the review of freshly generated candidates, before any of them reaches raw/:
// cuts out every image of the sources' inbox/, flags what a pixel count catches better
// than an eye, and draws contact sheets to look at, with the icon each slug shows on main.
// Run: bun run preview [slug…] (default: every candidate in inbox/)
// Writes .out/preview/sheet-<k>.png and prints one line per candidate.

import { existsSync } from "node:fs"
import { mkdir, readdir, rm } from "node:fs/promises"
import { availableParallelism } from "node:os"
import path from "node:path"
import sharp, { type OverlayOptions } from "sharp"

import { cutOut } from "./cut-out"
import { LIGHT, DARK, TINY, ZOOM, onBackground, text, tinyZoomed } from "./draw"
import { onMain } from "./fallback"
import { inspect, type Inspection } from "./inspect"
import { parseCandidate, sourcesDir } from "./layout"
import { pool } from "./pool"

const OUT = ".out/preview"
const LINES_PER_SHEET = 6
const CANDIDATES_PER_LINE = 2
const CELL = 192
const TODAY = 96

const sources = sourcesDir()
const inbox = path.join(sources, "inbox")
// Grok's working directory is this checkout: a relative inbox/ lands here, out of the sources.
const stray = path.resolve("inbox")
if (stray !== inbox && existsSync(stray))
  console.log(`⚠ ${stray} exists: candidates written there are not reviewed. Move them to ${inbox}, then delete it`)
const only = new Set(process.argv.slice(2))
const names = (await readdir(inbox).catch(() => [] as string[])).filter((name) => !name.startsWith("."))
const unmatched = names.filter((name) => !parseCandidate(name))
const candidates = names
  .flatMap((name) => parseCandidate(name) ?? [])
  .filter((c) => !only.size || only.has(c.file))
  .sort((a, b) => a.file.localeCompare(b.file) || a.n - b.n)
if (unmatched.length) console.log(`⚠ Not named <file>.<n>.<jpg|png|webp>, skipped: ${unmatched.join(" ")}`)
if (!candidates.length) {
  console.error(`No candidates in ${inbox}`)
  process.exit(1)
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

type Result = (typeof candidates)[number] & ((Inspection & { master: Buffer }) | { flags: ["unreadable"]; master?: undefined })
const results: Result[] = []
await pool(candidates, availableParallelism(), async (c) => {
  const file = path.join(inbox, c.name)
  try {
    const master = await cutOut(file)
    results.push({ ...c, ...(await inspect(file, master)), master })
  } catch {
    results.push({ ...c, flags: ["unreadable"] })
  }
})
results.sort((a, b) => a.file.localeCompare(b.file) || a.n - b.n)
const main = await onMain()

// Lines of candidates, a slug's lines kept on one sheet.
const lines = [...Map.groupBy(results, (r) => r.file).values()].map((group) =>
  Array.from({ length: Math.ceil(group.length / CANDIDATES_PER_LINE) }, (_, i) =>
    group.slice(i * CANDIDATES_PER_LINE, (i + 1) * CANDIDATES_PER_LINE),
  ),
)
const sheets: Result[][][] = [[]]
for (const slugLines of lines) {
  if (sheets.at(-1)!.length && sheets.at(-1)!.length + slugLines.length > LINES_PER_SHEET) sheets.push([])
  sheets.at(-1)!.push(...slugLines)
}
const files: string[] = []
for (const [k, sheet] of sheets.entries()) {
  const file = path.resolve(OUT, `sheet-${k + 1}.png`)
  await drawSheet(sheet, file)
  files.push(file)
}

for (const r of results) {
  const measures = r.master ? `  (magenta ${(r.pinkShare * 100).toFixed(2)}%, fill ${Math.round(r.fill * 100)}%)` : ""
  console.log(`${r.file} #${r.n}  ${r.flags.length ? `⚠ ${r.flags.join(", ")}` : "ok"}${measures}`)
}
console.log(`\n${results.length} candidates for ${lines.length} slugs. Sheets:\n${files.join("\n")}`)

/** Per candidate: the raw, the cut-out on light and dark, and the cut-out at 24 px enlarged. The slug starts its first line. */
async function drawSheet(sheetLines: Result[][], out: string) {
  const label = 200
  const block = CELL * 3 + TINY * ZOOM + 4 * 8
  const lineHeight = CELL + 36
  const width = label + CANDIDATES_PER_LINE * (block + 16)
  const height = sheetLines.length * lineHeight + 8
  const layers: OverlayOptions[] = []
  const texts: string[] = []

  for (const [row, line] of sheetLines.entries()) {
    const y = 8 + row * lineHeight
    const id = line[0]!.file
    if (line[0]!.n === Math.min(...results.filter((r) => r.file === line[0]!.file).map((r) => r.n))) {
      texts.push(text(12, y + 24, id, 18, 700))
      const shown = main.shown(id)
      if (shown) layers.push({ input: await onBackground(shown.image, TODAY, LIGHT), left: 12, top: y + 40 })
      texts.push(text(12, y + 40 + TODAY + 20, shown ? `today: ${shown.id}` : "today: no icon", 13, 500, "#6b665e"))
    }
    for (const [col, r] of line.entries()) {
      let x = label + col * (block + 16)
      texts.push(text(x, y + CELL + 24, `#${r.n}  ${r.flags.length ? `⚠ ${r.flags.join(", ")}` : "ok"}`, 15, 600, r.flags.length ? "#c0392b" : "#2e6b45"))
      if (!r.master) continue
      layers.push({ input: await sharp(path.join(inbox, r.name)).resize(CELL, CELL).png().toBuffer(), left: x, top: y })
      x += CELL + 8
      for (const bg of [LIGHT, DARK]) {
        layers.push({ input: await onBackground(r.master, CELL, bg), left: x, top: y })
        x += CELL + 8
      }
      layers.push({ input: await tinyZoomed(r.master), left: x, top: y + (CELL - TINY * ZOOM) / 2 })
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${texts.join("")}</svg>`
  layers.push({ input: Buffer.from(svg), left: 0, top: 0 })
  await sharp({ create: { width, height, channels: 3, background: "#ffffff" } })
    .composite(layers)
    .png()
    .toFile(out)
}
