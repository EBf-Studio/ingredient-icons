'use client';

import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

// HomeLayout wraps its children in a <main>, but the docs page brings its own.
function Shell({ ref: _ref, ...props }: ComponentProps<'main'>) {
  return <div {...props} className={cn('flex flex-1 flex-col [--fd-layout-width:var(--site-width)]', props.className)} />;
}

/** The home page's top bar around a layout that already has its own <main>. */
export function SiteHeaderLayout(props: HomeLayoutProps) {
  return <HomeLayout {...props} slots={{ container: Shell, ...props.slots }} />;
}
