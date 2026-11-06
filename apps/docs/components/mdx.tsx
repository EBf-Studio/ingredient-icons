import { GENERIC_ID } from '@ingredient-icons/core';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import { Fragment } from 'react';
import { IconImage } from '@/components/icon-image';
import { catalogEntry, catalogSize, covered, familyCount, iconById, kindOf, languageNames, nameCoverage, stepsOf, total } from '@/lib/icons';
import { KIND_TEXT } from '@/lib/mdx-text';

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
            href={`/icons/${icon.id}`}
            className="group flex flex-col items-center gap-1 text-center"
            style={{ width: size + 16 }}
          >
            <IconImage file={icon.id} size={size} className="transition-transform group-hover:-translate-y-0.5" />
            <span className="text-xs leading-tight text-fd-muted-foreground group-hover:text-fd-foreground">{icon.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

/** The walk from a catalog id up its parents to the icon it shows. */
function Resolves({ id }: { id: string }) {
  if (!catalogEntry(id)) throw new Error(`Resolves: ${id} is not in catalog.json`);
  const steps = stepsOf(id);
  const target = steps.at(-1)!;
  const kind = kindOf(id);
  return (
    <div className="not-prose my-4 flex items-center gap-3 rounded-control border bg-fd-card p-2 pr-4 shadow-card">
      <IconImage file={target} size={48} className="size-12 shrink-0" />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-1.5 font-mono text-sm">
          {steps.map((step, i) => (
            <Fragment key={step}>
              {i > 0 && (
                <span className="text-tomato" aria-label="then">
                  →
                </span>
              )}
              {i === steps.length - 1 && i > 0 && iconById(step) ? (
                <Link href={`/icons/${step}`} className="underline underline-offset-4">
                  {step}
                </Link>
              ) : (
                <span>{step === GENERIC_ID ? 'GENERIC_ID' : step}</span>
              )}
            </Fragment>
          ))}
        </p>
        <p className="text-xs text-fd-muted-foreground">{KIND_TEXT[kind]}</p>
      </div>
    </div>
  );
}

/** Names per language in catalog.json. */
function NameCoverage() {
  return (
    <table>
      <thead>
        <tr>
          <th>Language</th>
          <th>Entries with a name</th>
        </tr>
      </thead>
      <tbody>
        {nameCoverage.map(({ language, count }) => (
          <tr key={language}>
            <td>
              {languageNames[language]} (<code>{language}</code>)
            </td>
            <td>
              {count.toLocaleString('en')} of {catalogSize.toLocaleString('en')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Numbers that change with each batch or catalog release, spelled out in text copies by lib/mdx-text.ts. */
const Total = () => <>{total}</>;
const Covered = () => <>{covered.toLocaleString('en')}</>;
const CatalogSize = () => <>{catalogSize.toLocaleString('en')}</>;
const FamilyCount = () => <>{familyCount}</>;

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
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
    NameCoverage,
    Total,
    Covered,
    CatalogSize,
    FamilyCount,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
