/**
 * MediaProviderSettings.tsx - 媒体 Provider 设置主组件（plugin port）
 *
 * 根据 mediaType 渲染对应的设置面板。每个面板经 `React.lazy` 拆分为独立 chunk，
 * 这样插件 activate 入口与各面板互不牵连（DS/P2b lazy 先例）。`react` 由 host 在
 * 运行时提供（externalized），所以这里可以静态 import React 用于 `lazy`/`Suspense`。
 *
 * @module byo-providers/renderer/media/MediaProviderSettings
 */
import * as React from 'react';

import type { MediaType } from './types';

const ImageProviderSettingsPanel = React.lazy(() =>
  import('./ImageProviderSettingsPanel').then((m) => ({ default: m.ImageProviderSettingsPanel })),
);
const VideoProviderSettingsPanel = React.lazy(() =>
  import('./VideoProviderSettingsPanel').then((m) => ({ default: m.VideoProviderSettingsPanel })),
);
const MusicProviderSettingsPanel = React.lazy(() =>
  import('./MusicProviderSettingsPanel').then((m) => ({ default: m.MusicProviderSettingsPanel })),
);
const TtsProviderSettingsPanel = React.lazy(() =>
  import('./TtsProviderSettingsPanel').then((m) => ({ default: m.TtsProviderSettingsPanel })),
);
const AsrProviderSettingsPanel = React.lazy(() =>
  import('./AsrProviderSettingsPanel').then((m) => ({ default: m.AsrProviderSettingsPanel })),
);
// The encrypted credential migration-pack bar (`secrets-pack-media-search`) — one
// pack migrates ALL domains (LLM + media + search), so it sits at the top of every
// media settings page. Lazy-split like the host `llm/ProviderSettings.tsx`.
const MigrationPackDialogs = React.lazy(() =>
  import('../shared/MigrationPackDialogs').then((m) => ({ default: m.MigrationPackDialogs })),
);

interface MediaProviderSettingsProps {
  mediaType: MediaType;
}

const PANELS: Record<MediaType, React.ComponentType> = {
  image: ImageProviderSettingsPanel,
  video: VideoProviderSettingsPanel,
  music: MusicProviderSettingsPanel,
  asr: AsrProviderSettingsPanel,
  tts: TtsProviderSettingsPanel,
};

/**
 * 媒体 Provider 设置组件 — 根据 mediaType 切换显示对应的 Provider 设置面板。
 *
 * @param mediaType - 媒体类型 ('image' | 'video' | 'music' | 'asr' | 'tts')
 */
function MediaProviderSettings({ mediaType }: MediaProviderSettingsProps) {
  const Panel = PANELS[mediaType] ?? MusicProviderSettingsPanel;
  return (
    <>
      <React.Suspense fallback={null}>
        <MigrationPackDialogs />
      </React.Suspense>
      <React.Suspense fallback={<div className="p-4 text-sm text-muted-foreground">…</div>}>
        <Panel />
      </React.Suspense>
    </>
  );
}

export default MediaProviderSettings;
