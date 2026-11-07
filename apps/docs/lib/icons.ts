import { GENERIC_ID } from '@ingredient-icons/core';
import catalogData from './generated/catalog.json';
import data from './generated/icons.json';
import { type FallbackKind, fallbackKind } from './fallback';

export type Language = 'en' | 'fr' | 'es' | 'it' | 'de' | 'pt';

export interface IconEntry {
  /** Catalog id: also the icon's file name and its page's slug. */
  id: string;
  /** English name, or the family's label. */
  name: string;
  names: Partial<Record<Language, string>>;
  /** Every name and synonym in the catalog, in every language. */
  terms: string[];
  parent: string | null;
  /** Null for a family. */
  family: string | null;
  /** The gallery section: its family, or itself for a family. */
  category: string;
  /** Catalog ids that show this icon because they have none of their own. */
  fallbacks: string[];
  aliases: string[];
}

export interface Category {
  key: string;
  title: string;
}

/** A step of a fallback walk, with what the demo shows of it. */
export interface Step {
  id: string;
  name: string;
  family: boolean;
}

export const icons: IconEntry[] = data.icons;
export const categories: Category[] = data.categories;
/** Icons drawn, the generic one aside. */
export const total = icons.length;
export const version: string = data.version;
/** Families and catalog ingredients in catalog.json. */
export const catalogSize: number = data.catalogSize;
export const familyCount: number = data.familyCount;
/** Catalog entries whose walk up their parents reaches an icon. */
export const covered: number = data.covered;
export const nameCoverage = data.nameCoverage as { language: Language; count: number }[];
/** The home demo's preset examples, walked at build time so they render before lookup.json loads. */
export const presets: { id: string; name: string; steps: Step[] }[] = data.presets;

const byId = new Map(icons.map((icon) => [icon.id, icon]));
export const iconById = (id: string) => byId.get(id);
export const categoryTitle = (key: string) => categories.find((c) => c.key === key)?.title ?? key;

interface CatalogInfo {
  name: string;
  family: boolean;
  steps: string[];
}
const catalog: Record<string, CatalogInfo> = catalogData;

/** A catalog entry's English name and walk, or undefined for an id outside the catalog. */
export const catalogEntry = (id: string): CatalogInfo | undefined => catalog[id];

/** The walk from an id to the icon it shows; an id outside the catalog goes straight to the generic icon. */
export const stepsOf = (id: string) => catalog[id]?.steps ?? [id, GENERIC_ID];

/** The id whose icon an ingredient shows: its own, an ancestor's, its family's, or GENERIC_ID. */
export const iconFor = (id: string) => stepsOf(id).at(-1)!;

export const kindOf = (id: string): FallbackKind => fallbackKind(stepsOf(id), (step) => !!catalog[step]?.family);

/** The name the site shows for a catalog id, or the id itself outside the catalog. */
export const nameOf = (id: string) => (id === GENERIC_ID ? 'generic icon' : (catalog[id]?.name ?? id));

export const languageNames: Record<Language, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  de: 'German',
  pt: 'Portuguese',
};

// Helpers with no data attached, safe to import from client components.
export { type Format, iconSrc } from './icon-path';
