/**
 * searchI18nSeed.ts — harvested byte-identical from the host `@/locales`
 * (`settings/webSearch.json`, the API-provider key subset the relocated
 * `ProviderPanel` reads) for en/zh/ja. DEEP-MERGED into the existing
 * `byo-providers` i18n namespace alongside the LLM + media seeds.
 *
 * The root is `settings.webSearch.*` — it SHARES the `settings` root with the
 * media seed's `settings.status.*` slice, so the merge MUST be a recursive
 * deepMerge (not a shallow spread) for both sub-keys to survive (the vendored
 * `useTranslation` already deepMerges — this seed is added to that merge). The
 * LLM seed's roots (`providerSettings`/`apiMode`/`presetName`/`common`) are
 * disjoint from `settings`.
 *
 * Only the keys the API-key panel actually renders are harvested (the sidebar /
 * general-settings / local-search keys stay host-only — those pieces did NOT
 * migrate). Missing key → key fallback in the resolver.
 *
 * @module byo-providers/renderer/host/vendored/searchI18nSeed
 */
export const searchI18nSeed: Record<string, Record<string, unknown>> = {
  en: {
    settings: {
      webSearch: {
        apiProviders: 'API Providers',
        apiKey: 'API Key',
        deepseekDescription: 'DeepSeek search and page fetching',
        openWebsite: 'Open {{provider}} website',
        deepseekKeyReuse: 'Optional override. When enabled, an available key from an enabled official api.deepseek.com LLM provider is reused on the backend. Custom hosts require their own search key.',
        credentialAvailable: 'Credential available (backend only)',
        credentialMissing: 'No available credential; enable an official DeepSeek LLM provider or enter a search key.',
        clearOverride: 'Clear search key override',
        apiKeyPlaceholder: 'Enter API key (multiple keys separated by comma)',
        apiKeyMultiple: 'Supports multiple keys separated by commas for load balancing',
        apiHost: 'API Host',
        apiHostPlaceholder: 'Custom API host (optional)',
        basicAuthUsername: 'Username',
        basicAuthPassword: 'Password',
        optional: 'Optional',
        validate: 'Validate',
        validationSuccess: 'Configuration valid',
        validationFailed: 'Validation failed',
      },
    },
  },
  zh: {
    settings: {
      webSearch: {
        apiProviders: 'API 服务商',
        apiKey: 'API 密钥',
        deepseekDescription: 'DeepSeek 网络搜索与网页内容读取',
        openWebsite: '打开 {{provider}} 网站',
        deepseekKeyReuse: '可选独立密钥。启用后，后端复用已启用的官方 api.deepseek.com LLM 服务商的可用密钥；自定义地址必须使用独立搜索密钥。',
        credentialAvailable: '密钥可用（仅后端读取）',
        credentialMissing: '暂无可用密钥，请启用官方 DeepSeek LLM 服务商或输入独立搜索密钥。',
        clearOverride: '清除独立搜索密钥',
        apiKeyPlaceholder: '输入 API 密钥（多个密钥用逗号分隔）',
        apiKeyMultiple: '支持多个密钥（逗号分隔）以实现负载均衡',
        apiHost: 'API 地址',
        apiHostPlaceholder: '自定义 API 地址（可选）',
        basicAuthUsername: '用户名',
        basicAuthPassword: '密码',
        optional: '可选',
        validate: '验证',
        validationSuccess: '配置有效',
        validationFailed: '验证失败',
      },
    },
  },
  ja: {
    settings: {
      webSearch: {
        apiProviders: 'APIプロバイダー',
        apiKey: 'APIキー',
        deepseekDescription: 'DeepSeek のウェブ検索とページ取得',
        openWebsite: '{{provider}} のサイトを開く',
        deepseekKeyReuse: '任意の専用キー。検索を有効にすると、有効な公式 api.deepseek.com LLM プロバイダーの利用可能なキーをバックエンドで再利用します。カスタムホストには専用検索キーが必要です。',
        credentialAvailable: '認証情報を利用可能（バックエンドのみ）',
        credentialMissing: '利用可能なキーがありません。公式 DeepSeek LLM プロバイダーを有効にするか、検索キーを入力してください。',
        clearOverride: '専用検索キーを削除',
        apiKeyPlaceholder: 'APIキーを入力（カンマ区切りで複数指定可）',
        apiKeyMultiple: '負荷分散のために複数のキー（カンマ区切り）をサポート',
        apiHost: 'APIホスト',
        apiHostPlaceholder: 'カスタムAPIホスト（オプション）',
        basicAuthUsername: 'ユーザー名',
        basicAuthPassword: 'パスワード',
        optional: 'オプション',
        validate: '検証',
        validationSuccess: '設定は有効です',
        validationFailed: '検証に失敗しました',
      },
    },
  },
};
