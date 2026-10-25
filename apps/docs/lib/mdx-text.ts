import { findIcon } from '@ingredient-icons/core';
import { resolvable, total } from './icons';

const VALUES: Record<string, string> = {
  Total: String(total),
  Resolvable: resolvable.toLocaleString('en'),
};

/**
 * The docs use a few MDX components (see components/mdx.tsx). Where a page leaves as text,
 * in its Markdown copies (llms.txt, `.md` URLs, "Copy Markdown") and in the search index,
 * the tags stay as written: spell them out instead.
 */
export function spellOutComponents(markdown: string) {
  return markdown
    .replace(/<(Total|Resolvable) \/>/g, (_, name: string) => VALUES[name]!)
    .replace(/<Resolves id="([^"]+)" \/>/g, (_, id: string) => {
      const icon = findIcon(id)!;
      return icon.exact ? `- \`${id}\` has its own icon` : `- \`${id}\` → \`${icon.id}\``;
    })
    .replace(/<IconRow ids=\{\[([^\]]+)\]\} \/>/g, (_, list: string) =>
      `Icons: ${[...list.matchAll(/"([^"]+)"/g)].map(([, id]) => `\`${id}\``).join(', ')}.`,
    );
}
