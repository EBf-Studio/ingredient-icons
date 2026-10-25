/** What the gallery searches through for each icon. */
export interface SearchableIcon {
  id: string;
  slug: string;
  file: string;
  en: string;
  fr?: string;
  /** Readable English names of the ingredients that fall back to this icon. */
  aliases: string[];
}

/** Lowercase, accents and separators removed: "Échalote" and "en:echalote" both become "echalote". */
export const fold = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-_:]/g, ' ')
    .trim();

export interface IconIndexEntry<T extends SearchableIcon> {
  icon: T;
  names: string[];
  aliases: string[];
}

export function indexIcons<T extends SearchableIcon>(icons: T[]): IconIndexEntry<T>[] {
  return icons.map((icon) => ({
    icon,
    names: [icon.en, icon.fr ?? '', icon.id].map(fold),
    aliases: icon.aliases.map(fold),
  }));
}

/**
 * Icons whose name starts with the query first, then names containing it, then icons
 * reached through an alias ("cherry tomato" finds the tomato, `via` says why).
 */
export function matchIcons<T extends SearchableIcon>(index: IconIndexEntry<T>[], query: string) {
  const needle = fold(query);
  const scored: { icon: T; via?: string; score: number }[] = [];
  if (!needle) return scored;
  for (const { icon, names, aliases } of index) {
    if (names.some((name) => name.startsWith(needle))) scored.push({ icon, score: 0 });
    else if (names.some((name) => name.includes(needle))) scored.push({ icon, score: 1 });
    else {
      const alias = aliases.find((name) => name.includes(needle));
      if (alias) scored.push({ icon, via: alias, score: 2 + alias.length / 100 });
    }
  }
  return scored.sort((a, b) => a.score - b.score);
}
