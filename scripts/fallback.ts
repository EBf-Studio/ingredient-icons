// Which icon an id shows: its own, else the nearest parent's. Same breadth-first walk
// as findIcon in packages/core, over taxonomy.json's parent graph.

import { readFile } from "node:fs/promises"

import { fileName, iconPath, type Manifest } from "./layout"

export type Parents = Record<string, string[]>

export async function readTaxonomy(): Promise<{ parents: Parents; release: string }> {
  return JSON.parse(await readFile("taxonomy.json", "utf8"))
}

export function iconOf(id: string, icons: Set<string>, parents: Parents) {
  let level = [id]
  const seen = new Set(level)
  for (let depth = 0; depth <= 6 && level.length; depth++) {
    const hit = level.find((candidate) => icons.has(candidate))
    if (hit) return hit
    level = level.flatMap((candidate) => (parents[candidate] ?? []).filter((p) => !seen.has(p) && seen.add(p)))
  }
  return undefined
}

/**
 * What origin/main shows today, read from git rather than from this checkout, whose
 * manifest and icons already hold the batch's own work (a rejected icon is not "today").
 */
export async function onMain() {
  // A stale origin/main would show icons merged since as new ones, or as today's.
  if (!Bun.spawnSync(["git", "fetch", "--quiet", "origin", "main"], { timeout: 60_000 }).success)
    console.log("⚠ git fetch failed: comparing with the origin/main last fetched")
  const show = (file: string) => {
    const result = Bun.spawnSync(["git", "show", `origin/main:${file}`])
    return result.success ? result.stdout : undefined
  }
  const json = (file: string) => {
    const data = show(file)
    if (!data) throw new Error(`No ${file} on origin/main: git fetch origin main`)
    return JSON.parse(data.toString())
  }
  const manifest: Manifest = json("manifest.json")
  const lock: { raws: Record<string, string> } = json("build.lock.json")
  const icons = new Set(Object.keys(manifest.icons))
  const { parents } = await readTaxonomy()
  return {
    icons,
    raws: lock.raws,
    /** The icon an id shows on main, and its 256 px picture. */
    shown(id: string) {
      const hit = iconOf(id, icons, parents)
      const image = hit && show(iconPath("png", 256, fileName(hit)))
      return hit && image ? { id: hit, image: Buffer.from(image) } : undefined
    },
  }
}
