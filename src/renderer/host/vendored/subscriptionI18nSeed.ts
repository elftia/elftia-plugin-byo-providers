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
        "description": "Configure OAuth tokens for external AI services. These tokens enable direct API access to Claude, Codex, and Gemini services.",
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
          "description": "OAuth token for OpenAI's Codex CLI"
        },
        "gemini": {
          "title": "Gemini (Google)",
          "description": "OAuth token for Google's Gemini CLI"
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
          "codePlaceholder": "Paste the authorization code here (format: code#state)...",
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
          "applyToCli": "Apply to CLI",
          "applyToCliTooltip": "Write this account to the native CLI credential file for standalone terminal sessions.",
          "applyToCliSuccess": "Applied to the native CLI credential file.",
          "applyToCliFailed": "Failed to update the native CLI credential file.",
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
        "externalSync": {
          "warning": "Switched the active account, but could not update the terminal CLI store. A standalone terminal session may still use the previous account."
        },
        "cliImport": {
          "autoImportLabel": "Auto-import from CLI on refresh failure",
          "autoImportDesc": "If the CLI (e.g. Claude Code) refreshed the token before Elftia could, Elftia's own refresh fails. When enabled, Elftia automatically reads the current credential back from the CLI login file. Uses whichever account is currently signed in to the CLI.",
          "importButton": "Import from CLI",
          "dialogTitle": "Import credential from the CLI?",
          "dialogDescription": "Token refresh failed — the CLI may have rotated the credential. Read the current token back from the CLI login file? This uses whichever account is currently signed in to the CLI.",
          "importConfirm": "Import",
          "importSuccess": "Imported the credential from the CLI.",
          "importRefreshed": "Imported and refreshed the credential from the CLI.",
          "importFailed": "Could not import from the CLI.",
          "notRotated": "The CLI's stored credential is the same one that just failed — please re-authorize.",
          "lineageMismatch": "The CLI login file belongs to a different account — set that account active first, or re-authorize.",
          "foreignFileNamed": "Refresh failed. The native CLI login file currently belongs to the account \"{{label}}\", so it can't recover this account. Re-authorize this account, or switch the active account to \"{{label}}\".",
          "foreignFile": "Refresh failed. The native CLI login file belongs to a different account, so it can't recover this account. Re-authorize this account."
        },
        "errors": {
          "refreshFailed": "Failed to refresh token"
        },
        "info": {
          "title": "About Account Tokens",
          "description": "These tokens are used to authenticate with external AI services. Tokens are securely encrypted and stored locally. The app will automatically refresh tokens before they expire."
        },
        "importExternal": {
          "detected": "An existing {{name}} CLI login was found on this machine.",
          "hint": "Importing creates an account from it and keeps it fresh: after each token refresh the CLI login file is updated too, so the terminal CLI stays signed in.",
          "button": "Import existing CLI login",
          "failed": "Import failed. Please sign in manually."
        }
      }
    }
  },
  "zh": {
    "settings": {
      "accountTokens": {
        "title": "账号Token",
        "description": "配置外部AI服务的OAuth令牌。这些令牌可以直接访问Claude、Codex和Gemini服务的API。",
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
          "description": "OpenAI Codex CLI的OAuth令牌"
        },
        "gemini": {
          "title": "Gemini (Google)",
          "description": "Google Gemini CLI的OAuth令牌"
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
          "codePlaceholder": "在此粘贴授权代码（格式：code#state）...",
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
          "applyToCli": "应用到本机 CLI",
          "applyToCliTooltip": "将此账号写入本机 CLI 的凭证文件，供终端单独启动时使用。",
          "applyToCliSuccess": "已应用到本机 CLI 凭证文件。",
          "applyToCliFailed": "更新本机 CLI 凭证文件失败。",
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
        "externalSync": {
          "warning": "已切换活跃账号，但未能更新终端 CLI 的凭证文件。在终端单独运行时可能仍会使用此前的账号。"
        },
        "cliImport": {
          "autoImportLabel": "刷新失败时自动从 CLI 导入",
          "autoImportDesc": "如果本机 CLI（如 Claude Code）抢先刷新了令牌，Elftia 自己再刷新就会失败。开启后，Elftia 会在刷新失败时自动从 CLI 的登录文件读回当前凭证。以 CLI 当前登录的账号为准。",
          "importButton": "从 CLI 导入",
          "dialogTitle": "从 CLI 导入凭证？",
          "dialogDescription": "刷新令牌失败——可能是 CLI 已经轮换了凭证。是否从 CLI 的登录文件读回当前令牌？将以 CLI 当前登录的账号为准。",
          "importConfirm": "导入",
          "importSuccess": "已从 CLI 导入凭证。",
          "importRefreshed": "已从 CLI 导入并刷新凭证。",
          "importFailed": "无法从 CLI 导入。",
          "notRotated": "CLI 中保存的凭证与刚刚刷新失败的是同一个——请重新授权。",
          "lineageMismatch": "CLI 登录文件属于另一个账号——请先把该账号设为当前，或重新授权。",
          "foreignFileNamed": "刷新失败。本机 CLI 登录文件当前属于账号「{{label}}」，无法用于恢复此账号。请重新授权此账号，或把当前账号切换为「{{label}}」。",
          "foreignFile": "刷新失败。本机 CLI 登录文件属于另一个账号，无法用于恢复此账号。请重新授权此账号。"
        },
        "errors": {
          "refreshFailed": "刷新令牌失败"
        },
        "info": {
          "title": "关于账号Token",
          "description": "这些令牌用于与外部AI服务进行身份验证。令牌将被安全加密并存储在本地。应用程序会在令牌过期前自动刷新。"
        },
        "importExternal": {
          "detected": "检测到本机已有 {{name}} CLI 登录。",
          "hint": "导入后将基于它创建账号并负责保鲜：每次刷新令牌都会同步更新 CLI 登录文件，终端里的 CLI 保持登录不掉线。",
          "button": "导入现有 CLI 登录",
          "failed": "导入失败，请手动登录。"
        }
      }
    }
  },
  "ja": {
    "settings": {
      "accountTokens": {
        "title": "アカウントトークン",
        "description": "外部AIサービスのOAuthトークンを設定します。これらのトークンにより、Claude、Codex、GeminiサービスのAPIに直接アクセスできます。",
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
          "description": "OpenAI Codex CLIのOAuthトークン"
        },
        "gemini": {
          "title": "Gemini (Google)",
          "description": "Google Gemini CLIのOAuthトークン"
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
          "codePlaceholder": "認証コードをここに貼り付け（形式：code#state）...",
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
          "applyToCli": "CLIに適用",
          "applyToCliTooltip": "このアカウントをネイティブ CLI の認証情報ファイルへ書き込み、ターミナル単体で使えるようにします。",
          "applyToCliSuccess": "ネイティブ CLI の認証情報ファイルに適用しました。",
          "applyToCliFailed": "ネイティブ CLI の認証情報ファイルを更新できませんでした。",
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
        "externalSync": {
          "warning": "アクティブなアカウントを切り替えましたが、ターミナル CLI のストアを更新できませんでした。ターミナルで単独に実行した場合、以前のアカウントが使われる可能性があります。"
        },
        "cliImport": {
          "autoImportLabel": "更新失敗時に CLI から自動インポート",
          "autoImportDesc": "CLI（Claude Code など）が先にトークンを更新すると、Elftia 側の更新は失敗します。有効にすると、更新失敗時に CLI のログインファイルから現在の資格情報を自動で読み戻します。CLI に現在サインインしているアカウントが使われます。",
          "importButton": "CLI からインポート",
          "dialogTitle": "CLI から資格情報をインポートしますか？",
          "dialogDescription": "トークンの更新に失敗しました。CLI が資格情報をローテーションした可能性があります。CLI のログインファイルから現在のトークンを読み戻しますか？CLI に現在サインインしているアカウントが使われます。",
          "importConfirm": "インポート",
          "importSuccess": "CLI から資格情報をインポートしました。",
          "importRefreshed": "CLI から資格情報をインポートして更新しました。",
          "importFailed": "CLI からインポートできませんでした。",
          "notRotated": "CLI に保存された資格情報は、今回更新に失敗したものと同じです。再認証してください。",
          "lineageMismatch": "CLI のログインファイルは別のアカウントのものです。先にそのアカウントをアクティブにするか、再認証してください。",
          "foreignFileNamed": "更新に失敗しました。本機の CLI ログインファイルは現在アカウント「{{label}}」のものなので、このアカウントの復旧には使えません。このアカウントを再認証するか、アクティブなアカウントを「{{label}}」に切り替えてください。",
          "foreignFile": "更新に失敗しました。本機の CLI ログインファイルは別のアカウントのものなので、このアカウントの復旧には使えません。このアカウントを再認証してください。"
        },
        "errors": {
          "refreshFailed": "トークンの更新に失敗しました"
        },
        "info": {
          "title": "アカウントトークンについて",
          "description": "これらのトークンは外部AIサービスとの認証に使用されます。トークンは安全に暗号化され、ローカルに保存されます。アプリは有効期限前にトークンを自動的に更新します。"
        },
        "importExternal": {
          "detected": "このマシンに既存の {{name}} CLI ログインが見つかりました。",
          "hint": "インポートするとそこからアカウントを作成し、更新を管理します。トークンを更新するたびに CLI のログインファイルも更新され、ターミナルの CLI はログイン状態を維持します。",
          "button": "既存の CLI ログインをインポート",
          "failed": "インポートに失敗しました。手動でログインしてください。"
        }
      }
    }
  }
};
