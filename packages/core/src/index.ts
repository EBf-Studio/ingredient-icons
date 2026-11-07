import { CATALOG_RELEASE, IDS, SIZES, VERSION } from "./data.js"

export { CATALOG_RELEASE, STYLE, VERSION } from "./data.js"
export type { Catalog, CatalogEntry, CatalogNames } from "./catalog.js"

/** Sizes shipped in the package, in pixels, as square WebP files. */
export type IconSize = (typeof SIZES)[number]
export const sizes: readonly IconSize[] = SIZES

/**
 * Id of the generic icon: a cluster of fresh ingredients, for an ingredient that has no icon
 * and no parent with one. Not a catalog id: `iconUrl(id) ?? iconUrl(GENERIC_ID)`.
 */
export const GENERIC_ID = "generic"

/** Every id that has its own icon: catalog ids (every family among them), plus `GENERIC_ID`. */
export const ids: readonly string[] = IDS

const withIcon = new Set(IDS)

/**
 * Path of an id's own icon inside the package ("icons/webp/128/shallot.webp"), or undefined
 * when it has none. To fall back on a parent's icon, walk up `parent` in `catalog.json`.
 */
export function iconPath(id: string, size: IconSize = 128): string | undefined {
  return withIcon.has(id) ? `icons/webp/${size}/${id}.webp` : undefined
}

/** Default CDN, pinned to this package's version so URLs never change under you. */
export const CDN_URL = `https://cdn.jsdelivr.net/npm/@ingredient-icons/core@${VERSION}`

/**
 * URL of an id's own icon, or undefined when it has none. Pass `baseUrl` to serve the
 * package's `icons/` folder yourself instead of the public CDN.
 */
export function iconUrl(id: string, { size = 128, baseUrl = CDN_URL }: { size?: IconSize; baseUrl?: string } = {}) {
  const relative = iconPath(id, size)
  return relative && `${baseUrl.replace(/\/$/, "")}/${relative}`
}
