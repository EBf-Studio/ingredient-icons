'use client';

import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SearchItemType,
} from 'fumadocs-ui/components/dialog/search';
import type { SharedProps } from 'fumadocs-ui/contexts/search';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { fetchClient } from 'fumadocs-core/search/client/fetch';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { GALLERY_SEARCH_EVENT, indexIcons, matchIcons, type SearchableIcon } from '@/lib/icon-search';
import { iconSrc } from '@/lib/icon-path';

const MAX_ICONS = 6;

let iconsPromise: Promise<SearchableIcon[]> | undefined;
const loadIcons = () =>
  (iconsPromise ??= fetch('/data/search-icons.json').then((r) => r.json() as Promise<SearchableIcon[]>));

const client = fetchClient({ api: '/api/search' });

/** Fumadocs' search dialog, with matching ingredient icons listed above the docs results. */
export default function SiteSearchDialog(props: SharedProps) {
  const search = useDocsSearch({ client });
  const router = useRouter();
  const [icons, setIcons] = useState<SearchableIcon[]>();

  // A small file (about 16 KB gzipped), so fetch it as soon as the dialog first opens.
  useEffect(() => {
    if (props.open && !icons) void loadIcons().then(setIcons);
  }, [props.open, icons]);

  const index = useMemo(() => (icons ? indexIcons(icons) : []), [icons]);

  const items = useMemo((): SearchItemType[] | undefined => {
    if (!search.search.trim()) return undefined;
    const matches = matchIcons(index, search.search);
    const iconItems: SearchItemType[] = matches.slice(0, MAX_ICONS).map(({ icon, via }) => ({
      id: `icon:${icon.id}`,
      type: 'action',
      node: <IconResult icon={icon} via={via} />,
      onSelect: () => router.push(`/icons/${icon.slug}`),
    }));
    if (matches.length > MAX_ICONS) {
      iconItems.push({
        id: 'icon:more',
        type: 'action',
        node: (
          <span className="text-fd-muted-foreground">
            See all {matches.length} matching icons in the gallery
          </span>
        ),
        onSelect: () => {
          const query = search.search.trim();
          router.push(`/icons?q=${encodeURIComponent(query)}`);
          window.dispatchEvent(new CustomEvent(GALLERY_SEARCH_EVENT, { detail: query }));
        },
      });
    }
    return [...iconItems, ...((search.data?.items ?? []) as SearchItemType[])];
  }, [index, search.search, search.data, router]);

  return (
    <SearchDialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput placeholder="Search the docs and the icons" />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={items} />
      </SearchDialogContent>
      <SearchDialogFooter />
    </SearchDialog>
  );
}

function IconResult({ icon, via }: { icon: SearchableIcon; via?: string }) {
  return (
    <span className="flex items-center gap-3">
      <img src={iconSrc(icon.file, 64)} alt="" width={36} height={36} className="icon-img size-9 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium first-letter:uppercase">{icon.en}</span>
        <span className="block truncate text-xs text-fd-muted-foreground">
          {via ? `Shown for ${via}` : icon.fr && icon.fr !== icon.en ? <span lang="fr">{icon.fr}</span> : icon.id}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-fd-muted px-2 py-0.5 text-[11px] text-fd-muted-foreground">Icon</span>
    </span>
  );
}
