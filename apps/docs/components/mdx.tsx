import { findIcon } from '@ingredient-icons/core';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import { IconImage } from '@/components/icon-image';
import { iconById, resolvable, total, version } from '@/lib/icons';

/** A row of icons, each linking to its page in the gallery. */
function IconRow({ ids, size = 64 }: { ids: string[]; size?: number }) {
  return (
    <div className="not-prose my-6 flex flex-wrap gap-x-4 gap-y-3">
      {ids.map((id) => {
        const icon = iconById(id);
        if (!icon) throw new Error(`IconRow: no icon for ${id}`);
        return (
          <Link
            key={id}
            href={`/icons/${icon.slug}`}
            className="group flex flex-col items-center gap-1 text-center"
            style={{ width: size + 16 }}
          >
            <IconImage file={icon.file} size={size} className="transition-transform group-hover:-translate-y-0.5" />
            <span className="text-xs leading-tight text-fd-muted-foreground group-hover:text-fd-foreground">{icon.en}</span>
          </Link>
        );
      })}
    </div>
  );
}

/** What findIcon returns for an id, with the icon it lands on. */
function Resolves({ id }: { id: string }) {
  const icon = findIcon(id);
  if (!icon) throw new Error(`Resolves: ${id} has no icon`);
  const entry = iconById(icon.id)!;
  return (
    <div className="not-prose my-4 flex items-center gap-3 rounded-control border bg-fd-card p-2 pr-4 shadow-card">
      <IconImage file={icon.file} size={48} className="size-12" />
      <code className="min-w-0 truncate font-mono text-sm">{id}</code>
      {!icon.exact && (
        <>
          <span className="text-tomato" aria-label="falls back to">
            →
          </span>
          <Link href={`/icons/${entry.slug}`} className="font-mono text-sm underline underline-offset-4">
            {icon.id}
          </Link>
        </>
      )}
    </div>
  );
}

const Total = () => <>{total}</>;
const Resolvable = () => <>{resolvable.toLocaleString('en')}</>;
const Version = () => <>{version}</>;

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Accordion,
    Accordions,
    File,
    Files,
    Folder,
    Step,
    Steps,
    Tab,
    Tabs,
    TypeTable,
    IconRow,
    Resolves,
    Total,
    Resolvable,
    Version,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
