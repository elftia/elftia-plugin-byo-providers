/**
 * ui.tsx — JSX-usable, PROPERLY TYPED named wrappers over the `host.ui`
 * primitives.
 *
 * The relocated LLM components imported `{ Button }` from `@/components/ui/button`
 * etc. A `plugin://` bundle can't reach those host modules, and `host.ui` is only
 * available AFTER `activate`, so each primitive is resolved lazily INSIDE render
 * via `ui()` (the hostUi accessor). These wrappers carry React-friendly prop
 * types (mirroring the host component signatures) so call-site event handlers
 * still infer — the moved files swap only the import PATH.
 *
 * `Dialog`/`DialogContent` + the dialog sub-parts come from the vendored
 * `./vendored/dialog` (the frozen host.ui doesn't expose the sub-parts).
 *
 * @module byo-providers/renderer/host/ui
 */
import * as React from 'react';

import { ui } from './hostUi';

/* ── Prop types (mirror the host `@/components/ui/*` signatures) ─────────────── */

type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'subtle'
  | 'link';
type ButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  density?: 'default' | 'compact';
};

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  size?: 'sm' | 'default';
}

export type SwitchProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'checked' | 'defaultChecked'
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
};

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  onConfirm: () => void;
}

/* ── Lazy host-resolving wrappers ───────────────────────────────────────────── */

function makeWrapper<P>(name: keyof ReturnType<typeof ui>): React.ComponentType<P> {
  const Wrapped = React.forwardRef<unknown, P>((props, ref) => {
    const Comp = ui()[name] as unknown as React.ComponentType<
      P & { ref?: React.Ref<unknown> }
    >;
    return React.createElement(Comp, { ...(props as P), ref });
  });
  Wrapped.displayName = `Host(${String(name)})`;
  return Wrapped as unknown as React.ComponentType<P>;
}

export const Button = makeWrapper<ButtonProps>('Button');
export const Input = makeWrapper<InputProps>('Input');
export const Select = makeWrapper<SelectProps>('Select');
export const Switch = makeWrapper<SwitchProps>('Switch');
export const Badge = makeWrapper<BadgeProps>('Badge');
export const ConfirmDialog = makeWrapper<ConfirmDialogProps>('ConfirmDialog');
