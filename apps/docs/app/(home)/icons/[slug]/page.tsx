import { iconUrl } from '@ingredient-icons/core';
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CopyButton } from '@/components/copy-button';
import { IconImage } from '@/components/icon-image';
import { categoryTitle, iconById, icons, iconSrc, type Language, languageNames, nameOf } from '@/lib/icons';
import { newIssueUrl, packageName } from '@/lib/shared';

export function generateStaticParams() {
  return icons.map((icon) => ({ slug: icon.id }));
}

export const dynamicParams = false;

export async function generateMetadata(props: PageProps<'/icons/[slug]'>): Promise<Metadata> {
  const icon = iconById((await props.params).slug);
  if (!icon) notFound();
  const title = `${capitalize(icon.name)} icon`;
  const description = `A soft 3D ${icon.name} icon for recipe apps, catalog id ${icon.id}. PNG from 64 to 512 px and WebP from 64 to 256 px, public domain.`;
  return {
    title,
    description,
    openGraph: { title, description, images: iconSrc(icon.id, 512, 'png') },
  };
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const DOWNLOADS = [
  { format: 'png', sizes: [512, 256, 128, 64] },
  { format: 'webp', sizes: [256, 128, 64] },
] as const;

/** French and English first: they are reviewed, the others come from Wikidata. */
const LANGUAGE_ORDER: Language[] = ['fr', 'en', 'es', 'it', 'de', 'pt'];

/** A catalog id as a link to its icon page when it has one, as code otherwise. */
function CatalogLink({ id }: { id: string }) {
  return iconById(id) ? (
    <Link href={`/icons/${id}`} className="text-fd-foreground underline underline-offset-4">
      {nameOf(id)}
    </Link>
  ) : (
    <span className="text-fd-foreground">
      {nameOf(id)} (<code className="font-mono text-[13px]">{id}</code>)
    </span>
  );
}

export default async function IconPage(props: PageProps<'/icons/[slug]'>) {
  const icon = iconById((await props.params).slug);
  if (!icon) notFound();

  const position = icons.indexOf(icon);
  const previous = icons[(position - 1 + icons.length) % icons.length]!;
  const next = icons[(position + 1) % icons.length]!;
  const siblings = icons.filter((other) => other.category === icon.category && other.id !== icon.id).slice(0, 12);
  const names = LANGUAGE_ORDER.flatMap((language) => {
    const name = icon.names[language];
    return name ? [{ language, name }] : [];
  });
  const cdn = iconUrl(icon.id)!;

  const code = `import { iconUrl } from "${packageName}"

iconUrl("${icon.id}")
// ${cdn}`;

  return (
    <main className="mx-auto w-full max-w-(--site-width) flex-1 px-5 pt-8 pb-24 sm:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-fd-muted-foreground">
        <Link href="/icons" className="hover:text-fd-foreground">
          Icons
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span>{categoryTitle(icon.category)}</span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-panel border bg-fd-muted/60">
          <div
            aria-hidden
            className="absolute inset-0 opacity-70 [background-image:linear-gradient(var(--color-fd-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-fd-border)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
          />
          <img
            src={iconSrc(icon.id, 512, 'png')}
            alt={`${icon.name} icon`}
            width={512}
            height={512}
            className="icon-img relative w-[72%] drop-shadow-icon-lg"
          />
        </div>

        <div className="min-w-0">
          <h1 className="font-display text-5xl font-semibold leading-none tracking-tight [font-variation-settings:'SOFT'_100] sm:text-6xl">
            {capitalize(icon.name)}
          </h1>
          {icon.names.fr && icon.names.fr !== icon.name && (
            <p className="mt-3 text-lg text-fd-muted-foreground">
              <span lang="fr">{icon.names.fr}</span> in French
            </p>
          )}

          <div className="mt-6 flex items-center gap-1 rounded-control border bg-fd-card py-1 pr-1 pl-4 shadow-card">
            <span className="text-sm text-fd-muted-foreground">Id</span>
            <code className="ml-2 min-w-0 flex-1 truncate font-mono text-[15px]">{icon.id}</code>
            <CopyButton value={icon.id} label="Copy id" />
          </div>

          <h2 className="mt-8 text-sm font-medium">Download</h2>
          <div className="mt-3 flex flex-col gap-2">
            {DOWNLOADS.map(({ format, sizes }) => (
              <div key={format} className="flex flex-wrap items-center gap-2">
                <span className="w-11 font-mono text-xs text-fd-muted-foreground uppercase">{format}</span>
                {sizes.map((size) => (
                  <a
                    key={size}
                    href={iconSrc(icon.id, size, format)}
                    download={`${icon.id}-${size}.${format}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-control border bg-fd-card px-2.5 shadow-card text-sm transition-colors hover:border-basil/50"
                  >
                    <Download className="size-3.5 text-fd-muted-foreground" />
                    {size}
                  </a>
                ))}
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-sm font-medium">Use it</h2>
          <ServerCodeBlock lang="ts" code={code} codeblock={{ className: 'mt-3 mb-0' }} />

          <h2 className="mt-8 text-sm font-medium">Names in the catalog</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
            {names.map(({ language, name }) => (
              <div key={language} className="contents">
                <dt className="text-fd-muted-foreground">{languageNames[language]}</dt>
                <dd lang={language}>{name}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-8 text-sm font-medium">In the catalog</h2>
          <p className="mt-2 text-sm text-fd-muted-foreground">
            {icon.parent ? (
              <>
                A kind of <CatalogLink id={icon.parent} />
                {icon.family && icon.family !== icon.parent && (
                  <>
                    , in the family <CatalogLink id={icon.family} />
                  </>
                )}
                .
              </>
            ) : (
              <>One of the families at the top of the catalog: every ingredient under it that has no closer icon shows this one.</>
            )}
          </p>

          {icon.fallbacks.length > 0 && (
            <>
              <h2 className="mt-8 text-sm font-medium">
                Also shown for {icon.fallbacks.length} {icon.fallbacks.length === 1 ? 'ingredient' : 'ingredients'}
              </h2>
              <p className="mt-1 text-sm text-fd-muted-foreground">
                These catalog ingredients have no icon of their own, and {icon.name} is their nearest ancestor that has.
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {icon.fallbacks.slice(0, 24).map((id) => (
                  <li key={id} className="rounded-full border bg-fd-card px-2.5 py-0.5 text-sm" title={id}>
                    {nameOf(id)}
                  </li>
                ))}
                {icon.fallbacks.length > 24 && (
                  <li className="px-1 py-0.5 text-sm text-fd-muted-foreground">and {icon.fallbacks.length - 24} more</li>
                )}
              </ul>
            </>
          )}
        </div>
      </div>

      {siblings.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold">More {categoryTitle(icon.category).toLowerCase()}</h2>
          <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-1">
            {siblings.map((sibling) => (
              <li key={sibling.id}>
                <Link
                  href={`/icons/${sibling.id}`}
                  className="group flex flex-col items-center gap-2 rounded-card px-2 pt-4 pb-3 text-center transition-colors hover:bg-fd-card"
                >
                  <IconImage file={sibling.id} size={72} className="size-18 transition-transform group-hover:scale-105" />
                  <span className="text-sm leading-tight">{sibling.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Other icons" className="mt-14 flex items-center justify-between gap-4 border-t pt-6">
        <Link href={`/icons/${previous.id}`} className="group flex items-center gap-3 text-sm">
          <ArrowLeft className="size-4 text-fd-muted-foreground transition-transform group-hover:-translate-x-0.5" />
          <IconImage file={previous.id} size={40} className="size-10" />
          <span>{previous.name}</span>
        </Link>
        <a href={newIssueUrl} className="text-sm text-fd-muted-foreground hover:text-fd-foreground max-sm:hidden">
          Report a problem with this icon
        </a>
        <Link href={`/icons/${next.id}`} className="group flex items-center gap-3 text-sm">
          <span>{next.name}</span>
          <IconImage file={next.id} size={40} className="size-10" />
          <ArrowRight className="size-4 text-fd-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </nav>
    </main>
  );
}
