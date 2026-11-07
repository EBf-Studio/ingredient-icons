/** What the gallery and the ⌘K dialog search through for each icon. */
export interface SearchableIcon {
  id: string;
  /** English name, or the family's label. */
  name: string;
  fr?: string;
  /** Every catalog name and synonym of the icon's ingredient, in every language. */
  terms: string[];
  /** Names of the catalog ingredients that show this icon because they have none of their own. */
  aliases: string[];
}

/** Lowercase, accents and separators removed: "Échalote" and "pork-sausage" become "echalote" and "pork sausage". */
export const fold = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-_:'’]/g, ' ')
    .trim();

export interface IconIndexEntry<T extends SearchableIcon> {
  icon: T;
  names: string[];
  terms: string[];
  aliases: { folded: string; text: string }[];
}

export function indexIcons<T extends SearchableIcon>(icons: T[]): IconIndexEntry<T>[] {
  return icons.map((icon) => ({
    icon,
    names: [icon.name, icon.fr ?? '', icon.id].map(fold),
    terms: icon.terms.map(fold),
    aliases: icon.aliases.map((text) => ({ folded: fold(text), text })),
  }));
}

/**
 * Icons whose name starts with the query first, then ones whose name or synonym (in any
 * language) contains it, then icons reached through an ingredient that borrows them
 * ("smoked lardons" finds the icon they show, `via` says why).
 */
export function matchIcons<T extends SearchableIcon>(index: IconIndexEntry<T>[], query: string) {
  const needle = fold(query);
  const scored: { icon: T; via?: string; score: number }[] = [];
  if (!needle) return scored;
  for (const { icon, names, terms, aliases } of index) {
    if (names.some((name) => name.startsWith(needle))) scored.push({ icon, score: 0 });
    else if (terms.some((term) => term.startsWith(needle))) scored.push({ icon, score: 0.5 });
    else if ([...names, ...terms].some((name) => name.includes(needle))) scored.push({ icon, score: 1 });
    else {
      const alias = aliases.find(({ folded }) => folded.includes(needle));
      if (alias) scored.push({ icon, via: alias.text, score: 2 + alias.folded.length / 100 });
    }
  }
  return scored.sort((a, b) => a.score - b.score);
}

/** Window event the ⌘K dialog sends to an already open gallery, with the query as detail. */
export const GALLERY_SEARCH_EVENT = 'gallery-search';
