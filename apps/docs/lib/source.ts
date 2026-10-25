import { llms, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { defineDocs } from 'fumadocs-mdx/macro';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { spellOutComponents } from './mdx-text';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    // Collection-level options replace the Fumadocs preset unless passed through it.
    mdxOptions: applyMdxPreset({
      remarkStructureOptions: {
        // Keep these tags in the search index (Fumadocs' defaults plus the numbers that
        // app/api/search/route.ts spells out), instead of dropping them from the text.
        filterElement: (node) => ['File', 'TypeTable', 'Callout', 'Card', 'Total', 'Resolvable'].includes(node.name ?? ''),
      },
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${spellOutComponents(await page.data.getText('processed'))}`,
});
