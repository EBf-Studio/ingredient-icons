'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { packageName } from '@/lib/shared';
import { CopyButton } from './copy-button';

const managers = {
  npm: `npm install ${packageName}`,
  pnpm: `pnpm add ${packageName}`,
  bun: `bun add ${packageName}`,
  yarn: `yarn add ${packageName}`,
} as const;

type Manager = keyof typeof managers;

export function InstallCommand({ className }: { className?: string }) {
  const [manager, setManager] = useState<Manager>('npm');
  const command = managers[manager];
  return (
    <div
      className={cn(
        'w-full max-w-md rounded-control border bg-fd-card shadow-card',
        className,
      )}
    >
      <div role="group" aria-label="Package manager" className="flex gap-1 border-b px-2 pt-1.5">
        {(Object.keys(managers) as Manager[]).map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={manager === name}
            onClick={() => setManager(name)}
            className={cn(
              '-mb-px border-b-2 px-2 pb-1.5 pt-1 font-mono text-xs transition-colors',
              manager === name
                ? 'border-basil text-fd-foreground'
                : 'border-transparent text-fd-muted-foreground hover:text-fd-foreground',
            )}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 py-2 pl-4 pr-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm">
          <span className="select-none text-fd-muted-foreground">$ </span>
          {command}
        </code>
        <CopyButton value={command} label="Copy install command" />
      </div>
    </div>
  );
}
