'use client';

import { Pause, Play } from 'lucide-react';
import { useState } from 'react';

/** Pauses the shelf's drifting columns, for anyone who finds the motion distracting. */
export function MotionToggle() {
  const [paused, setPaused] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={paused}
      aria-label={paused ? 'Play the icon animation' : 'Pause the icon animation'}
      onClick={(event) => {
        const next = !paused;
        setPaused(next);
        event.currentTarget.parentElement?.toggleAttribute('data-paused', next);
      }}
      className="absolute right-3 bottom-3 z-10 inline-flex size-8 items-center justify-center rounded-full border bg-fd-card/90 text-fd-muted-foreground shadow-card backdrop-blur transition-colors hover:text-fd-foreground motion-reduce:hidden"
    >
      {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
    </button>
  );
}
