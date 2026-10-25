import type { Metadata } from 'next';
import { Gallery, type GalleryIcon } from '@/components/gallery/gallery';
import { categories, icons, readableId, total } from '@/lib/icons';

export const metadata: Metadata = {
  title: 'Browse the icons',
  description: `All ${total} ingredient icons. Search in English or French, click one for every size, its id and the ingredients that fall back to it.`,
};

export default function IconsPage() {
  const items: GalleryIcon[] = icons.map((icon) => ({
    id: icon.id,
    slug: icon.slug,
    file: icon.file,
    en: icon.en,
    fr: icon.fr,
    category: icon.category,
    // English fallbacks are searchable too: "cherry tomato" finds the tomato.
    aliases: icon.fallbacks.filter((id) => id.startsWith('en:')).map(readableId),
  }));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-10 pb-24 sm:px-8 lg:pt-14">
      <h1 className="font-display text-5xl font-semibold tracking-tight [font-variation-settings:'SOFT'_100]">
        The pantry
      </h1>
      <p className="mt-3 max-w-xl text-lg text-fd-muted-foreground">
        All {total} icons, public domain. Click one for every size, its id and the ingredients that
        borrow it.
      </p>
      <Gallery icons={items} categories={categories} />
    </main>
  );
}
