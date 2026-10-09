/**
 * dialog.tsx — VENDORED Dialog wrapper (design D1, recovered DS pattern).
 *
 * The host `@/components/ui/dialog` is a thin `@radix-ui/react-dialog` + lucide +
 * `cn` wrapper. The frozen `host.ui` exposes only the `Dialog` ROOT +
 * `DialogContent` — NOT `DialogHeader`/`DialogTitle`/`DialogDescription`/
 * `DialogFooter` (the LLM dialogs use all of them). Rather than widen the frozen
 * `host.ui`, the plugin vendors the FULL dialog set from this single source
 * (copied verbatim from the host wrapper, `cn` repointed to `./cn`), so its
 * dialogs never mix a host.ui root with a vendored title.
 *
 * `@radix-ui/react-dialog` is BUNDLED (DS precedent) and is a HOISTED SINGLETON,
 * so the Radix context the vendored parts read shares the host's instance — the
 * `aria-labelledby` wiring stays intact. Class strings are byte-identical.
 *
 * @module byo-providers/renderer/host/vendored/dialog
 */
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from './cn';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Whether to hide the close button */
  hideCloseButton?: boolean;
}

/**
 * Portal target for vendored dialogs. Agent-ui surfaces render via the HOST's
 * React into HOST DOM while the plugin modules still execute against the
 * compartment frame's `document` — a portal to `document.body` (Radix default,
 * resolved through that frame global) lands in the hidden frame and is
 * physically invisible. The container MUST be captured from the real, live DOM
 * node via a ref callback (refs run in the rendering React's context), never
 * via the `document` global. Surfaces that host dialogs render
 * `<ByoPortalRoot />`; `document.body` remains the fallback.
 */
export const byoPortalTarget: { current: HTMLElement | null } = { current: null };

export function ByoPortalRoot() {
  return <div data-byo-portal-root ref={(el) => { if (el) byoPortalTarget.current = el; }} />;
}

function dialogPortalContainer(): HTMLElement | undefined {
  return byoPortalTarget.current ?? undefined;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideCloseButton, ...props }, ref) => (
  <DialogPortal container={dialogPortalContainer()}>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-surface-0 wallpaper-solid p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className,
      )}
      {...props}
    >
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-surface-1 data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
