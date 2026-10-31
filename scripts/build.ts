// Builds the icons from the private sources: cut-out, every size and format,
// manifest.json, build.lock.json, and a review page in .out/. Only icons whose
// raw changed since the last build (per build.lock.json) are rebuilt, in parallel.
// Output is deterministic, so an unchanged raw leaves its files untouched in git.
// Run: bun run build [--force] (sources: see sourcesDir in layout.ts)

import { existsSync } from "node:fs"
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { availableParallelism } from "node:os"
import path from "node:path"
import sharp from "sharp"

import { cutOut } from "./cut-out"
import {
  ICONS_DIR,
  PATH_TEMPLATE,
  SIZES,
  STYLE_VERSION,
  fileName,
  iconPath,
  sourcesDir,
  type Format,
  type Manifest,
} from "./layout"

const ENCODING = {
  png: { compressionLevel: 9, effort: 10 },
  webp: { quality: 90, alphaQuality: 100, effort: 6 },
} as const
const LOCK = "build.lock.json"

/** The raw each icon was built from, and the pipeline that built it. */
interface Lock {
  pipeline: string
  raws: Record<string, string>
}

const sha256 = (data: string | Uint8Array) => new Bun.CryptoHasher("sha256").update(data).digest("hex")

const force = process.argv.includes("--force")
const sources = sourcesDir()
const subjects: { slug: string }[] = JSON.parse(await readFile(path.join(sources, "subjects.json"), "utf8"))
const rawFiles = new Set(await readdir(path.join(sources, "raw")))
const lock: Lock = await readFile(LOCK, "utf8").then(JSON.parse, () => ({ pipeline: "", raws: {} }))
const pipeline = sha256(
  (await readFile(new URL("./cut-out.ts", import.meta.url), "utf8")) + JSON.stringify({ ENCODING, SIZES }),
)

const ids: string[] = []
const missing: string[] = []
const raws: Lock["raws"] = {}
for (const { slug: id } of [...subjects].sort((a, b) => a.slug.localeCompare(b.slug))) {
  if (!rawFiles.has(`${fileName(id)}.png`)) missing.push(id)
  else {
    ids.push(id)
    raws[id] = sha256(await readFile(rawPath(id)))
  }
}

const outputs = (id: string) =>
  (Object.keys(SIZES) as Format[]).flatMap((format) => SIZES[format].map((size) => iconPath(format, size, fileName(id))))
const stale = ids.filter(
  (id) => force || lock.pipeline !== pipeline || lock.raws[id] !== raws[id] || !outputs(id).every((file) => existsSync(file)),
)

for (const [format, sizes] of Object.entries(SIZES))
  for (const size of sizes) await mkdir(path.join(ICONS_DIR, format, String(size)), { recursive: true })

let done = 0
await pool(stale, availableParallelism(), async (id) => {
  const master = await cutOut(rawPath(id))
  for (const format of Object.keys(SIZES) as Format[])
    for (const size of SIZES[format]) {
      const resized = sharp(master).resize(size, size)
      const out = format === "png" ? resized.png(ENCODING.png) : resized.webp(ENCODING.webp)
      await out.toFile(iconPath(format, size, fileName(id)))
    }
  if (++done % 25 === 0) console.log(`${done}/${stale.length}`)
})

// Files of icons that no longer have a subject or a raw.
const files = new Set(ids.map(fileName))
const orphans: string[] = []
for (const [format, sizes] of Object.entries(SIZES))
  for (const size of sizes) {
    const dir = path.join(ICONS_DIR, format, String(size))
    for (const name of await readdir(dir))
      if (!files.has(path.basename(name, `.${format}`))) {
        orphans.push(path.join(dir, name))
        await rm(path.join(dir, name))
      }
  }

const icons: Manifest["icons"] = Object.fromEntries(ids.map((id) => [id, { file: fileName(id) }]))
const manifest: Manifest = { style: STYLE_VERSION, sizes: SIZES, path: PATH_TEMPLATE, icons }
await writeFile("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`)
await writeFile(LOCK, `${JSON.stringify({ pipeline, raws } satisfies Lock, null, 2)}\n`)

await mkdir(".out", { recursive: true })
await writeFile(".out/review.html", reviewPage(stale.length ? stale : ids))

console.log(`${ids.length} icons, ${stale.length} rebuilt${stale.length && stale.length <= 60 ? `: ${stale.join(" ")}` : ""}`)
if (orphans.length) console.log(`Removed ${orphans.length} files of icons without a raw or subject`)
if (missing.length) console.log(`${missing.length} subjects without a raw: ${missing.join(" ")}`)
warnUnpushed(sources)
console.log(`Review (${stale.length ? "rebuilt icons" : "every icon"}): ${path.resolve(".out/review.html")}`)

function rawPath(id: string) {
  return path.join(sources, "raw", `${fileName(id)}.png`)
}

async function pool<T>(items: T[], size: number, run: (item: T) => Promise<void>) {
  const queue = [...items]
  await Promise.all(
    Array.from({ length: Math.min(size, queue.length) }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await run(item)
    }),
  )
}

/** The icons are only as safe as their raws: say when the sources aren't on GitHub yet. */
function warnUnpushed(dir: string) {
  const git = (...args: string[]) => Bun.spawnSync(["git", "-C", dir, ...args]).stdout.toString().trim()
  const dirty = git("status", "--porcelain", "--", "raw", "subjects.json")
  const ahead = git("rev-list", "--count", "@{upstream}..HEAD")
  if (dirty) console.log(`⚠ ingredient-icons-sources has uncommitted raws or subjects:\n${dirty}`)
  if (ahead && ahead !== "0") console.log(`⚠ ingredient-icons-sources has ${ahead} commit(s) not pushed`)
}

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
