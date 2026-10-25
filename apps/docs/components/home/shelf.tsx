import Link from 'next/link';
import { IconImage } from '@/components/icon-image';
import { type IconEntry, icons } from '@/lib/icons';
import { cn } from '@/lib/cn';

// Hand-picked so every column mixes colours and shapes instead of clumping greens together.
const PICKS = [
  'tomato', 'avocado', 'brie', 'lemon', 'salmon', 'garlic', 'strawberry', 'cheddar',
  'shallot', 'basil', 'egg', 'carrot', 'parmigiano-reggiano', 'blueberry', 'shrimp', 'aubergine',
  'butter', 'chili-pepper', 'mushroom', 'pomegranate', 'bread', 'spaghetti', 'leek', 'pita',
  'red-onion', 'maple-syrup', 'pineapple', 'octopus', 'cinnamon', 'broccoli', 'mozzarella', 'peach',
  'olive-oil', 'pumpkin', 'star-anise', 'fig', 'bacon', 'lime', 'radish', 'dark-chocolate',
  'mango', 'artichoke', 'rosemary', 'crab', 'beetroot', 'coconut-milk', 'cherry', 'ginger',
];

function pick(): IconEntry[] {
  const bySlug = new Map(icons.map((icon) => [icon.slug, icon]));
  return PICKS.flatMap((slug) => bySlug.get(slug) ?? []);
}

const COLUMNS = [
  { direction: 'up', duration: 70 },
  { direction: 'down', duration: 85 },
  { direction: 'up', duration: 64 },
  { direction: 'down', duration: 78 },
] as const;

export function Shelf({ className }: { className?: string }) {
  const picked = pick();
  const columns = COLUMNS.map((_, column) => picked.filter((_, i) => i % COLUMNS.length === column));

  return (
    <div
      className={cn(
        'shelf shelf-mask relative grid grid-cols-3 gap-x-2 overflow-hidden sm:grid-cols-4',
        className,
      )}
    >
      {columns.map((items, column) => (
        <div key={column} className={cn('relative', column === 3 && 'max-sm:hidden')}>
          <ul
            className="shelf-column flex flex-col"
            data-direction={COLUMNS[column]!.direction}
            style={{ '--shelf-duration': `${COLUMNS[column]!.duration}s` } as React.CSSProperties}
          >
            {/* Two copies so the loop wraps without a seam; the second is hidden from assistive tech. */}
            {[0, 1].map((copy) =>
              items.map((icon) => (
                <li key={`${copy}-${icon.id}`} aria-hidden={copy === 1 || undefined}>
                  <Link
                    href={`/icons/${icon.slug}`}
                    tabIndex={copy === 1 ? -1 : undefined}
                    className="group flex flex-col items-center gap-1 rounded-2xl px-2 py-3 outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
                  >
                    <IconImage
                      file={icon.file}
                      size={96}
                      priority={copy === 0}
                      className="size-20 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-110 sm:size-24"
                    />
                    <span className="text-xs text-fd-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      {icon.en}
                    </span>
                  </Link>
                </li>
              )),
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
