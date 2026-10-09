/**
 * Data-only navigation labels used when the renderer runs in an opaque frame.
 * Trusted-parent activation keeps its locale-following label thunk; the host
 * resolves these stable keys for the synchronous settings navigation surface.
 */
export const navigationI18nSeed: Record<string, Record<string, unknown>> = {
  en: {
    navigation: {
      providersGroup: 'Model Services',
    },
  },
  zh: {
    navigation: {
      providersGroup: '模型服务',
    },
  },
  ja: {
    navigation: {
      providersGroup: 'モデルサービス',
    },
  },
};
