// Ids the site quotes must stay true after a catalog release or a batch of icons: the build
// throws on some of them, but bun run check doesn't build the site. This reads the docs,
// the home page and the hand-picked showcases, and checks each id against catalog.json and
// manifest.json, and each commented result of iconFor, iconUrl, iconPath and nameOf.

import { describe, expect, test } from 'bun:test';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { GENERIC_ID, iconPath, ids } from '@ingredient-icons/core';
import catalog from '@ingredient-icons/core/catalog.json';
import { fallbackSteps } from './fallback';
import { FALLBACK_PRESETS } from './fallback-presets';
import { CTA_ICONS, EMOJI_ROWS, OG_ICONS, RECIPE, SHELF_PICKS } from './showcase';
import { logoFile } from './shared';

type Names = Partial<Record<string, { name?: string; synonyms: string[] }>>;
const entries: Record<string, { parent?: string; names: Names }> = catalog.entries;

/** Ids the docs use on purpose as unknown to the catalog, to show the generic icon. */
const NOT_IN_CATALOG = new Set(['unicorn-steak']);

const iconFor = (id: string) => fallbackSteps(id, (at) => entries[at]?.parent, (at) => iconPath(at) !== undefined).at(-1)!;
const nameOf = (id: string, language = 'en') => entries[id]?.names[language]?.name ?? entries[id]?.names.en?.name;
const own = (id: string) => id !== GENERIC_ID && ids.includes(id);

const content = path.join(import.meta.dir, '../content/docs');
const pages = [
  ...(await Promise.all(
    (await readdir(content, { recursive: true }))
      .filter((file) => file.endsWith('.mdx'))
      .map(async (file) => ({ file, text: await readFile(path.join(content, file), 'utf8') })),
  )),
  { file: 'app/(home)/page.tsx', text: await readFile(path.join(import.meta.dir, '../app/(home)/page.tsx'), 'utf8') },
];
const cited = (pattern: RegExp) =>
  pages.flatMap(({ file, text }) => [...text.matchAll(pattern)].map((match) => ({ file, match })));

describe('ids cited in the docs', () => {
  test('<Resolves> ids are catalog ids', () => {
    for (const { file, match } of cited(/<Resolves id="([^"]+)"/g))
      expect({ file, id: match[1], inCatalog: !!entries[match[1]!] }).toEqual({ file, id: match[1], inCatalog: true });
  });

  test('<IconRow> ids have their own icon', () => {
    for (const { file, match } of cited(/<IconRow ids=\{\[([^\]]+)\]\}/g))
      for (const [, id] of match[1]!.matchAll(/"([^"]+)"/g)) expect({ file, id, own: own(id!) }).toEqual({ file, id, own: true });
  });

  test('ids passed to the functions are catalog ids, or deliberately unknown ones', () => {
    for (const { file, match } of cited(/\b(?:iconFor|iconUrl|iconPath|nameOf|icon_for)\("([^"]+)"|\bid="([^"]+)"|entries\["([^"]+)"\]/g)) {
      const id = (match[1] ?? match[2] ?? match[3])!;
      const known: boolean = id === GENERIC_ID || id in entries;
      expect({ file, id, known }).toEqual({ file, id, known: !NOT_IN_CATALOG.has(id) });
    }
  });

  test('iconFor comments show what the fallback returns', () => {
    for (const { file, match } of cited(/\b(?:iconFor|icon_for)\("([^"]+)"\)\s*(?:\/\/|#)\s*"([^"]+)"/g))
      expect({ file, id: match[1], icon: iconFor(match[1]!) }).toEqual({ file, id: match[1], icon: match[2] });
  });

  test('iconUrl and iconPath comments show whether the id has its own icon', () => {
    for (const { file, match } of cited(/\b(?:iconUrl|iconPath)\("([^"]+)"[^)\n]*\)\s*\n?\s*\/\/ ([^\n]*)/g)) {
      const [, id, comment] = match as unknown as [string, string, string];
      if (comment.startsWith('undefined')) expect({ file, id, own: own(id) }).toEqual({ file, id, own: false });
      else if (comment.includes('.webp')) expect({ file, id, file_: comment.includes(`/${id}.webp`), own: own(id) }).toEqual({ file, id, file_: true, own: true });
    }
  });

  test('nameOf comments show the catalog names', () => {
    for (const { file, match } of cited(/\bnameOf\("([^"]+)"(?:, "([a-z]{2})")?\)\s*\/\/\s*"([^"]+)"/g))
      expect({ file, id: match[1], name: nameOf(match[1]!, match[2]) }).toEqual({ file, id: match[1], name: match[3] });
  });
});

describe('ids the site picks by hand', () => {
  test('fallback presets are catalog ids', () => {
    for (const id of FALLBACK_PRESETS) expect({ id, inCatalog: !!entries[id] }).toEqual({ id, inCatalog: true });
  });

  test('showcased icons exist', () => {
    const showcased = [...EMOJI_ROWS.flatMap((row) => row.ids), ...SHELF_PICKS, ...CTA_ICONS, ...OG_ICONS, logoFile];
    for (const id of showcased) expect({ id, own: own(id) }).toEqual({ id, own: true });
  });

  test('the recipe card uses catalog ids', () => {
    for (const { id } of RECIPE) expect({ id, inCatalog: !!entries[id] }).toEqual({ id, inCatalog: true });
  });
});
