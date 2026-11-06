import { CATALOG_RELEASE, IDS, SIZES, VERSION } from "./data.js"

export { CATALOG_RELEASE, STYLE, VERSION } from "./data.js"

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

const has = new Set(IDS)

/**
 * Path of an id's own icon inside the package ("icons/webp/128/shallot.webp"), or undefined
 * when it has none. To fall back on a parent's icon, walk up `parent` in `catalog.json`.
 */
export function iconPath(id: string, size: IconSize = 128): string | undefined {
  return has.has(id) ? `icons/webp/${size}/${id}.webp` : undefined
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

/** Name and synonyms of a catalog entry in one language. */
export interface CatalogNames {
  name?: string
  synonyms: string[]
}

/** A catalog ingredient or a family, in `@ingredient-icons/core/catalog.json`. */
export interface CatalogEntry {
  /** The catalog ingredient or family it falls under; none for a family. */
  parent?: string
  /** The family at the top of its parents; none for a family. */
  family?: string
  /** Per language (fr, en, es, it, de, pt): fr and en reviewed, the others from Wikidata. */
  names: Partial<Record<string, CatalogNames>>
}

/** The shape of `@ingredient-icons/core/catalog.json`, the CC0 snapshot of the ingredient catalog. */
export interface Catalog {
  /** The catalog release it comes from, `CATALOG_RELEASE`. */
  release: string
  license: "CC0-1.0"
  /** Every catalog ingredient and family, by id. */
  entries: Record<string, CatalogEntry>
}
