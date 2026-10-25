'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(timeout);
  }, [copied]);
  return [
    copied,
    (text) => {
      void navigator.clipboard.writeText(text).then(() => setCopied(true));
    },
  ];
}

export function CopyButton({
  value,
  label = 'Copy',
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, copy] = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      aria-label={copied ? 'Copied' : label}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground focus-visible:outline-2 focus-visible:outline-fd-ring',
        className,
      )}
    >
      {copied ? <Check className="size-4 text-basil" /> : <Copy className="size-4" />}
    </button>
  );
}
