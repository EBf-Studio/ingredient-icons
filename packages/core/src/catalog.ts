// The shape of catalog.json, the CC0 snapshot of the ingredient catalog. Types only, so the
// repository's scripts share them without the generated data.

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
