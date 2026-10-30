// Ids the site renders must still have an icon after a taxonomy update: the build
// throws on one that doesn't, and bun run check doesn't build the site.

import { describe, expect, test } from 'bun:test';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { findIcon, ids } from '@ingredient-icons/core';
import { FALLBACK_PRESETS } from './fallback-presets';

const content = path.join(import.meta.dir, '../content/docs');
const pages = await Promise.all(
  (await readdir(content, { recursive: true }))
    .filter((file) => file.endsWith('.mdx'))
    .map(async (file) => ({ file, text: await readFile(path.join(content, file), 'utf8') })),
);
const cited = (pattern: RegExp) =>
  pages.flatMap(({ file, text }) => [...text.matchAll(pattern)].map((match) => ({ file, list: match[1]! })));

describe('ids cited in the docs', () => {
  test('<Resolves> ids find an icon', () => {
    for (const { file, list: id } of cited(/<Resolves id="([^"]+)"/g)) expect({ file, id, icon: !!findIcon(id) }).toEqual({ file, id, icon: true });
  });

  test('<IconRow> ids have their own icon', () => {
    for (const { file, list } of cited(/<IconRow ids=\{\[([^\]]+)\]\}/g))
      for (const [, id] of list.matchAll(/"([^"]+)"/g)) expect({ file, id, own: ids.includes(id!) }).toEqual({ file, id, own: true });
  });

  test('fallback presets find an icon', () => {
    for (const id of FALLBACK_PRESETS) expect({ id, icon: !!findIcon(id) }).toEqual({ id, icon: true });
  });
});
