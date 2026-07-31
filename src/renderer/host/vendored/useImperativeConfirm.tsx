/**
 * useImperativeConfirm — a vendored, media-specific adapter that turns the host's
 * DECLARATIVE `host.ui.ConfirmDialog` component into the host uiStore's
 * IMPERATIVE `useConfirmDialog(): (opts) => Promise<boolean>` hook (design D1).
 *
 * The relocated media panels call `const confirm = useConfirmDialog();` then
 * `await confirm({ title, description, confirmLabel, cancelLabel, tone })` and
 * branch on the returned boolean. The host plugin surface exposes only the
 * `ConfirmDialog` COMPONENT (a `{ open, onOpenChange, onConfirm, … }` controlled
 * dialog), not the imperative hook — so this thin provider holds the
 * open/options/resolver state, renders the host component once at the section
 * root, and resolves the awaited promise:
 *   - `true`  on confirm,
 *   - `false` on cancel / dismiss (the `onOpenChange(false)` path).
 *
 * Tone mapping: the uiStore options use `tone: 'default' | 'warning' | 'danger'`,
 * but `host.ui.ConfirmDialog` takes `variant: 'default' | 'destructive'`. We map
 * `danger` → `destructive`, everything else → `default`.
 *
 * Mount `<ImperativeConfirmProvider>` ONCE per media section root; the panels
 * inside read `useConfirmDialog()`.
 *
 * @module byo-providers/renderer/host/vendored/useImperativeConfirm
 */
import * as React from 'react';

import { ConfirmDialog } from '../ui';

/** The uiStore confirm tone (mirrors the host `ConfirmDialogTone`). */
export type ConfirmTone = 'default' | 'warning' | 'danger';

/** The imperative confirm options (mirrors the host `ConfirmDialogOptions`). */
export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string | null;
  tone?: ConfirmTone;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ImperativeConfirmContext = React.createContext<ConfirmFn | null>(null);

interface PendingRequest extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/**
 * Holds the imperative-confirm state + renders `host.ui.ConfirmDialog`. Mount
 * once at the section root; descendants read {@link useConfirmDialog}.
 */
export function ImperativeConfirmProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [request, setRequest] = React.useState<PendingRequest | null>(null);

  const confirm = React.useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setRequest((prev) => {
        // A still-open prior request settles as cancelled before replacement
        // (matches the host uiStore semantics).
        prev?.resolve(false);
        return { ...options, resolve };
      });
    });
  }, []);

  const settle = React.useCallback((value: boolean) => {
    setRequest((prev) => {
      prev?.resolve(value);
      return null;
    });
  }, []);

  const variant: 'default' | 'destructive' =
    request?.tone === 'danger' ? 'destructive' : 'default';

  return (
    <ImperativeConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={request !== null}
        onOpenChange={(open: boolean) => {
          // The host fires onOpenChange(false) on cancel/dismiss/Esc/backdrop.
          if (!open) settle(false);
        }}
        title={request?.title ?? ''}
        description={request?.description}
        confirmLabel={request?.confirmLabel}
        cancelLabel={request?.cancelLabel ?? undefined}
        variant={variant}
        onConfirm={() => settle(true)}
      />
    </ImperativeConfirmContext.Provider>
  );
}

/**
 * The imperative confirm hook — a drop-in for the host uiStore's
 * `useConfirmDialog()`. Returns `(options) => Promise<boolean>`. Throws if used
 * outside an {@link ImperativeConfirmProvider} (a programming error — the section
 * wraps its panel in the provider).
 */
export function useConfirmDialog(): ConfirmFn {
  const ctx = React.useContext(ImperativeConfirmContext);
  if (!ctx) {
    throw new Error(
      '[byo-providers] useConfirmDialog() used outside <ImperativeConfirmProvider> — ' +
        'mount the provider at the media section root.',
    );
  }
  return ctx;
}
