import data from './generated/icons.json';

export interface IconEntry {
  id: string;
  file: string;
  slug: string;
  en: string;
  fr?: string;
  category: string;
  parents: string[];
  fallbacks: string[];
}

export interface Category {
  key: string;
  title: string;
}

export const icons: IconEntry[] = data.icons;
export const categories: Category[] = data.categories;
export const total = icons.length;
export const version: string = data.version;
export const taxonomyCommit: string = data.taxonomyCommit;
export const taxonomySize: number = data.taxonomySize;
export const resolvable: number = data.resolvable;

const byId = new Map(icons.map((icon) => [icon.id, icon]));
const bySlug = new Map(icons.map((icon) => [icon.slug, icon]));

export const iconById = (id: string) => byId.get(id);
export const iconBySlug = (slug: string) => bySlug.get(slug);
export const categoryTitle = (key: string) => categories.find((c) => c.key === key)?.title ?? key;

// Helpers with no data attached, safe to import from client components.
export { type Format, iconSrc, readableId } from './icon-path';
