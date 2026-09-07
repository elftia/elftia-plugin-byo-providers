/**
 * subscriptionI18nSeed — vendored subscription/OAuth/CLI-account i18n seed (harvested from the host
 * `settings/accountTokens.json` en/zh/ja). Wrapped under the `settings.accountTokens.*`
 * root the relocated UI's `t()` calls expect; DEEP-merged into the
 * `byo-providers` namespace (`byo-p2-subscription`).
 *
 * @module byo-providers/renderer/host/vendored/subscriptionI18nSeed
 */
export const subscriptionI18nSeed: Record<string, Record<string, unknown>> = {
  "en": {
    "settings": {
      "accountTokens": {
        "title": "Account Tokens",
        "description": "Manage accounts signed in within Elftia for Claude, Codex, and Gemini. Native CLI logins are managed separately.",
        "status": {
          "unconfigured": "Not configured",
          "authorized": "Authorized",
          "configured": "Configured",
          "expired": "Expired",
          "error": "Error"
        },
        "claude": {
          "title": "Claude (Anthropic)",
          "description": "OAuth token for Anthropic's Claude Code CLI"
        },
        "codex": {
          "title": "Codex (OpenAI)",
          "description": "OAuth token for OpenAI's Codex CLI",
          "loopbackWaiting": "Complete the sign-in in your browser — Elftia picks it up automatically.",
          "loopbackHint": "Waiting for the browser callback (127.0.0.1:1455)… the account is added automatically when done — no code to paste.",
          "reopenAuthPage": "Reopen authorization page",
          "fallbackToPaste": "Paste code manually instead",
          "loopbackCancel": "Cancel",
          "loopbackErrors": {
            "timeout": "The sign-in timed out. Please start again.",
            "failed": "The sign-in failed. Please start again."
          }
        },
        "gemini": {
          "title": "Gemini (Google)",
          "description": "OAuth token for Google's Gemini CLI"
        },
        "kimi": {
          "title": "Kimi Code (Moonshot)",
          "description": "Sign in with your Kimi account using a device code; managed entirely inside Elftia.",
          "addAccount": "Sign in with Kimi",
          "flowInstructions": "Open the verification page and enter this code to sign in with your Kimi account.",
          "openVerification": "Open verification page",
          "waitingForApproval": "Waiting for approval…",
          "cancel": "Cancel",
          "flowDone": "Kimi account added.",
          "flowErrors": {
            "expired": "The device code expired or was denied. Please start again."
          }
        },
        "grok": {
          "title": "Grok (xAI SuperGrok)",
          "description": "Sign in with your SuperGrok account using a device code; managed entirely inside Elftia.",
          "addAccount": "Sign in with Grok",
          "flowInstructions": "Open the verification page and enter this code to sign in with your xAI account.",
          "openVerification": "Open verification page",
          "waitingForApproval": "Waiting for approval…",
          "cancel": "Cancel",
          "flowDone": "Grok account added.",
          "flowErrors": {
            "expired": "The device code expired or was denied. Please start again."
          }
        },
        "copilot": {
          "title": "GitHub Copilot",
          "description": "Sign in with GitHub using a device code; the long-lived token is managed entirely inside Elftia.",
          "addAccount": "Sign in with GitHub",
          "flowInstructions": "Open the verification page and enter this code to authorize the Copilot CLI app.",
          "openVerification": "Open verification page",
          "waitingForApproval": "Waiting for approval…",
          "cancel": "Cancel",
          "flowDone": "Copilot account added.",
          "enterpriseLabel": "GitHub Enterprise domain (optional)",
          "enterprisePlaceholder": "company.ghe.com — leave empty for personal GitHub",
          "flowErrors": {
            "expired": "The device code expired or was denied. Please start again."
          }
        },
        "authMethod": {
          "label": "Authorization Method",
          "oauth": {
            "label": "OAuth Authorization",
            "desc": "Full access with automatic token refresh"
          },
          "setup_token": {
            "label": "Setup Token",
            "desc": "Inference only, long-lived, no refresh needed"
          },
          "manual": {
            "label": "Manual Input",
            "desc": "Manually manage Access Token"
          }
        },
        "subscriptionLevel": {
          "label": "Subscription Level",
          "free": {
            "label": "Free",
            "desc": "Basic features"
          },
          "pro": {
            "label": "Pro",
            "desc": "Supports Opus 4.5 model"
          },
          "max": {
            "label": "Max",
            "desc": "Supports all Opus models"
          }
        },
        "tokenType": "Token Type",
        "actions": {
          "authorize": "Authorize",
          "refresh": "Refresh Token",
          "clear": "Clear",
          "enterToken": "Enter Token"
        },
        "oauth": {
          "step1": {
            "title": "Step 1: Open Authorization Page",
            "desc": "Click the button below to open the authorization page in your browser"
          },
          "step2": {
            "title": "Step 2: Sign In and Authorize",
            "desc": "Sign in with your account and click the authorize button"
          },
          "step3": {
            "title": "Step 3: Copy Authorization Code",
            "desc": "After authorization, the page will display an authorization code. Please copy it."
          },
          "step4": {
            "title": "Step 4: Paste Authorization Code",
            "desc": "Paste the copied authorization code in the input field below"
          },
          "openAuthPage": "Open Authorization Page",
          "showUrl": "Show authorization URL"
        },
        "oauthFlow": {
          "instructions": "Click the link below to authorize in your browser. After authorizing, paste the code here.",
          "pasteCode": "Authorization Code",
          "codePlaceholder": "Paste the authorization code here...",
          "authorize": "Complete Authorization",
          "emptyCode": "Please paste the authorization code.",
          "stateMismatch": "The pasted state does not match — possible CSRF. Please restart the authorization flow."
        },
        "manual": {
          "title": "Enter Access Token",
          "accessToken": "Access Token",
          "accessToken.placeholder": "Paste your Access Token here",
          "refreshToken": "Refresh Token",
          "refreshToken.placeholder": "Used for automatic token refresh",
          "hint": "You can obtain the token from the developer settings page",
          "claude": {
            "description": "Manually enter Claude Access Token. You can get it from Claude.ai developer settings or other sources."
          },
          "codex": {
            "description": "Manually enter OpenAI Access Token. You can get it from the OpenAI API dashboard."
          },
          "gemini": {
            "description": "Manually enter Gemini Access Token. You can get it from Google AI Studio or Cloud Console."
          }
        },
        "expiresAt": "Expires at",
        "lastRefreshed": "Last refreshed",
        "accounts": {
          "title": "Accounts",
          "active": "Active",
          "setActive": "Set active",
          "remove": "Remove account",
          "addAccount": "Add account",
          "labelInput": "Account label",
          "labelPlaceholder": "e.g. Personal, Work",
          "saveLabel": "Save account label",
          "updateLabelFailed": "Failed to update account label.",
          "incognitoHint": "To add a different account, open the authorization page in an incognito window or log out of claude.ai first — otherwise you will re-authorize the account you are already signed into.",
          "duplicateTokenWarning": "Another account shares this credential. Refreshing either account will sign the other out."
        },
        "openCodeGo": {
          "title": "OpenCode",
          "description": "Static API key for OpenCodeGo and OpenCodeZen proxy upstreams",
          "apiKeyLabel": "API Key",
          "apiKeyPlaceholder": "Paste your OpenCode API key",
          "apiKeyRequired": "An API key is required.",
          "addFailed": "Failed to add account",
          "baseUrlLabel": "Base URL (optional)",
          "baseUrlPlaceholder": "Override the default OpenCodeGo host",
          "zenBaseUrlLabel": "Zen Base URL (optional)",
          "zenBaseUrlPlaceholder": "Override the default opencode-Zen host"
        },
        "allowance": {
          "title": "Usage quota",
          "refresh": "Refresh usage quota",
          "stateFresh": "Up to date",
          "stateStale": "Stale — last known usage",
          "stateUnavailable": "Usage unavailable",
          "stateUnsupported": "No usage endpoint for this account type",
          "resetsAt": "Resets at {{time}}"
        },
        "models": {
          "title": "Models",
          "add": "+ Add model",
          "kindChat": "Chat",
          "kindImage": "Image",
          "defaultBadge": "Default",
          "removeModel": "Remove model",
          "placeholder": "Model id",
          "save": "Save",
          "errorEmpty": "Enter a model id.",
          "errorDuplicate": "This model already exists.",
          "errorSave": "Failed to save models."
        },
        "errors": {
          "refreshFailed": "Failed to refresh token"
        },
        "info": {
          "title": "About Account Tokens",
          "description": "Tokens are securely encrypted and stored locally. Elftia refreshes its own account tokens without reading or writing native CLI credential files. Existing imported accounts are retained; if refreshing one fails, sign in independently within Elftia to obtain a separate login instead of importing from the CLI again."
        }
      }
    }
  },
  "zh": {
    "settings": {
      "accountTokens": {
        "title": "账号Token",
        "description": "管理在 Elftia 内登录的 Claude、Codex 和 Gemini 账号。本机 CLI 登录独立管理。",
        "status": {
          "unconfigured": "未配置",
          "authorized": "已授权",
          "configured": "已配置",
          "expired": "已过期",
          "error": "错误"
        },
        "claude": {
          "title": "Claude (Anthropic)",
          "description": "Anthropic Claude Code CLI的OAuth令牌"
        },
        "codex": {
          "title": "Codex (OpenAI)",
          "description": "OpenAI Codex CLI的OAuth令牌",
          "loopbackWaiting": "在浏览器中完成登录即可，Elftia 会自动完成授权。",
          "loopbackHint": "等待浏览器回调（127.0.0.1:1455）…完成后自动添加账号，无需粘贴授权码。",
          "reopenAuthPage": "重新打开授权页面",
          "fallbackToPaste": "改为手动粘贴授权码",
          "loopbackCancel": "取消",
          "loopbackErrors": {
            "timeout": "登录超时，请重新开始。",
            "failed": "登录失败，请重新开始。"
          }
        },
        "gemini": {
          "title": "Gemini (Google)",
          "description": "Google Gemini CLI的OAuth令牌"
        },
        "kimi": {
          "title": "Kimi Code（月之暗面）",
          "description": "使用设备码登录 Kimi 账号，凭证完全由 Elftia 内部管理。",
          "addAccount": "登录 Kimi",
          "flowInstructions": "打开验证页面并输入此代码，使用你的 Kimi 账号登录。",
          "openVerification": "打开验证页面",
          "waitingForApproval": "等待授权确认…",
          "cancel": "取消",
          "flowDone": "已添加 Kimi 账号。",
          "flowErrors": {
            "expired": "设备码已过期或被拒绝，请重新开始。"
          }
        },
        "grok": {
          "title": "Grok（xAI SuperGrok）",
          "description": "使用设备码登录 SuperGrok 账号，凭证完全由 Elftia 内部管理。",
          "addAccount": "登录 Grok",
          "flowInstructions": "打开验证页面并输入此代码，使用你的 xAI 账号登录。",
          "openVerification": "打开验证页面",
          "waitingForApproval": "等待授权确认…",
          "cancel": "取消",
          "flowDone": "已添加 Grok 账号。",
          "flowErrors": {
            "expired": "设备码已过期或被拒绝，请重新开始。"
          }
        },
        "copilot": {
          "title": "GitHub Copilot",
          "description": "使用设备码通过 GitHub 登录，长期令牌完全由 Elftia 内部管理。",
          "addAccount": "通过 GitHub 登录",
          "flowInstructions": "打开验证页面并输入此代码，授权 Copilot CLI 应用。",
          "openVerification": "打开验证页面",
          "waitingForApproval": "等待授权确认…",
          "cancel": "取消",
          "flowDone": "已添加 Copilot 账号。",
          "enterpriseLabel": "GitHub Enterprise 域名（可选）",
          "enterprisePlaceholder": "company.ghe.com——个人 GitHub 请留空",
          "flowErrors": {
            "expired": "设备码已过期或被拒绝，请重新开始。"
          }
        },
        "authMethod": {
          "label": "授权方式",
          "oauth": {
            "label": "OAuth 授权",
            "desc": "完整功能，自动刷新令牌"
          },
          "setup_token": {
            "label": "Setup Token",
            "desc": "仅推理权限，长期有效，无需刷新"
          },
          "manual": {
            "label": "手动输入",
            "desc": "手动管理 Access Token"
          }
        },
        "subscriptionLevel": {
          "label": "订阅级别",
          "free": {
            "label": "Free",
            "desc": "基础功能"
          },
          "pro": {
            "label": "Pro",
            "desc": "支持 Opus 4.5 模型"
          },
          "max": {
            "label": "Max",
            "desc": "支持所有 Opus 模型"
          }
        },
        "tokenType": "令牌类型",
        "actions": {
          "authorize": "授权",
          "refresh": "刷新令牌",
          "clear": "清除",
          "enterToken": "输入令牌"
        },
        "oauth": {
          "step1": {
            "title": "步骤 1：打开授权页面",
            "desc": "点击下方按钮，在浏览器中打开授权页面"
          },
          "step2": {
            "title": "步骤 2：登录并授权",
            "desc": "使用您的账号登录并点击授权按钮"
          },
          "step3": {
            "title": "步骤 3：复制授权码",
            "desc": "授权成功后，页面会显示授权码，请复制该授权码"
          },
          "step4": {
            "title": "步骤 4：粘贴授权码",
            "desc": "将复制的授权码粘贴到下方输入框"
          },
          "openAuthPage": "打开授权页面",
          "showUrl": "显示授权链接"
        },
        "oauthFlow": {
          "instructions": "点击下方链接在浏览器中授权。授权完成后，将代码粘贴到此处。",
          "pasteCode": "授权代码",
          "codePlaceholder": "在此粘贴授权代码...",
          "authorize": "完成授权",
          "emptyCode": "请粘贴授权代码。",
          "stateMismatch": "粘贴的 state 不匹配——可能存在 CSRF 风险。请重新发起授权流程。"
        },
        "manual": {
          "title": "输入 Access Token",
          "accessToken": "Access Token",
          "accessToken.placeholder": "粘贴您的 Access Token",
          "refreshToken": "Refresh Token",
          "refreshToken.placeholder": "用于自动刷新 Access Token",
          "hint": "您可以从开发者设置页面获取令牌",
          "claude": {
            "description": "手动输入 Claude Access Token。您可以从 Claude.ai 开发者设置或其他来源获取。"
          },
          "codex": {
            "description": "手动输入 OpenAI Access Token。您可以从 OpenAI API 仪表板获取。"
          },
          "gemini": {
            "description": "手动输入 Gemini Access Token。您可以从 Google AI Studio 或云控制台获取。"
          }
        },
        "expiresAt": "过期时间",
        "lastRefreshed": "上次刷新",
        "accounts": {
          "title": "账号",
          "active": "当前",
          "setActive": "设为当前",
          "remove": "移除账号",
          "addAccount": "添加账号",
          "labelInput": "账号标签",
          "labelPlaceholder": "例如：个人、工作",
          "saveLabel": "保存账号标签",
          "updateLabelFailed": "更新账号标签失败。",
          "incognitoHint": "要添加不同的账号，请先在隐身窗口中打开授权页面，或先退出 claude.ai 登录——否则将重新授权你当前已登录的账号。",
          "duplicateTokenWarning": "另一个账号与此账号共用同一凭据，刷新任意一个都会使另一个失效。"
        },
        "openCodeGo": {
          "title": "OpenCode",
          "description": "OpenCodeGo 与 OpenCodeZen 代理上游使用的静态 API 密钥",
          "apiKeyLabel": "API 密钥",
          "apiKeyPlaceholder": "粘贴你的 OpenCode API 密钥",
          "apiKeyRequired": "请填写 API 密钥。",
          "addFailed": "添加账号失败",
          "baseUrlLabel": "Base URL（可选）",
          "baseUrlPlaceholder": "覆盖默认的 OpenCodeGo 主机地址",
          "zenBaseUrlLabel": "Zen Base URL（可选）",
          "zenBaseUrlPlaceholder": "覆盖默认的 opencode-Zen 主机地址"
        },
        "allowance": {
          "title": "用量额度",
          "refresh": "刷新用量额度",
          "stateFresh": "已更新",
          "stateStale": "已过期——显示上次用量",
          "stateUnavailable": "暂无法获取用量",
          "stateUnsupported": "此账号类型没有用量接口",
          "resetsAt": "{{time}} 重置"
        },
        "models": {
          "title": "模型",
          "add": "+ 添加模型",
          "kindChat": "对话",
          "kindImage": "画图",
          "defaultBadge": "默认",
          "removeModel": "移除模型",
          "placeholder": "模型 ID",
          "save": "保存",
          "errorEmpty": "请输入模型 ID。",
          "errorDuplicate": "该模型已存在。",
          "errorSave": "保存模型失败。"
        },
        "errors": {
          "refreshFailed": "刷新令牌失败"
        },
        "info": {
          "title": "关于账号Token",
          "description": "令牌经过安全加密并存储在本地。Elftia 仅刷新内部账号的令牌，不读取或写入本机 CLI 的凭证文件。此前导入的账号会保留；若刷新失败，请在 Elftia 内独立重新登录以获取单独的登录凭证，不再从 CLI 导入。"
        }
      }
    }
  },
  "ja": {
    "settings": {
      "accountTokens": {
        "title": "アカウントトークン",
        "description": "Elftia 内でログインした Claude、Codex、Gemini アカウントを管理します。ネイティブ CLI のログインは別に管理されます。",
        "status": {
          "unconfigured": "未設定",
          "authorized": "認証済み",
          "configured": "設定済み",
          "expired": "期限切れ",
          "error": "エラー"
        },
        "claude": {
          "title": "Claude (Anthropic)",
          "description": "Anthropic Claude Code CLIのOAuthトークン"
        },
        "codex": {
          "title": "Codex (OpenAI)",
          "description": "OpenAI Codex CLIのOAuthトークン",
          "loopbackWaiting": "ブラウザーでログインを完了すれば、Elftia が自動で授権を完了します。",
          "loopbackHint": "ブラウザーコールバック（127.0.0.1:1455）を待機中…完了後アカウントが自動追加されます（コードの貼り付け不要）。",
          "reopenAuthPage": "認可ページを再開する",
          "fallbackToPaste": "代わりにコードを手動貼り付け",
          "loopbackCancel": "キャンセル",
          "loopbackErrors": {
            "timeout": "ログインがタイムアウトしました。もう一度実行してください。",
            "failed": "ログインに失敗しました。もう一度実行してください。"
          }
        },
        "gemini": {
          "title": "Gemini (Google)",
          "description": "Google Gemini CLIのOAuthトークン"
        },
        "kimi": {
          "title": "Kimi Code（Moonshot）",
          "description": "デバイスコードでKimiアカウントにログインします。認証情報はElftia内でのみ管理されます。",
          "addAccount": "Kimiでログイン",
          "flowInstructions": "確認ページを開き、このコードを入力してKimiアカウントでログインしてください。",
          "openVerification": "確認ページを開く",
          "waitingForApproval": "承認を待っています…",
          "cancel": "キャンセル",
          "flowDone": "Kimiアカウントを追加しました。",
          "flowErrors": {
            "expired": "デバイスコードの有効期限が切れたか拒否されました。最初からやり直してください。"
          }
        },
        "grok": {
          "title": "Grok（xAI SuperGrok）",
          "description": "デバイスコードでSuperGrokアカウントにログインします。認証情報はElftia内でのみ管理されます。",
          "addAccount": "Grokでログイン",
          "flowInstructions": "確認ページを開き、このコードを入力してxAIアカウントでログインしてください。",
          "openVerification": "確認ページを開く",
          "waitingForApproval": "承認を待っています…",
          "cancel": "キャンセル",
          "flowDone": "Grokアカウントを追加しました。",
          "flowErrors": {
            "expired": "デバイスコードの有効期限が切れたか拒否されました。最初からやり直してください。"
          }
        },
        "copilot": {
          "title": "GitHub Copilot",
          "description": "デバイスコードでGitHubにログインします。長期トークンはElftia内でのみ管理されます。",
          "addAccount": "GitHubでログイン",
          "flowInstructions": "確認ページを開き、このコードを入力してCopilot CLIアプリを承認してください。",
          "openVerification": "確認ページを開く",
          "waitingForApproval": "承認を待っています…",
          "cancel": "キャンセル",
          "flowDone": "Copilotアカウントを追加しました。",
          "enterpriseLabel": "GitHub Enterpriseドメイン（任意）",
          "enterprisePlaceholder": "company.ghe.com — 個人GitHubの場合は空欄のまま",
          "flowErrors": {
            "expired": "デバイスコードの有効期限が切れたか拒否されました。最初からやり直してください。"
          }
        },
        "authMethod": {
          "label": "認証方式",
          "oauth": {
            "label": "OAuth認証",
            "desc": "フル機能、トークン自動更新"
          },
          "setup_token": {
            "label": "セットアップトークン",
            "desc": "推論のみ、長期有効、更新不要"
          },
          "manual": {
            "label": "手動入力",
            "desc": "アクセストークンを手動で管理"
          }
        },
        "subscriptionLevel": {
          "label": "サブスクリプションレベル",
          "free": {
            "label": "Free",
            "desc": "基本機能"
          },
          "pro": {
            "label": "Pro",
            "desc": "Opus 4.5 モデルをサポート"
          },
          "max": {
            "label": "Max",
            "desc": "すべての Opus モデルをサポート"
          }
        },
        "tokenType": "トークンタイプ",
        "actions": {
          "authorize": "認証",
          "refresh": "トークンを更新",
          "clear": "クリア",
          "enterToken": "トークンを入力"
        },
        "oauth": {
          "step1": {
            "title": "ステップ 1: 認証ページを開く",
            "desc": "下のボタンをクリックしてブラウザで認証ページを開きます"
          },
          "step2": {
            "title": "ステップ 2: ログインして認証",
            "desc": "アカウントでログインし、認証ボタンをクリックしてください"
          },
          "step3": {
            "title": "ステップ 3: 認証コードをコピー",
            "desc": "認証後、ページに認証コードが表示されます。コピーしてください。"
          },
          "step4": {
            "title": "ステップ 4: 認証コードを貼り付け",
            "desc": "コピーした認証コードを下の入力欄に貼り付けてください"
          },
          "openAuthPage": "認証ページを開く",
          "showUrl": "認証URLを表示"
        },
        "oauthFlow": {
          "instructions": "下のリンクをクリックしてブラウザで認証してください。認証後、コードをここに貼り付けてください。",
          "pasteCode": "認証コード",
          "codePlaceholder": "認証コードをここに貼り付け...",
          "authorize": "認証を完了",
          "emptyCode": "認証コードを貼り付けてください。",
          "stateMismatch": "貼り付けた state が一致しません — CSRF の可能性があります。認証フローをやり直してください。"
        },
        "manual": {
          "title": "アクセストークンを入力",
          "accessToken": "アクセストークン",
          "accessToken.placeholder": "アクセストークンを貼り付けてください",
          "refreshToken": "リフレッシュトークン",
          "refreshToken.placeholder": "トークンの自動更新に使用",
          "hint": "開発者設定ページからトークンを取得できます",
          "claude": {
            "description": "Claude アクセストークンを手動で入力します。Claude.ai の開発者設定などから取得できます。"
          },
          "codex": {
            "description": "OpenAI アクセストークンを手動で入力します。OpenAI API ダッシュボードから取得できます。"
          },
          "gemini": {
            "description": "Gemini アクセストークンを手動で入力します。Google AI Studio またはクラウドコンソールから取得できます。"
          }
        },
        "expiresAt": "有効期限",
        "lastRefreshed": "最終更新",
        "accounts": {
          "title": "アカウント",
          "active": "使用中",
          "setActive": "使用中にする",
          "remove": "アカウントを削除",
          "addAccount": "アカウントを追加",
          "labelInput": "アカウントラベル",
          "labelPlaceholder": "例：個人、仕事",
          "saveLabel": "アカウントラベルを保存",
          "updateLabelFailed": "アカウントラベルを更新できませんでした。",
          "incognitoHint": "別のアカウントを追加するには、シークレットウィンドウで認証ページを開くか、先に claude.ai からログアウトしてください。そうしないと、現在ログイン中のアカウントを再認証することになります。",
          "duplicateTokenWarning": "別のアカウントがこの資格情報を共有しています。どちらかを更新すると、もう一方が無効になります。"
        },
        "openCodeGo": {
          "title": "OpenCode",
          "description": "OpenCodeGo と OpenCodeZen プロキシ上流向けの静的 API キー",
          "apiKeyLabel": "API キー",
          "apiKeyPlaceholder": "OpenCode の API キーを貼り付けてください",
          "apiKeyRequired": "API キーを入力してください。",
          "addFailed": "アカウントの追加に失敗しました",
          "baseUrlLabel": "Base URL（任意）",
          "baseUrlPlaceholder": "デフォルトの OpenCodeGo ホストを上書きします",
          "zenBaseUrlLabel": "Zen Base URL（任意）",
          "zenBaseUrlPlaceholder": "デフォルトの opencode-Zen ホストを上書きします"
        },
        "allowance": {
          "title": "使用量クォータ",
          "refresh": "使用量クォータを更新",
          "stateFresh": "最新",
          "stateStale": "古いデータ — 前回の使用量",
          "stateUnavailable": "使用量を取得できません",
          "stateUnsupported": "このアカウント種別には使用量APIがありません",
          "resetsAt": "{{time}} にリセット"
        },
        "models": {
          "title": "モデル",
          "add": "+ モデルを追加",
          "kindChat": "チャット",
          "kindImage": "画像",
          "defaultBadge": "デフォルト",
          "removeModel": "モデルを削除",
          "placeholder": "モデル ID",
          "save": "保存",
          "errorEmpty": "モデル ID を入力してください。",
          "errorDuplicate": "このモデルは既に存在します。",
          "errorSave": "モデルの保存に失敗しました。"
        },
        "errors": {
          "refreshFailed": "トークンの更新に失敗しました"
        },
        "info": {
          "title": "アカウントトークンについて",
          "description": "トークンは安全に暗号化され、ローカルに保存されます。Elftia は内部アカウントのトークンのみを更新し、ネイティブ CLI の認証情報ファイルを読み書きしません。以前インポートしたアカウントは保持されます。更新に失敗した場合は、CLI から再インポートせず、Elftia 内で独立してログインし直し、別のログイン認証情報を取得してください。"
        }
      }
    }
  }
};
