/**
 * hostUi — JSX-usable accessors for `host.ui`.
 *
 * The contract types `host.ui.Button` etc. are `HostComponentType<P>` —
 * structural lower bounds whose return is `HostReactNode`, which TS will NOT
 * accept directly as a JSX element type. The REAL injected components ARE
 * ordinary React components, so this module casts them to `ComponentType<P>` at a
 * single boundary (the recovered DS pattern, git `e0dbd83a^`). Relocated LLM
 * components import these JSX-usable handles instead of `@/components/ui/*`.
 *
 * Read lazily (inside render): the loader installs the host before any plugin
 * body renders, but always after `activate`.
 *
 * @module byo-providers/renderer/host/hostUi
 */
import type { ComponentType } from 'react';

import { getHost } from './hostBridge';

type AnyProps = Record<string, unknown>;

/** `host.ui` primitives as JSX-usable React component types (the 11 host set). */
export function ui(): {
  Button: ComponentType<AnyProps>;
  Dialog: ComponentType<AnyProps>;
  DialogContent: ComponentType<AnyProps>;
  Select: ComponentType<AnyProps>;
  ConfirmDialog: ComponentType<AnyProps>;
  Input: ComponentType<AnyProps>;
  Switch: ComponentType<AnyProps>;
  DropdownMenu: ComponentType<AnyProps>;
  Badge: ComponentType<AnyProps>;
  Slider: ComponentType<AnyProps>;
  Tooltip: ComponentType<AnyProps>;
} {
  return getHost().ui as unknown as ReturnType<typeof ui>;
}
