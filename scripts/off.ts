// Downloads the Open Food Facts ingredient taxonomy of an openfoodfacts-server release:
// ingredients.json from its food-taxonomies-json.tgz asset, checked against its digest.

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

const REPO = "openfoodfacts/openfoodfacts-server"
const ASSET = "food-taxonomies-json.tgz"
const FILE = "ingredients.json"

interface Release {
  tag_name: string
  assets: { name: string; browser_download_url: string; digest: string | null }[]
}

export type Entries = Record<string, { parents?: string[]; name?: Record<string, string> }>

const github = async <T>(endpoint: string): Promise<T> => {
  const response = await fetch(`https://api.github.com/repos/${REPO}/${endpoint}`)
  if (!response.ok) throw new Error(`GitHub API ${endpoint}: ${response.status}`)
  return (await response.json()) as T
}

export const sha256 = (data: Uint8Array) => new Bun.CryptoHasher("sha256").update(data).digest("hex")

/** The release taxonomy.json is pinned to, if any. */
export async function pinnedRelease() {
  return readFile("taxonomy.json", "utf8")
    .then((text) => (JSON.parse(text) as { release?: string }).release)
    .catch(() => undefined)
}

/** A release by tag, or the latest one. */
export async function downloadTaxonomy(tag: string | undefined) {
  const release = await github<Release>(!tag || tag === "latest" ? "releases/latest" : `releases/tags/${tag}`)
  const asset = release.assets.find((a) => a.name === ASSET)
  if (!asset) throw new Error(`${release.tag_name} has no ${ASSET}`)
  if (!asset.digest?.startsWith("sha256:")) throw new Error(`${ASSET} of ${release.tag_name} has no sha256 digest`)
  const { sha: commit } = await github<{ sha: string }>(`commits/${release.tag_name}`)

  const download = await fetch(asset.browser_download_url)
  if (!download.ok) throw new Error(`${asset.browser_download_url}: ${download.status}`)
  const archive = new Uint8Array(await download.arrayBuffer())
  if (`sha256:${sha256(archive)}` !== asset.digest) throw new Error(`${ASSET} does not match its digest ${asset.digest}`)

  const dir = await mkdtemp(path.join(tmpdir(), "taxonomy-"))
  try {
    await writeFile(path.join(dir, ASSET), archive)
    const tar = Bun.spawnSync(["tar", "-xzOf", path.join(dir, ASSET), `./${FILE}`], { stderr: "pipe" })
    if (tar.exitCode !== 0) throw new Error(`tar: ${tar.stderr.toString()}`)
    const content = tar.stdout
    return {
      release: release.tag_name,
      commit,
      url: asset.browser_download_url,
      sha256: sha256(content),
      entries: JSON.parse(content.toString()) as Entries,
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
