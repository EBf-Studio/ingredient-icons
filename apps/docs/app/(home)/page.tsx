import { findIcon } from '@ingredient-icons/core';
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';
import {
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from 'fumadocs-ui/components/codeblock';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FallbackDemo } from '@/components/home/fallback-demo';
import { Shelf } from '@/components/home/shelf';
import { IconImage } from '@/components/icon-image';
import { InstallCommand } from '@/components/install-command';
import { iconById, icons, resolvable, total, version } from '@/lib/icons';
import { githubUrl, marmaladeUrl, newIssueUrl, packageName } from '@/lib/shared';

// Ingredients that share one emoji, and the icons that tell them apart.
const EMOJI_ROWS = [
  { emoji: '🧅', label: 'onion', ids: ['en:onion', 'en:red-onion', 'en:shallot', 'en:spring-onion', 'en:leek'] },
  { emoji: '🧂', label: 'salt shaker', ids: ['en:salt', 'en:black-pepper', 'en:white-pepper', 'en:pink-peppercorn', 'en:celery-salt'] },
  { emoji: '🧀', label: 'cheese wedge', ids: ['en:brie', 'en:feta', 'en:roquefort', 'en:mozzarella', 'en:parmigiano-reggiano'] },
];

// A recipe as an app stores it: Open Food Facts ids, some without an icon of their own.
const RECIPE = [
  { id: 'en:aubergine', quantity: '1', name: 'aubergine' },
  { id: 'en:courgette', quantity: '2', name: 'courgettes' },
  { id: 'en:red-bell-pepper', quantity: '1', name: 'red pepper' },
  { id: 'en:onion', quantity: '1', name: 'onion' },
  { id: 'en:garlic-clove', quantity: '3', name: 'garlic cloves' },
  { id: 'en:cherry-tomato', quantity: '250 g', name: 'cherry tomatoes' },
  { id: 'en:thyme', quantity: '4 sprigs', name: 'thyme' },
  { id: 'en:extra-virgin-olive-oil', quantity: '3 tbsp', name: 'olive oil' },
];

const reactCode = `import { iconUrl } from "${packageName}"

export function Ingredient({ id, quantity, name }) {
  return (
    <li>
      <img src={iconUrl(id)} alt="" width={40} height={40} />
      {quantity} {name}
    </li>
  )
}

<Ingredient id="en:cherry-tomato" quantity="250 g" name="cherry tomatoes" />`;

const nativeCode = `import { Image, Text, View } from "react-native"
import { iconUrl } from "${packageName}"

export function Ingredient({ id, quantity, name }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Image source={{ uri: iconUrl(id) }} style={{ width: 40, height: 40 }} />
      <Text>{quantity} {name}</Text>
    </View>
  )
}`;

const urlCode = `import { findIcon, iconUrl } from "${packageName}"

iconUrl("en:cherry-tomato")
// https://cdn.jsdelivr.net/npm/${packageName}@${version}/icons/webp/128/en_tomato.webp

iconUrl("en:shallot", { size: 256, baseUrl: "https://cdn.example.com/ingredients" })
// https://cdn.example.com/ingredients/icons/webp/256/en_shallot.webp

findIcon("en:unicorn-steak")
// undefined: show your own placeholder`;

const LADDER = [64, 128, 256, 512] as const;

export default function HomePage() {
  const slugs = Object.fromEntries(icons.map((icon) => [icon.id, icon.slug]));

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="mx-auto grid grid-cols-1 w-full max-w-(--site-width) items-center gap-10 px-5 pt-10 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16 lg:pt-16 lg:pb-24">
        <div className="max-w-xl">
          <h1 className="font-display text-[clamp(2.75rem,7vw,5.25rem)] font-semibold leading-[0.98] tracking-[-0.025em] [font-variation-settings:'SOFT'_100,'WONK'_1]">
            An icon for every ingredient.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-fd-muted-foreground">
            {total} soft 3D icons for recipe apps, keyed by the Open Food Facts taxonomy. Shallots,
            crème fraîche, salt and pepper each get their own, and anything else borrows its closest
            parent&apos;s. Public domain.
          </p>
          <InstallCommand className="mt-8" />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/docs"
              className="inline-flex h-11 items-center rounded-full bg-basil px-5 font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
            <Link
              href="/icons"
              className="inline-flex h-11 items-center rounded-full border bg-fd-card px-5 font-medium transition-colors hover:border-basil/50"
            >
              Browse the {total} icons
            </Link>
          </div>
        </div>
        <div className="relative h-[26rem] rounded-[2rem] border bg-fd-muted/60 px-2 sm:h-[34rem] lg:h-[38rem]">
          <div
            aria-hidden
            className="absolute inset-0 rounded-[2rem] opacity-60 [background-image:linear-gradient(var(--color-fd-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-fd-border)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          />
          <Shelf className="h-full" />
        </div>
      </section>

      {/* Emojis run out */}
      <section className="border-y bg-fd-card">
        <div className="mx-auto grid grid-cols-1 w-full max-w-(--site-width) gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
              Emojis run out at the onion.
            </h2>
            <p className="mt-4 leading-relaxed text-fd-muted-foreground">
              There is no emoji for a shallot, and 🧂 has to stand in for salt and pepper. A recipe
              shows each ingredient as what it is.
            </p>
          </div>
          <div className="flex flex-col divide-y">
            {EMOJI_ROWS.map((row) => (
              <div key={row.emoji} className="flex items-center gap-3 py-5 first:pt-0 last:pb-0 sm:gap-6">
                <div className="flex w-10 shrink-0 flex-col items-center sm:w-20">
                  <span className="text-3xl sm:text-5xl" role="img" aria-label={`${row.label} emoji`}>
                    {row.emoji}
                  </span>
                </div>
                <ArrowRight className="size-5 shrink-0 text-fd-muted-foreground max-sm:hidden" aria-hidden />
                <ul className="grid min-w-0 flex-1 grid-cols-5 gap-1 sm:gap-3">
                  {row.ids.map((id) => {
                    const icon = iconById(id)!;
                    return (
                      <li key={id}>
                        <Link href={`/icons/${icon.slug}`} className="group flex flex-col items-center gap-1.5 text-center">
                          <IconImage
                            file={icon.file}
                            size={72}
                            className="size-12 transition-transform group-hover:-translate-y-0.5 sm:size-[4.5rem]"
                          />
                          <span className="hyphens-auto text-[11px] leading-tight text-fd-muted-foreground [overflow-wrap:anywhere] group-hover:text-fd-foreground sm:text-[13px]">
                            {icon.en}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fallback */}
      <section className="mx-auto w-full max-w-(--site-width) px-5 py-24 sm:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            No icon of its own? It borrows its parent&apos;s.
          </h2>
          <p className="mt-4 leading-relaxed text-fd-muted-foreground">
            Ids follow the Open Food Facts taxonomy, which knows that fleur de sel is a sea salt and
            sea salt is a salt. When an ingredient has no icon, <code className="font-mono text-[0.9em]">findIcon</code>{' '}
            walks up its parents and takes the first one that has. That is how {total} icons cover{' '}
            {resolvable.toLocaleString('en')} ingredients.
          </p>
        </div>
        <div className="mt-10">
          <FallbackDemo slugs={slugs} />
        </div>
      </section>

      {/* Code + recipe */}
      <section className="border-y bg-fd-card">
        <div className="mx-auto w-full max-w-(--site-width) px-5 py-24 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
              One function between your recipe and its icons.
            </h2>
            <p className="mt-4 leading-relaxed text-fd-muted-foreground">
              Pass the ingredient id you already store, get back an image URL. Files are served from
              jsDelivr and pinned to the version you installed, or from your own server.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-center">
            <CodeBlockTabs defaultValue="react" className="my-0 min-w-0">
              <CodeBlockTabsList>
                <CodeBlockTabsTrigger value="react">React</CodeBlockTabsTrigger>
                <CodeBlockTabsTrigger value="native">React Native</CodeBlockTabsTrigger>
                <CodeBlockTabsTrigger value="url">Any URL</CodeBlockTabsTrigger>
              </CodeBlockTabsList>
              <CodeBlockTab value="react">
                <ServerCodeBlock lang="tsx" code={reactCode} />
              </CodeBlockTab>
              <CodeBlockTab value="native">
                <ServerCodeBlock lang="tsx" code={nativeCode} />
              </CodeBlockTab>
              <CodeBlockTab value="url">
                <ServerCodeBlock lang="ts" code={urlCode} />
              </CodeBlockTab>
            </CodeBlockTabs>

            <figure className="rounded-[1.75rem] border bg-fd-background p-6 shadow-[0_24px_48px_-28px_rgb(24_33_28/0.35)]">
              <figcaption>
                <p className="font-display text-2xl font-semibold">Ratatouille</p>
                <p className="mt-1 text-sm text-fd-muted-foreground">Serves 4, 1 h 15 min</p>
              </figcaption>
              <ul className="mt-5 flex flex-col">
                {RECIPE.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 border-b border-dashed py-1.5 last:border-0">
                    <IconImage file={findIcon(item.id)!.file} size={40} className="size-10" />
                    <span className="text-[15px]">
                      <span className="font-medium">{item.quantity}</span> {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </figure>
          </div>
        </div>
      </section>

      {/* What ships */}
      <section className="mx-auto grid grid-cols-1 w-full max-w-(--site-width) items-end gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="flex items-end gap-3 overflow-x-auto pb-2 sm:gap-6" aria-label="The strawberry at each size">
          {LADDER.map((size) => (
            <figure key={size} className="flex shrink-0 flex-col items-center gap-3">
              <img
                src={`/icons/png/${size}/en_strawberry.png`}
                alt={`Strawberry, ${size} px`}
                width={size}
                height={size}
                loading="lazy"
                className="icon-img h-auto"
                style={{ width: `clamp(${size / 8}px, ${size / 22}vw, ${size / 2}px)` }}
              />
              <figcaption className="font-mono text-xs text-fd-muted-foreground">{size} px</figcaption>
            </figure>
          ))}
        </div>
        <div>
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">Sharp from a list row to a hero.</h2>
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[15px]">
            <dt className="text-fd-muted-foreground">WebP</dt>
            <dd>64, 128 and 256 px, in the npm package</dd>
            <dt className="text-fd-muted-foreground">PNG</dt>
            <dd>64 to 512 px, in the repository</dd>
            <dt className="text-fd-muted-foreground">Names</dt>
            <dd>English and French, from Open Food Facts</dd>
            <dt className="text-fd-muted-foreground">License</dt>
            <dd>CC0: use them anywhere, no credit needed</dd>
          </dl>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto w-full max-w-(--site-width) px-5 pb-24 sm:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-basil px-6 py-14 text-fd-primary-foreground sm:px-12 dark:bg-[#1d3a27] dark:text-fd-foreground">
          <div className="relative z-10 max-w-lg">
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
              Missing an ingredient?
            </h2>
            <p className="mt-4 leading-relaxed opacity-85">
              New icons ship in batches. Open an issue with the Open Food Facts id or the name of
              the ingredient, and it goes on the list.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={newIssueUrl}
                className="inline-flex h-11 items-center rounded-full bg-fd-background px-5 font-medium text-fd-foreground transition-opacity hover:opacity-90"
              >
                Request an icon
              </a>
              <a
                href={githubUrl}
                className="inline-flex h-11 items-center rounded-full border border-current/30 px-5 font-medium transition-colors hover:bg-white/10"
              >
                Star on GitHub
              </a>
            </div>
          </div>
          <div aria-hidden className="pointer-events-none absolute -right-6 -bottom-10 hidden grid-cols-3 gap-2 rotate-[-8deg] sm:grid">
            {['en_lemon', 'en_garlic', 'en_basil', 'en_egg', 'en_tomato', 'en_butter'].map((file) => (
              <IconImage key={file} file={file} size={112} className="size-28" />
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-(--site-width) flex-col gap-3 px-5 py-8 text-sm text-fd-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            Made by <a href={marmaladeUrl} className="text-fd-foreground underline-offset-4 hover:underline">Marmalade</a>.
            Icons CC0, taxonomy data ODbL from Open Food Facts, code MIT.
          </p>
          <nav className="flex gap-5">
            <Link href="/docs" className="hover:text-fd-foreground">Docs</Link>
            <Link href="/icons" className="hover:text-fd-foreground">Icons</Link>
            <a href={githubUrl} className="hover:text-fd-foreground">GitHub</a>
            <Link href="/docs/licenses" className="hover:text-fd-foreground">Licenses</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
