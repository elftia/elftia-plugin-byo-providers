/**
 * modelServicesI18nSeed — plugin-owned i18n seed for the unified model-services
 * page (omnicross UpstreamsPage parity) and its provider template picker.
 *
 * Unlike the harvested seeds (llm/media/search/subscription), every string here
 * is FIRST-PARTY plugin copy that exists in no host locale export, so the seed
 * is authored in place (the `navigationI18nSeed` precedent) for en/zh/ja — the
 * plugin's full locale set. Deep-merged into the `byo-providers` namespace by
 * `useTranslation.buildMergedSeed`.
 *
 * @module byo-providers/renderer/host/vendored/modelServicesI18nSeed
 */
export const modelServicesI18nSeed: Record<string, Record<string, unknown>> = {
  en: {
    modelServices: {
      title: 'Model Services',
      addAccount: 'Add Account',
      addProvider: 'Add Provider',
      addProviderDescription:
        'Pick a provider template from the catalog, or start from a bare API type.',
      addAccountTitle: 'Add Account',
      addAccountDescription:
        'Choose a subscription provider — its sign-in / manual-token card opens right here.',
      searchPlaceholder: 'Search accounts and providers…',
      filter: {
        all: 'All',
        account: 'Accounts',
        provider: 'Providers',
      },
      kind: {
        accountPool: 'Accounts',
        account: 'Account',
        provider: 'Provider',
      },
      status: {
        ready: 'Ready',
        disabled: 'Disabled',
        needsKey: 'Needs key',
        active: 'Active',
      },
      accountCount: '{{count}} account(s)',
      modelCount: '{{count}} model(s)',
      empty: {
        providers: 'No providers yet.',
        providersCta: 'Add one from a template',
        accounts: 'No subscription accounts yet.',
        none: 'Select an account or provider to manage it.',
        filtered: 'Nothing matches this filter.',
      },
      presets: {
        customTitle: 'Start from an API type',
        customDescription:
          'No template needed — opens a blank provider form prefilled with that wire format’s defaults.',
        searchPlaceholder: 'Search presets…',
        empty: 'No presets match your search.',
      },
    },
  },
  zh: {
    modelServices: {
      title: '模型服务',
      addAccount: '添加账号',
      addProvider: '添加提供商',
      addProviderDescription: '从目录中选择提供商模板，或从 API 类型开始。',
      addAccountTitle: '添加账号',
      addAccountDescription: '选择一个订阅提供商——登录 / 手动令牌卡片会在这里打开。',
      searchPlaceholder: '搜索账号与提供商…',
      filter: {
        all: '全部',
        account: '账号',
        provider: '提供商',
      },
      kind: {
        accountPool: '账号',
        account: '账号',
        provider: '提供商',
      },
      status: {
        ready: '就绪',
        disabled: '已禁用',
        needsKey: '缺少密钥',
        active: '使用中',
      },
      accountCount: '{{count}} 个账号',
      modelCount: '{{count}} 个模型',
      empty: {
        providers: '还没有提供商。',
        providersCta: '从模板添加一个',
        accounts: '还没有订阅账号。',
        none: '选择一个账号或提供商进行管理。',
        filtered: '没有匹配该筛选的资源。',
      },
      presets: {
        customTitle: '从 API 类型开始',
        customDescription: '无需模板——打开预填该线格式默认值的空白提供商表单。',
        searchPlaceholder: '搜索预设…',
        empty: '没有匹配搜索的预设。',
      },
    },
  },
  ja: {
    modelServices: {
      title: 'モデルサービス',
      addAccount: 'アカウントを追加',
      addProvider: 'プロバイダーを追加',
      addProviderDescription:
        'カタログからプロバイダーテンプレートを選ぶか、API タイプから開始します。',
      addAccountTitle: 'アカウントを追加',
      addAccountDescription:
        'サブスクリプションプロバイダーを選ぶと、サインイン / 手動トークンのカードがここで開きます。',
      searchPlaceholder: 'アカウントとプロバイダーを検索…',
      filter: {
        all: 'すべて',
        account: 'アカウント',
        provider: 'プロバイダー',
      },
      kind: {
        accountPool: 'アカウント',
        account: 'アカウント',
        provider: 'プロバイダー',
      },
      status: {
        ready: '準備完了',
        disabled: '無効',
        needsKey: 'キーが必要',
        active: '使用中',
      },
      accountCount: '{{count}} 個のアカウント',
      modelCount: '{{count}} 個のモデル',
      empty: {
        providers: 'プロバイダーはまだありません。',
        providersCta: 'テンプレートから追加',
        accounts: 'サブスクリプションアカウントはまだありません。',
        none: '管理するアカウントまたはプロバイダーを選択してください。',
        filtered: 'このフィルターに一致するリソースはありません。',
      },
      presets: {
        customTitle: 'API タイプから開始',
        customDescription:
          'テンプレート不要 — そのワイヤー形式のデフォルトを事前入力した空のフォームを開きます。',
        searchPlaceholder: 'プリセットを検索…',
        empty: '検索に一致するプリセットはありません。',
      },
    },
  },
};
