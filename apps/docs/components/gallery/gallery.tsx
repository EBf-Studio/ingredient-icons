'use client';

import { Check, Copy, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useCopy } from '@/components/copy-button';
import { IconImage } from '@/components/icon-image';
import { cn } from '@/lib/cn';
import type { Category } from '@/lib/icons';
import { fold, GALLERY_SEARCH_EVENT, indexIcons, matchIcons, type SearchableIcon } from '@/lib/icon-search';
import { newIssueUrl } from '@/lib/shared';

export interface GalleryIcon extends SearchableIcon {
  category: string;
}

type Density = 'cozy' | 'compact';

export function Gallery({ icons, categories }: { icons: GalleryIcon[]; categories: Category[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>();
  const [density, setDensity] = useState<Density>('cozy');
  const deferred = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // The ⌘K dialog links here with ?q= to show every match. When the gallery is already
  // open, the navigation does not remount it, so the dialog also sends the query as an event.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setQuery(q);
    const onSearch = (event: Event) => setQuery((event as CustomEvent<string>).detail);
    window.addEventListener(GALLERY_SEARCH_EVENT, onSearch);
    return () => window.removeEventListener(GALLERY_SEARCH_EVENT, onSearch);
  }, []);

  // "/" jumps to search, as on most icon sites.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === '/' && !target.closest('input, textarea, [contenteditable]')) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const index = useMemo(() => indexIcons(icons), [icons]);

  const results = useMemo(() => {
    const inCategory = index.filter(({ icon }) => !category || icon.category === category);
    if (!fold(deferred)) return inCategory.map(({ icon }) => ({ icon, via: undefined as string | undefined }));
    return matchIcons(inCategory, deferred);
  }, [index, deferred, category]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const icon of icons) map.set(icon.category, (map.get(icon.category) ?? 0) + 1);
    return map;
  }, [icons]);

  const searching = fold(deferred).length > 0;
  const sections = searching || category
    ? [{ key: 'results', title: undefined, items: results }]
    : categories.map((c) => ({
        key: c.key,
        title: c.title,
        items: results.filter(({ icon }) => icon.category === c.key),
      }));

  return (
    <div className="mt-8">
      <div className="sticky top-(--fd-nav-height,56px) z-10 -mx-5 border-b bg-fd-background/90 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 basis-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fd-muted-foreground" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search in English or French: basil, échalote, en:feta"
              aria-label="Search icons"
              className="h-11 w-full rounded-control border bg-fd-card pl-10 shadow-card pr-10 text-[15px] outline-none placeholder:text-fd-muted-foreground focus:border-basil focus:ring-4 focus:ring-basil/15 [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-fd-muted-foreground hover:bg-fd-accent"
              >
                <X className="size-4" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border bg-fd-muted px-1.5 font-mono text-xs text-fd-muted-foreground max-sm:hidden">
                /
              </kbd>
            )}
          </div>
          <div role="radiogroup" aria-label="Icon size" className="flex rounded-control border bg-fd-card p-1 shadow-card">
            {(['cozy', 'compact'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={density === value}
                onClick={() => setDensity(value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm capitalize transition-colors',
                  density === value ? 'bg-fd-accent font-medium' : 'text-fd-muted-foreground hover:text-fd-foreground',
                )}
              >
                {value === 'cozy' ? 'Large' : 'Small'}
              </button>
            ))}
          </div>
        </div>
        <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] md:flex-wrap md:overflow-visible" role="group" aria-label="Filter by aisle">
          <FilterPill active={!category} onClick={() => setCategory(undefined)} count={icons.length}>
            All
          </FilterPill>
          {categories.map((c) => (
            <FilterPill
              key={c.key}
              active={category === c.key}
              onClick={() => setCategory(category === c.key ? undefined : c.key)}
              count={counts.get(c.key) ?? 0}
            >
              {c.title}
            </FilterPill>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {results.length} icons
      </p>

      {results.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <p className="font-display text-2xl font-semibold">No icon for “{query}” yet.</p>
          <p className="mt-2 max-w-sm text-fd-muted-foreground">
            Check the spelling, try the ingredient it belongs to (“rice” for basmati), or ask for it.
          </p>
          <a
            href={newIssueUrl}
            className="mt-6 inline-flex h-10 items-center rounded-full bg-basil px-5 text-sm font-medium text-fd-primary-foreground hover:opacity-90"
          >
            Request “{query}” on GitHub
          </a>
        </div>
      ) : (
        sections.map((section) =>
          section.items.length === 0 ? null : (
            <section key={section.key} className="pt-10" aria-label={section.title ?? 'Results'}>
              {section.title && (
                <h2 className="mb-4 flex items-baseline gap-2 font-display text-2xl font-semibold">
                  {section.title}
                  <span className="font-sans text-sm font-normal text-fd-muted-foreground">
                    {section.items.length}
                  </span>
                </h2>
              )}
              <ul
                className={cn(
                  'grid gap-1',
                  density === 'cozy'
                    ? 'grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))]'
                    : 'grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]',
                )}
              >
                {section.items.map(({ icon, via }) => (
                  <Tile key={icon.id} icon={icon} via={via} density={density} />
                ))}
              </ul>
            </section>
          ),
        )
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
        active ? 'border-basil bg-basil text-fd-primary-foreground' : 'bg-fd-card hover:border-basil/50',
      )}
    >
      {children}
      <span className={cn('text-xs', active ? 'opacity-80' : 'text-fd-muted-foreground')}>{count}</span>
    </button>
  );
}

function Tile({ icon, via, density }: { icon: GalleryIcon; via?: string; density: Density }) {
  const [copied, copy] = useCopy();
  const cozy = density === 'cozy';
  return (
    <li className="group relative">
      <Link
        href={`/icons/${icon.slug}`}
        className={cn(
          'flex h-full flex-col items-center rounded-card text-center transition-colors hover:bg-fd-card focus-visible:bg-fd-card focus-visible:outline-2 focus-visible:outline-fd-ring',
          cozy ? 'gap-2 px-2 pt-5 pb-4' : 'gap-1 px-1 pt-3 pb-2',
        )}
      >
        <IconImage
          file={icon.file}
          size={cozy ? 88 : 56}
          alt=""
          className={cn('transition-transform duration-200 group-hover:scale-105', cozy ? 'size-22' : 'size-14')}
        />
        <span className={cn('leading-tight', cozy ? 'text-sm' : 'text-xs')}>{icon.en}</span>
        {via && <span className="text-xs leading-tight text-fd-muted-foreground">for {via}</span>}
      </Link>
      <button
        type="button"
        onClick={() => copy(icon.id)}
        aria-label={copied ? `Copied ${icon.id}` : `Copy id ${icon.id}`}
        title={copied ? 'Copied' : `Copy ${icon.id}`}
        className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-md text-fd-muted-foreground opacity-0 transition-opacity hover:bg-fd-accent hover:text-fd-foreground focus-visible:opacity-100 group-hover:opacity-100 max-sm:hidden"
      >
        {copied ? <Check className="size-3.5 text-basil" /> : <Copy className="size-3.5" />}
      </button>
    </li>
  );
}
