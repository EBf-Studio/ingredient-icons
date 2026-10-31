import { existsSync } from "node:fs"
import path from "node:path"

/** Where every published file lives; the manifest repeats it for consumers. */
export const SIZES = { png: [64, 128, 256, 512], webp: [64, 128, 256] } as const
export type Format = keyof typeof SIZES

export const ICONS_DIR = "icons"
export const PATH_TEMPLATE = `${ICONS_DIR}/{format}/{size}/{file}.{format}`

export const iconPath = (format: Format, size: number, file: string) =>
  path.join(ICONS_DIR, format, String(size), `${file}.${format}`)

/** "en:olive-oil" → "en_olive-oil": file names can't hold a colon on every system. */
export const fileName = (id: string) => id.replace(":", "_")
export const idOf = (file: string) => file.replace("_", ":")

export const sha256 = (data: string | Uint8Array) => new Bun.CryptoHasher("sha256").update(data).digest("hex")

/** A candidate waiting in the sources' inbox/: `<file>.<n>.<jpg|png>` (en:honey, candidate 2 → en_honey.2.jpg). */
export function parseCandidate(name: string) {
  const match = /^(.+)\.(\d+)\.(jpe?g|png)$/i.exec(name)
  return match ? { name, file: match[1]!, n: Number(match[2]) } : undefined
}

/**
 * The private sources checkout: raw/, subjects.json, style.txt, inbox/.
 * $INGREDIENT_ICONS_SOURCES, else ingredient-icons-sources next to this checkout,
 * else next to the main checkout when this one is a git worktree.
 */
export function sourcesDir() {
  const fromEnv = process.env.INGREDIENT_ICONS_SOURCES
  if (fromEnv) return path.resolve(fromEnv)
  const common = Bun.spawnSync(["git", "rev-parse", "--path-format=absolute", "--git-common-dir"]).stdout.toString().trim()
  const candidates = [path.resolve("../ingredient-icons-sources")]
  if (common) candidates.push(path.resolve(path.dirname(common), "../ingredient-icons-sources"))
  const found = candidates.find((dir) => existsSync(path.join(dir, "subjects.json")))
  if (!found) throw new Error(`ingredient-icons-sources not found (tried ${candidates.join(", ")}): set INGREDIENT_ICONS_SOURCES`)
  return found
}

/** Bumped when the prompt changes enough that old and new icons no longer match. */
export const STYLE_VERSION = 1

export interface Manifest {
  style: number
  sizes: typeof SIZES
  path: string
  icons: Record<string, { file: string }>
}
