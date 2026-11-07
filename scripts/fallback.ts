// What origin/main shows today, for the review sheets: which icon each id falls back on is
// iconOf in catalog.ts, over the catalog's parents.

import { iconOf, readCatalog } from "./catalog"
import { iconPath, type Manifest } from "./layout"

/**
 * What origin/main shows today: its icons, read from git rather than from this checkout, whose
 * manifest and icons already hold the batch's own work (a rejected icon is not "today"). The
 * walk uses this checkout's catalog.json, so a catalog refresh in the batch shows on both sides.
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
  const catalog = await readCatalog()
  return {
    icons,
    raws: lock.raws,
    /** The icon an id shows on main, and its 256 px picture. */
    shown(id: string) {
      const hit = iconOf(id, icons, catalog)
      const image = hit && show(iconPath("png", 256, hit))
      return hit && image ? { id: hit, image: Buffer.from(image) } : undefined
    },
  }
}
