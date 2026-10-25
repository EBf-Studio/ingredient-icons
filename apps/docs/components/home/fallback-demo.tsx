'use client';

import { Check, RotateCcw, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { iconSrc, readableId } from '@/lib/icon-path';

/** Taxonomy id → the ids findIcon walks through, ending at the one with an icon. */
type Lookup = Record<string, string[]>;

let lookupPromise: Promise<Lookup> | undefined;
const loadLookup = () => (lookupPromise ??= fetch('/data/lookup.json').then((r) => r.json() as Promise<Lookup>));

const PRESETS = [
  'en:cherry-tomato',
  'en:fleur-de-sel',
  'en:basmati-rice',
  'en:extra-virgin-olive-oil',
  'en:napa-cabbage',
  'en:lardon',
  'en:wheat-tortilla',
  'en:smoked-paprika',
];

const fileOf = (id: string) => id.replace(':', '_');
const normalize = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/^en:/, '')
    .replace(/\s+/g, '-');

export function FallbackDemo({ slugs, footer }: { slugs: Record<string, string>; footer?: React.ReactNode }) {
  const [lookup, setLookup] = useState<Lookup>();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(PRESETS[0]!);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // The preset is drawn from the lookup too, so fetch it once the demo is on screen.
  useEffect(() => {
    void loadLookup().then(setLookup);
  }, []);

  const matches = useMemo(() => {
    const needle = normalize(query);
    if (!lookup || !needle) return [];
    const english = Object.keys(lookup).filter((id) => id.startsWith('en:') && id.includes(needle));
    return english
      .sort((a, b) => Number(!a.startsWith(`en:${needle}`)) - Number(!b.startsWith(`en:${needle}`)) || a.length - b.length)
      .slice(0, 7);
  }, [lookup, query]);

  const [run, setRun] = useState(0);
  const choose = (id: string) => {
    setSelected(id);
    setRun((r) => r + 1);
    setQuery('');
    setOpen(false);
    setActive(0);
  };

  const steps = lookup?.[selected] ?? [selected];
  const target = steps.at(-1)!;
  const exact = steps.length === 1;
  const noMatch = lookup && normalize(query) && matches.length === 0;
  const tick = useClimb(lookup ? steps.length : 0, `${selected}#${run}`);
  const borrowed = !exact && tick >= steps.length + 2;
  const { ref: treeRef, span } = useSlotSpan(`${selected}#${run}`);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-12">
      <div className="flex flex-col">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fd-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open && matches.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
            aria-label="Look up an Open Food Facts ingredient"
            placeholder="Try “basmati rice” or “feta”"
            value={query}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActive((i) => Math.min(i + 1, matches.length - 1));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (event.key === 'Enter' && matches[active]) {
                choose(matches[active]);
              } else if (event.key === 'Escape') {
                setOpen(false);
              }
            }}
            className="h-12 w-full rounded-control border bg-fd-card pl-10 shadow-card pr-4 text-[15px] outline-none transition-shadow placeholder:text-fd-muted-foreground focus:border-basil focus:ring-4 focus:ring-basil/15"
          />
          {open && matches.length > 0 && (
            <ul
              id={listId}
              role="listbox"
              className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-control border bg-fd-popover p-1 shadow-popover"
            >
              {matches.map((id, i) => (
                <li
                  key={id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(id);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm',
                    i === active && 'bg-fd-accent',
                  )}
                >
                  <img src={iconSrc(fileOf(lookup![id]!.at(-1)!), 64)} alt="" className="size-7" />
                  <span className="truncate font-mono text-[13px]">{id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-2 text-sm text-fd-muted-foreground empty:hidden" aria-live="polite">
          {noMatch ? 'No ingredient by that name in the taxonomy. Try a simpler word.' : null}
        </p>

        <p className="mt-5 text-sm text-fd-muted-foreground">Or pick one:</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => choose(id)}
              aria-pressed={selected === id}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                selected === id
                  ? 'border-basil bg-basil text-fd-primary-foreground'
                  : 'bg-fd-card hover:border-basil/50',
              )}
            >
              {readableId(id)}
            </button>
          ))}
        </div>
        {footer && <div className="mt-8 lg:mt-auto lg:pt-8">{footer}</div>}
      </div>

      <div className="relative flex min-w-0 flex-col overflow-hidden rounded-card border bg-fd-card shadow-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(var(--color-fd-border)_1px,transparent_1px)] [background-size:18px_18px]"
        />
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full border bg-fd-card px-2.5 py-1 text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground"
        >
          <RotateCcw className="size-3" />
          Replay
        </button>

        {/* Tall enough for four rungs, so switching ingredients does not make the card jump. */}
        <div className="relative flex flex-1 items-center px-4 py-8 sm:min-h-[28.5rem] sm:px-8">
          <ol
            key={`${selected}#${run}`}
            aria-label={`How ${selected} finds its icon`}
            // A fixed width rather than w-fit: the tags appearing during the climb would
            // otherwise widen the list and shift the centred tree sideways.
            ref={treeRef}
            className="relative mx-auto w-full max-w-md pr-12 sm:pr-28"
            style={{ '--drop': `${span ? -span.height : 0}px` } as React.CSSProperties}
          >
            {/* Top of the list is the ancestor that has the icon; the ingredient asked for sits at the bottom. */}
            {steps
              .map((id, i) => ({ id, i }))
              .reverse()
              .map(({ id, i }) => (
                <Rung
                  key={id}
                  id={id}
                  asked={i === 0}
                  found={i === steps.length - 1}
                  checked={tick > i}
                  checking={tick === i + 1}
                  borrowed={i === 0 && borrowed}
                  lender={readableId(target)}
                  href={slugs[target] ? `/icons/${slugs[target]}` : '/icons'}
                  target={target}
                  last={i === 0}
                />
              ))}
            {!exact && span && <BorrowArrow show={tick >= steps.length + 1} {...span} />}
          </ol>
        </div>

        <div className="relative border-t bg-fd-card px-5 py-4 font-mono text-[13px] leading-6 sm:px-7">
          <div className="overflow-x-auto whitespace-nowrap">
            <span className="text-fd-muted-foreground">findIcon(</span>
            <span className="text-basil">&quot;{selected}&quot;</span>
            <span className="text-fd-muted-foreground">)</span>
          </div>
          <div className="overflow-x-auto whitespace-nowrap text-fd-muted-foreground">
            <span aria-hidden>{'// '}</span>
            {`{ id: "${target}", file: "${fileOf(target)}", exact: ${exact} }`}
          </div>
        </div>
      </div>
    </div>
  );
}

const BEAT = 480;

/**
 * Where the top and bottom slots of the tree sit, measured rather than computed: a long
 * name can wrap and make its rung taller. The borrowed icon falls `height` pixels and the
 * arrow spans the same distance, starting `top` pixels into the list.
 */
function useSlotSpan(key: string) {
  const ref = useRef<HTMLOListElement>(null);
  const [span, setSpan] = useState<{ top: number; height: number }>();
  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    const measure = () => {
      const slots = list.querySelectorAll('[data-slot]');
      const first = slots[0]?.getBoundingClientRect();
      const last = slots[slots.length - 1]?.getBoundingClientRect();
      if (!first || !last) return;
      const top = first.top + first.height / 2 - list.getBoundingClientRect().top;
      const height = last.top - first.top;
      setSpan((prev) => (prev?.top === top && prev.height === height ? prev : { top, height }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [key]);
  return { ref, span };
}

/**
 * Plays the climb: tick 1..n checks each rung from the bottom up, n + 1 draws the
 * borrow arrow, n + 2 drops the icon into the empty slot.
 */
function useClimb(levels: number, key: string) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!levels) return;
    const last = levels === 1 ? 1 : levels + 2;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTick(last);
      return;
    }
    setTick(0);
    const timers = Array.from({ length: last }, (_, i) =>
      setTimeout(() => setTick(i + 1), 250 + i * BEAT + (i >= levels ? 150 : 0)),
    );
    return () => timers.forEach(clearTimeout);
  }, [levels, key]);
  return tick;
}

function Rung(props: {
  id: string;
  asked: boolean;
  found: boolean;
  checked: boolean;
  checking: boolean;
  borrowed: boolean;
  lender: string;
  href: string;
  target: string;
  last: boolean;
}) {
  const { id, asked, found, checked, checking, borrowed } = props;
  const missing = checked && !found;
  // Remount the tag whenever it changes so each new verdict hops in.
  const tagKey = borrowed ? 'borrowed' : found && checked ? 'found' : missing ? 'missing' : 'idle';

  let slot: React.ReactNode = <span className="text-lg text-fd-muted-foreground/60">?</span>;
  if (found && checked) {
    slot = (
      <Link href={props.href} aria-label={`${readableId(id)} icon`} className="pop-in block">
        <img src={iconSrc(fileOf(id), 128)} alt="" className="size-12 drop-shadow-icon sm:size-16" />
      </Link>
    );
  } else if (borrowed) {
    slot = (
      <img
        src={iconSrc(fileOf(props.target), 128)}
        alt=""
        className="borrow-drop size-12 drop-shadow-icon sm:size-16"
      />
    );
  }

  let tag: React.ReactNode = asked && !checked ? <Tag>you asked for this</Tag> : null;
  if (borrowed) tag = <Tag tone="butter">borrows {props.lender}</Tag>;
  else if (found && checked)
    tag = (
      <Tag tone="basil">
        <Check className="size-3" /> {asked ? 'has its own icon' : 'has an icon'}
      </Tag>
    );
  else if (missing)
    tag = (
      <Tag tone="tomato">
        <X className="size-3" /> no icon
      </Tag>
    );

  return (
    <li>
      <div className="flex min-h-16 items-center gap-3 sm:min-h-20 sm:gap-4">
        <div
          data-slot
          className={cn(
            'relative flex size-16 shrink-0 items-center justify-center sm:size-20 rounded-card border-2 transition-colors duration-300',
            (found && checked) || borrowed
              ? 'border-transparent bg-transparent'
              : 'border-dashed bg-fd-background/70',
            missing && !borrowed && 'border-tomato/40',
            checking && 'scan',
          )}
        >
          {slot}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                'text-[15px] leading-tight font-medium transition-colors',
                !checked && !asked && 'text-fd-muted-foreground',
              )}
            >
              {readableId(id)}
            </span>
            {tag && (
              <span key={tagKey} className="hop-in">
                {tag}
              </span>
            )}
          </div>
          <div className="truncate font-mono text-xs text-fd-muted-foreground">{id}</div>
        </div>
      </div>
      {!props.last && (
        <div aria-hidden className="flex h-6 w-16 justify-center sm:w-20">
          <span className="relative w-px bg-[linear-gradient(var(--color-fd-muted-foreground)_50%,transparent_50%)] bg-[length:1px_6px] opacity-50">
            <span className="absolute top-1/2 left-2 -translate-y-1/2 font-sans text-[11px] whitespace-nowrap text-fd-muted-foreground">
              is a kind of ↑
            </span>
          </span>
        </div>
      )}
    </li>
  );
}

function Tag({ tone, children }: { tone?: 'tomato' | 'basil' | 'butter'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap',
        tone === 'tomato' && 'bg-tomato/12 text-tomato',
        tone === 'basil' && 'bg-basil/12 text-basil',
        tone === 'butter' && 'bg-butter/40 text-fd-foreground',
        !tone && 'bg-fd-muted text-fd-muted-foreground',
      )}
    >
      {children}
    </span>
  );
}

/** The curved arrow from the ancestor's icon back down to the empty slot. */
function BorrowArrow({ show, top, height }: { show: boolean; top: number; height: number }) {
  if (!show) return null;
  return (
    <div
      aria-hidden
      className="draw-down absolute right-1 w-10 sm:right-14 sm:w-14"
      style={{ top, height }}
    >
      <svg viewBox="0 0 56 100" preserveAspectRatio="none" className="size-full overflow-visible text-tomato">
        <path
          d="M0 0 C 56 0, 56 100, 6 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="5 5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <svg viewBox="0 0 10 10" className="absolute -bottom-[5px] -left-1 size-2.5 text-tomato">
        <path d="M10 0 L0 5 L10 10 Z" fill="currentColor" />
      </svg>
      <span className="absolute top-1/2 left-full -translate-y-1/2 -translate-x-1 font-display max-sm:hidden text-[15px] font-semibold whitespace-nowrap text-tomato italic [font-variation-settings:'SOFT'_100,'WONK'_1]">
        borrow!
      </span>
    </div>
  );
}
