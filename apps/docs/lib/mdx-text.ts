import { GENERIC_ID } from '@ingredient-icons/core';
import { catalogSize, covered, familyCount, kindOf, languageNames, nameCoverage, stepsOf, total } from './icons';

const VALUES: Record<string, string> = {
  Total: String(total),
  Covered: covered.toLocaleString('en'),
  CatalogSize: catalogSize.toLocaleString('en'),
  FamilyCount: String(familyCount),
};

/** How each end of a fallback walk reads, shared with components/mdx.tsx. */
export const KIND_TEXT = {
  own: 'its own icon',
  ancestor: 'an ancestor’s icon',
  family: 'its family’s icon',
  generic: 'the generic icon',
} as const;

/** "cheese-tortelloni → tortelloni → filled-pasta → pasta" */
export const walkText = (id: string) => stepsOf(id).map((step) => `\`${step}\``).join(' → ');

export function nameCoverageTable() {
  return [
    '| Language | Entries with a name |',
    '| --- | --- |',
    ...nameCoverage.map(({ language, count }) => `| ${languageNames[language]} (\`${language}\`) | ${count.toLocaleString('en')} of ${catalogSize.toLocaleString('en')} |`),
  ].join('\n');
}

/**
 * The docs use a few MDX components (see components/mdx.tsx). Where a page leaves as text,
 * in its Markdown copies (llms.txt, `.md` URLs, "Copy Markdown") and in the search index,
 * the tags stay as written: spell them out instead.
 */
export function spellOutComponents(markdown: string) {
  return markdown
    .replace(/<(Total|Covered|CatalogSize|FamilyCount) \/>/g, (_, name: string) => VALUES[name]!)
    .replace(/<NameCoverage \/>/g, () => nameCoverageTable())
    .replace(/<Resolves id="([^"]+)" \/>/g, (_, id: string) => {
      const kind = kindOf(id);
      if (kind === 'own') return `- \`${id}\` has its own icon`;
      const last = stepsOf(id).at(-1);
      return `- ${walkText(id)}: ${KIND_TEXT[kind]}${last === GENERIC_ID ? ' (`GENERIC_ID`)' : ''}`;
    })
    .replace(/<IconRow ids=\{\[([^\]]+)\]\} \/>/g, (_, list: string) =>
      `Icons: ${[...list.matchAll(/"([^"]+)"/g)].map(([, id]) => `\`${id}\``).join(', ')}.`,
    );
}
