import { iconUrl } from '@ingredient-icons/core';
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CopyButton } from '@/components/copy-button';
import { IconImage } from '@/components/icon-image';
import { categoryTitle, iconById, iconBySlug, icons, iconSrc, readableId } from '@/lib/icons';
import { newIssueUrl, packageName } from '@/lib/shared';

export function generateStaticParams() {
  return icons.map((icon) => ({ slug: icon.slug }));
}

export const dynamicParams = false;

export async function generateMetadata(props: PageProps<'/icons/[slug]'>): Promise<Metadata> {
  const icon = iconBySlug((await props.params).slug);
  if (!icon) notFound();
  const title = `${capitalize(icon.en)} icon`;
  const description = `A soft 3D ${icon.en} icon for recipe apps, Open Food Facts id ${icon.id}. PNG and WebP from 64 to 512 px, public domain.`;
  return {
    title,
    description,
    openGraph: { title, description, images: iconSrc(icon.file, 512, 'png') },
  };
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const DOWNLOADS = [
  { format: 'png', sizes: [512, 256, 128, 64] },
  { format: 'webp', sizes: [256, 128, 64] },
] as const;

export default async function IconPage(props: PageProps<'/icons/[slug]'>) {
  const icon = iconBySlug((await props.params).slug);
  if (!icon) notFound();

  const position = icons.indexOf(icon);
  const previous = icons[(position - 1 + icons.length) % icons.length]!;
  const next = icons[(position + 1) % icons.length]!;
  const siblings = icons.filter((other) => other.category === icon.category && other.id !== icon.id).slice(0, 12);
  const english = icon.fallbacks.filter((id) => id.startsWith('en:'));
  const otherLanguages = icon.fallbacks.length - english.length;
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
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] border bg-fd-muted/60">
          <div
            aria-hidden
            className="absolute inset-0 opacity-70 [background-image:linear-gradient(var(--color-fd-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-fd-border)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
          />
          <img
            src={iconSrc(icon.file, 512, 'png')}
            alt={`${icon.en} icon`}
            width={512}
            height={512}
            className="icon-img relative w-[72%] drop-shadow-[0_30px_30px_rgb(24_33_28/0.18)]"
          />
        </div>

        <div className="min-w-0">
          <h1 className="font-display text-5xl font-semibold leading-none tracking-tight [font-variation-settings:'SOFT'_100] sm:text-6xl">
            {capitalize(icon.en)}
          </h1>
          {icon.fr && icon.fr !== icon.en && (
            <p className="mt-3 text-lg text-fd-muted-foreground">
              <span lang="fr">{icon.fr}</span> in French
            </p>
          )}

          <div className="mt-6 flex items-center gap-1 rounded-xl border bg-fd-card py-1 pr-1 pl-4">
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
                    href={iconSrc(icon.file, size, format)}
                    download={`${icon.file}-${size}.${format}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-fd-card px-2.5 text-sm transition-colors hover:border-basil/50"
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

          {(english.length > 0 || otherLanguages > 0) && (
            <>
              <h2 className="mt-8 text-sm font-medium">
                Also shown for {icon.fallbacks.length} {icon.fallbacks.length === 1 ? 'ingredient' : 'ingredients'}
              </h2>
              <p className="mt-1 text-sm text-fd-muted-foreground">
                These ids have no icon of their own, and {icon.en} is their closest ancestor that has.
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {english.slice(0, 24).map((id) => (
                  <li key={id} className="rounded-full border bg-fd-card px-2.5 py-0.5 text-sm" title={id}>
                    {readableId(id)}
                  </li>
                ))}
                {english.length > 24 && (
                  <li className="px-1 py-0.5 text-sm text-fd-muted-foreground">and {english.length - 24} more</li>
                )}
                {otherLanguages > 0 && (
                  <li className="px-1 py-0.5 text-sm text-fd-muted-foreground">
                    {english.length ? '+ ' : ''}
                    {otherLanguages} {otherLanguages === 1 ? 'id' : 'ids'} in other languages
                  </li>
                )}
              </ul>
            </>
          )}

          {icon.parents.length > 0 && (
            <>
              <h2 className="mt-8 text-sm font-medium">In the taxonomy</h2>
              <p className="mt-2 text-sm text-fd-muted-foreground">
                A kind of{' '}
                {icon.parents.map((parent, i) => {
                  const parentIcon = iconById(parent);
                  return (
                    <span key={parent}>
                      {i > 0 && ', '}
                      {parentIcon ? (
                        <Link href={`/icons/${parentIcon.slug}`} className="text-fd-foreground underline underline-offset-4">
                          {readableId(parent)}
                        </Link>
                      ) : (
                        <code className="font-mono text-[13px] text-fd-foreground">{parent}</code>
                      )}
                    </span>
                  );
                })}
                .
              </p>
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
                  href={`/icons/${sibling.slug}`}
                  className="group flex flex-col items-center gap-2 rounded-2xl px-2 pt-4 pb-3 text-center transition-colors hover:bg-fd-card"
                >
                  <IconImage file={sibling.file} size={72} className="size-18 transition-transform group-hover:scale-105" />
                  <span className="text-sm leading-tight">{sibling.en}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Other icons" className="mt-14 flex items-center justify-between gap-4 border-t pt-6">
        <Link href={`/icons/${previous.slug}`} className="group flex items-center gap-3 text-sm">
          <ArrowLeft className="size-4 text-fd-muted-foreground transition-transform group-hover:-translate-x-0.5" />
          <IconImage file={previous.file} size={40} className="size-10" />
          <span>{previous.en}</span>
        </Link>
        <a href={newIssueUrl} className="text-sm text-fd-muted-foreground hover:text-fd-foreground max-sm:hidden">
          Report a problem with this icon
        </a>
        <Link href={`/icons/${next.slug}`} className="group flex items-center gap-3 text-sm">
          <span>{next.en}</span>
          <IconImage file={next.file} size={40} className="size-10" />
          <ArrowRight className="size-4 text-fd-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </nav>
    </main>
  );
}
