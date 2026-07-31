/**
 * cn — vendored clsx+tailwind-merge helper (design D1, vendor list).
 *
 * The host's `@/shared/utils/utils.cn` is a trivial `twMerge(clsx(...))` wrapper.
 * A `plugin://` bundle cannot statically import the host `@/...` module at
 * runtime, and `clsx`/`tailwind-merge` are tiny self-contained deps the plugin
 * bundles. So the plugin vendors its OWN `cn` (byte-equivalent to the host's).
 *
 * @module byo-providers/renderer/host/vendored/cn
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
