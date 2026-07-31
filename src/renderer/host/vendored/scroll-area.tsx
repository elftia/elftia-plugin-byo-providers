/**
 * scroll-area.tsx — VENDORED host UI component (design D1, vendor list).
 *
 * Copied verbatim from the host `@/components/ui/scroll-area.tsx` (no host
 * primitive equivalent; small + self-contained), with the `cn` import repointed
 * to `./cn`. The DOM + class strings are byte-identical to the host wrapper.
 *
 * @module byo-providers/renderer/host/vendored/scroll-area
 */
import * as React from 'react';

import { cn } from './cn';

type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement> & {
  shadow?: boolean;
};

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, shadow = true, ...props }, ref) => (
    // `overflow: clip` (NOT `hidden`): hidden still establishes a scroll
    // container, so any tabbable / focused descendant — or a programmatic
    // `scrollIntoView` on the inner — silently scrolls THIS wrapper too,
    // even though the user can't see it. `clip` paints the same as `hidden`
    // but cannot be scrolled programmatically. Chromium 90+ / Safari 16+.
    <div
      ref={ref}
      className={cn('relative h-full min-h-0', className)}
      style={{ overflow: 'clip' }}
      {...props}
    >
      <div
        data-scroll-container
        className="h-full scroll-smooth overflow-auto rounded-[inherit] pr-2"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          maxHeight: 'inherit',
        }}
      >
        {children}
      </div>
      {shadow ? (
        <>
          <div className="scroll-shadow pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-surface-0 via-surface-0/80 to-transparent" />
          <div className="scroll-shadow pointer-events-none absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-surface-0 via-surface-0/80 to-transparent" />
        </>
      ) : null}
    </div>
  ),
);
ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
