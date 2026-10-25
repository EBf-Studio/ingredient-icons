import { createFromSource } from 'fumadocs-core/search/server';
import { spellOutComponents } from '@/lib/mdx-text';
import { source } from '@/lib/source';

export const { GET } = createFromSource(source, {
  // Excerpts are cut from the MDX source, so `<Total />` would show up as is.
  buildIndex(page) {
    const { structuredData } = page.data;
    return {
      id: page.url,
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      structuredData: {
        headings: structuredData.headings,
        contents: structuredData.contents.map((block) => ({ ...block, content: spellOutComponents(block.content) })),
      },
    };
  },
});
