// Builds the icons from the private sources: cut-out, every size and format,
// manifest.json, build.lock.json, and a review page in .out/. Only icons whose raw
// changed since the last build (per build.lock.json) are rebuilt; their encodings run
// in parallel. Output is deterministic, so an unchanged raw leaves its files untouched.
// Run: bun run build [--force] [--prune] (sources: see sourcesDir in layout.ts)
//   --force rebuilds every icon; --prune lets icons already in manifest.json go
//   when their raw or subject is gone.

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
import { sha256 } from "./off"
import { pool } from "./pool"

const RESIZE = { kernel: "lanczos3" } as const
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

const force = process.argv.includes("--force")
const prune = process.argv.includes("--prune")
const sources = sourcesDir()
warnOutOfSync(sources)

const subjects: { slug: string }[] = JSON.parse(await readFile(path.join(sources, "subjects.json"), "utf8"))
const duplicates = subjects.map((s) => s.slug).filter((slug, i, all) => all.indexOf(slug) !== i)
if (duplicates.length) throw new Error(`Duplicate slugs in subjects.json: ${duplicates.join(" ")}`)

const rawFiles = new Set(await readdir(path.join(sources, "raw")))
const lock: Lock = await readFile(LOCK, "utf8").then(JSON.parse, () => ({ pipeline: "", raws: {} }))
const published: Manifest = await readFile("manifest.json", "utf8").then(JSON.parse, () => ({ icons: {} }))
// Everything that decides the output: a change rebuilds every icon.
const pipeline = sha256(
  new TextEncoder().encode(
    (await readFile(new URL("./cut-out.ts", import.meta.url), "utf8")) +
      JSON.stringify({ RESIZE, ENCODING, SIZES, sharp: sharp.versions }),
  ),
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

const dropped = Object.keys(published.icons).filter((id) => !Object.hasOwn(raws, id))
if (dropped.length && !prune)
  throw new Error(
    `${dropped.length} published icons have no raw or subject in ${sources}: ${dropped.join(" ")}\n` +
      "Pull the sources (git pull), or pass --prune to remove these icons.",
  )

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
      const resized = sharp(master).resize(size, size, RESIZE)
      const out = format === "png" ? resized.png(ENCODING.png) : resized.webp(ENCODING.webp)
      await out.toFile(iconPath(format, size, fileName(id)))
    }
  if (++done % 25 === 0) console.log(`${done}/${stale.length}`)
})

// Files of icons that no longer have a subject or a raw, and folders of formats or sizes no longer built.
const files = new Set(ids.map(fileName))
const removed: string[] = []
for (const format of await readdir(ICONS_DIR)) {
  const sizes: readonly number[] = SIZES[format as Format] ?? []
  for (const size of await readdir(path.join(ICONS_DIR, format)).catch(() => [])) {
    const dir = path.join(ICONS_DIR, format, size)
    if (!sizes.includes(Number(size))) {
      removed.push(dir)
      await rm(dir, { recursive: true, force: true })
      continue
    }
    for (const name of await readdir(dir))
      if (!files.has(path.basename(name, `.${format}`))) {
        removed.push(path.join(dir, name))
        await rm(path.join(dir, name))
      }
  }
}

const icons: Manifest["icons"] = Object.fromEntries(ids.map((id) => [id, { file: fileName(id) }]))
const manifest: Manifest = { style: STYLE_VERSION, sizes: SIZES, path: PATH_TEMPLATE, icons }
await writeFile("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`)
await writeFile(LOCK, `${JSON.stringify({ pipeline, raws } satisfies Lock, null, 2)}\n`)

await mkdir(".out", { recursive: true })
await writeFile(".out/review.html", reviewPage(stale.length ? stale : ids))

console.log(`${ids.length} icons, ${stale.length} rebuilt${stale.length && stale.length <= 60 ? `: ${stale.join(" ")}` : ""}`)
if (dropped.length) console.log(`Pruned ${dropped.length} icons: ${dropped.join(" ")}`)
if (removed.length) console.log(`Removed ${removed.length} files or folders no longer built`)
if (missing.length) console.log(`${missing.length} subjects without a raw: ${missing.join(" ")}`)
console.log(`Review (${stale.length ? "rebuilt icons" : "every icon"}): ${path.resolve(".out/review.html")}`)

function rawPath(id: string) {
  return path.join(sources, "raw", `${fileName(id)}.png`)
}

/** The icons are only as safe as their raws, and only as fresh as the checkout they're built from. */
function warnOutOfSync(dir: string) {
  const git = (...args: string[]) =>
    Bun.spawnSync(["git", "-C", dir, ...args], { timeout: 20_000 }).stdout.toString().trim()
  git("fetch", "--quiet")
  const dirty = git("status", "--porcelain", "--", "raw", "subjects.json")
  const ahead = git("rev-list", "--count", "@{upstream}..HEAD")
  const behind = git("rev-list", "--count", "HEAD..@{upstream}")
  if (dirty) console.log(`⚠ ingredient-icons-sources has uncommitted raws or subjects:\n${dirty}`)
  if (ahead && ahead !== "0") console.log(`⚠ ingredient-icons-sources has ${ahead} commit(s) not pushed`)
  if (behind && behind !== "0") console.log(`⚠ ingredient-icons-sources is ${behind} commit(s) behind: git pull first`)
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
