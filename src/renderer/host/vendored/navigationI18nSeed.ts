/**
 * Data-only navigation labels used when the renderer runs in an opaque frame.
 * Trusted-parent activation keeps its locale-following label thunk; the host
 * resolves these stable keys for the synchronous settings navigation surface.
 */
export const navigationI18nSeed: Record<string, Record<string, unknown>> = {
  en: {
    navigation: {
      providersGroup: 'Providers',
    },
  },
  zh: {
    navigation: {
      providersGroup: '提供商',
    },
  },
  ja: {
    navigation: {
      providersGroup: 'プロバイダー',
    },
  },
};
