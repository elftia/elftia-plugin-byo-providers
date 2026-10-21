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
    sharedKeys: {
      owner: 'This key is shared with other supported model types. Updating it here updates those configurations.',
      borrowed: 'Using a shared provider key. Entering a key here creates an independent configuration for this type.',
    },
    logjev: {
      upstream: 'Language model provider', upstreamModel: 'Model',
      upstreamNote: 'Choose an enabled OpenAI-compatible provider from Language Models. LogJev reuses its URL and API key; the selected model must support logprobs.',
      selectProvider: 'Select a provider', unavailable: 'unavailable',
      noProviders: 'Enable an OpenAI Chat Completions provider in Language Models first.',
      modelPlaceholder: 'Enter a model ID', prompt: 'Prompt mode', full: 'Full', minimal: 'Minimal',
      topk: 'Top logprobs (1–100)', save: 'Save', saved: 'Saved',
    },
    decisionModels: {
      title: 'Decision Models',
      description: 'Manage Jev, LogJev and OpenRouter Decisions providers, API keys and models.',
      add: 'Add Decision Provider',
      empty: 'Add a decision provider to configure its API key and models.',
    },
    modelServices: {
      title: 'Language Models',
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
    sharedKeys: {
      owner: '此 Key 已与其他支持的模型类型共用。在这里修改后，共用配置会一起更新。',
      borrowed: '正在共用同一服务商的 Key。在这里单独填写 Key，将改为此类型的独立配置。',
    },
    logjev: {
      upstream: '大语言模型 Provider', upstreamModel: '模型',
      upstreamNote: '从大语言模型中选择已启用的 OpenAI 兼容 Provider，复用其地址与 API Key。所选模型需支持 logprobs。',
      selectProvider: '请选择 Provider', unavailable: '不可用',
      noProviders: '请先在大语言模型中启用一个 OpenAI Chat Completions Provider。',
      modelPlaceholder: '输入模型 ID', prompt: '提示词模式', full: '完整', minimal: '精简',
      topk: 'Top logprobs（1–100）', save: '保存', saved: '已保存',
    },
    decisionModels: {
      title: '决策模型',
      description: '管理 Jev、LogJev 和 OpenRouter Decisions 的提供商、API 密钥与模型。',
      add: '添加决策提供商',
      empty: '添加一个决策提供商，配置其 API 密钥与模型。',
    },
    modelServices: {
      title: '大语言模型',
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
    sharedKeys: {
      owner: 'このキーは対応する他のモデル種別と共有されています。ここで変更すると共有先にも反映されます。',
      borrowed: '同じプロバイダーのキーを共有しています。ここでキーを入力すると、この種別専用の設定になります。',
    },
    logjev: {
      upstream: '言語モデルのプロバイダー', upstreamModel: 'モデル',
      upstreamNote: '言語モデルで有効な OpenAI 互換プロバイダーを選択すると、URL と API キーを再利用します。モデルは logprobs をサポートする必要があります。',
      selectProvider: 'プロバイダーを選択', unavailable: '利用不可',
      noProviders: '言語モデルで OpenAI Chat Completions プロバイダーを有効にしてください。',
      modelPlaceholder: 'モデル ID を入力', prompt: 'プロンプトモード', full: '完全', minimal: '最小',
      topk: 'Top logprobs（1–100）', save: '保存', saved: '保存しました',
    },
    decisionModels: {
      title: '意思決定モデル',
      description: 'Jev、LogJev、OpenRouter Decisions のプロバイダー、API キー、モデルを管理します。',
      add: '意思決定プロバイダーを追加',
      empty: '意思決定プロバイダーを追加して API キーとモデルを設定します。',
    },
    modelServices: {
      title: '大規模言語モデル',
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
