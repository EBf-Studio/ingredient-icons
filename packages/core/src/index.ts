import { FILES, NAMES, PARENTS, SIZES, VERSION } from "./data.js"

export { STYLE, TAXONOMY_COMMIT, TAXONOMY_RELEASE, VERSION } from "./data.js"

/** Sizes shipped in the package, in pixels, as square WebP files. */
export type IconSize = (typeof SIZES)[number]
export const sizes: readonly IconSize[] = SIZES

/** Every Open Food Facts id that has its own icon. */
export const ids: readonly string[] = Object.keys(FILES)

export interface Icon {
  /** The id whose icon this is: the one asked for, or the closest ancestor that has one. */
  id: string
  /** File name without extension: "en_shallot". */
  file: string
  /** False when the icon is an ancestor's: peeled tomatoes get the tomato. */
  exact: boolean
}

const MAX_DEPTH = 6

/**
 * The icon of an Open Food Facts ingredient id ("en:shallot"), or of its closest
 * ancestor in the taxonomy when it has none of its own.
 */
export function findIcon(id: string): Icon | undefined {
  let level = [id]
  const seen = new Set(level)
  for (let depth = 0; depth <= MAX_DEPTH && level.length; depth++) {
    for (const candidate of level) {
      const file = FILES[candidate]
      if (file) return { id: candidate, file, exact: depth === 0 }
    }
    const next: string[] = []
    for (const candidate of level)
      for (const parent of PARENTS[candidate] ?? [])
        if (!seen.has(parent)) {
          seen.add(parent)
          next.push(parent)
        }
    level = next
  }
  return undefined
}

/** Path of an icon inside the package: "icons/webp/128/en_shallot.webp". */
export function iconPath(id: string, size: IconSize = 128): string | undefined {
  const icon = findIcon(id)
  return icon && `icons/webp/${size}/${icon.file}.webp`
}

/** Default CDN, pinned to this package's version so URLs never change under you. */
export const CDN_URL = `https://cdn.jsdelivr.net/npm/@ingredient-icons/core@${VERSION}`

/**
 * URL of an icon. Pass `baseUrl` to serve the package's `icons/` folder yourself
 * instead of the public CDN.
 */
export function iconUrl(id: string, { size = 128, baseUrl = CDN_URL }: { size?: IconSize; baseUrl?: string } = {}) {
  const relative = iconPath(id, size)
  return relative && `${baseUrl.replace(/\/$/, "")}/${relative}`
}

/** Name of an id that has an icon, from the Open Food Facts taxonomy. */
export function iconName(id: string, locale: "en" | "fr" = "en"): string | undefined {
  return NAMES[id]?.[locale]
}
