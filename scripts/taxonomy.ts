// Pins the Open Food Facts ingredient taxonomy and writes taxonomy.json: every
// entry's parents (so an id without an icon can fall back on an ancestor's) and
// the English and French names of the ids that have an icon.
// Run: bun run taxonomy [tag] (after a build that adds icons; defaults to the latest release)
//
// The source is ingredients.json from the food-taxonomies-json.tgz asset of an
// openfoodfacts-server release: the taxonomy Open Food Facts parses itself, with
// parents already resolved to ids. The recipe repository reads the same asset:
// move both to a new release together, so their ids stay the same.

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import type { Manifest } from "./layout"

const REPO = "openfoodfacts/openfoodfacts-server"
const ASSET = "food-taxonomies-json.tgz"
const FILE = "ingredients.json"
const LOCALES = ["en", "fr"] as const

interface Release {
  tag_name: string
  assets: { name: string; browser_download_url: string; digest: string | null }[]
}

type Taxonomy = Record<string, { parents?: string[]; name?: Record<string, string> }>

const github = async <T>(endpoint: string): Promise<T> => {
  const response = await fetch(`https://api.github.com/repos/${REPO}/${endpoint}`)
  if (!response.ok) throw new Error(`GitHub API ${endpoint}: ${response.status}`)
  return (await response.json()) as T
}

const sha256 = (data: Uint8Array) => new Bun.CryptoHasher("sha256").update(data).digest("hex")

const tag = process.argv[2]
const release = await github<Release>(tag ? `releases/tags/${tag}` : "releases/latest")
const asset = release.assets.find((a) => a.name === ASSET)
if (!asset) throw new Error(`${release.tag_name} has no ${ASSET}`)
if (!asset.digest?.startsWith("sha256:")) throw new Error(`${ASSET} of ${release.tag_name} has no sha256 digest`)
const { sha: commit } = await github<{ sha: string }>(`commits/${release.tag_name}`)

const download = await fetch(asset.browser_download_url)
if (!download.ok) throw new Error(`${asset.browser_download_url}: ${download.status}`)
const archive = new Uint8Array(await download.arrayBuffer())
if (`sha256:${sha256(archive)}` !== asset.digest) throw new Error(`${ASSET} does not match its digest ${asset.digest}`)

const dir = await mkdtemp(path.join(tmpdir(), "taxonomy-"))
const content = await (async () => {
  try {
    await writeFile(path.join(dir, ASSET), archive)
    const tar = Bun.spawnSync(["tar", "-xzOf", path.join(dir, ASSET), `./${FILE}`], { stderr: "pipe" })
    if (tar.exitCode !== 0) throw new Error(`tar: ${tar.stderr.toString()}`)
    return tar.stdout
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})()
const entries: Taxonomy = JSON.parse(content.toString())

const manifest: Manifest = JSON.parse(await readFile("manifest.json", "utf8"))
const unknown = Object.keys(manifest.icons).filter((id) => !entries[id])

const parents: Record<string, string[]> = {}
for (const id of Object.keys(entries).sort((a, b) => a.localeCompare(b))) {
  const entryParents = entries[id]!.parents
  if (entryParents?.length) parents[id] = entryParents
}

const names: Record<string, Partial<Record<(typeof LOCALES)[number], string>>> = {}
for (const id of Object.keys(manifest.icons).sort()) {
  const name = entries[id]?.name
  if (!name) continue
  names[id] = Object.fromEntries(LOCALES.flatMap((l) => (name[l] ? [[l, name[l]]] : [])))
}

const taxonomy = {
  source: "Open Food Facts ingredients taxonomy",
  release: release.tag_name,
  commit,
  url: asset.browser_download_url,
  sha256: sha256(content),
  license: "ODbL-1.0",
  parents,
  names,
}
await writeFile("taxonomy.json", `${JSON.stringify(taxonomy, null, 2)}\n`)
console.log(`${Object.keys(entries).length} taxonomy entries in ${release.tag_name}, ${Object.keys(names).length} named`)
if (unknown.length) console.log(`Not in the taxonomy: ${unknown.join(" ")}`)
