/**
 * label.tsx — VENDORED host UI component (P2d design D6, vendor list).
 *
 * Copied verbatim from the host `@/components/ui/label.tsx` (host.ui has NO
 * `Label` primitive; small + self-contained), with the `cn` import repointed to
 * `./cn`. The DOM + class strings are byte-identical to the host wrapper. The
 * relocated search `ProviderPanel` imported `@/components/ui/label`; this is its
 * bridge replacement.
 *
 * @module byo-providers/renderer/host/vendored/label
 */
import * as React from 'react';

import { cn } from './cn';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className,
        )}
        {...props}
      >
        {children}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
    );
  },
);

Label.displayName = 'Label';

export { Label };
export type { LabelProps };
