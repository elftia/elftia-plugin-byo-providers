/**
 * cliI18nSeed — vendored Code CLI runtime i18n seed (harvested from the host
 * `settings/codeCli.json` en/zh/ja). Wrapped under the `settings.codeCli.*`
 * root the relocated UI's `t()` calls expect; DEEP-merged into the
 * `byo-providers` namespace (`byo-p2-subscription`).
 *
 * @module byo-providers/renderer/host/vendored/cliI18nSeed
 */
export const cliI18nSeed: Record<string, Record<string, unknown>> = {
  "en": {
    "settings": {
      "codeCli": {
        "title": "About Code CLI",
        "description": "Code CLI tools (Claude Code, Codex, Gemini CLI) let you use AI directly from the command line. Configure your accounts here so Elftia can use them as an alternative backend.",
        "installed": "Installed",
        "notInstalled": "Not Installed",
        "checking": "Checking...",
        "installGuide": "Install {{name}} to use this backend. Visit the official documentation for setup instructions.",
        "connected": "Connected",
        "notConnected": "Not Connected",
        "expired": "Expired",
        "loginButton": "Login",
        "clearButton": "Clear",
        "refreshButton": "Refresh",
        "installButton": "Install",
        "installing": "Installing...",
        "launch": {
          "button": "Launch",
          "title": "Launch {{name}}",
          "description": "Open a system terminal and start this CLI.",
          "pathLabel": "Path",
          "pathPlaceholder": "Optional working directory",
          "injectLabel": "Inject environment variables",
          "injectTooltip": "When enabled, Elftia prepares this terminal with your current Provider settings. Subscription accounts are not used here; apply them separately from Subscriptions when needed.",
          "startButton": "Launch",
          "error": "Failed to launch Code CLI."
        },
        "genericInstalledHint": "Detected on PATH. Sign in via the CLI itself (e.g. `opencode auth login`) to use it as an Agent backend.",
        "genericNotInstalledHint": "Not detected on PATH. Install via the button above or follow the CLI's official documentation.",
        "manualInstallHint": "This CLI requires manual installation — refer to its official documentation for setup instructions.",
        "acpProtocolHint": "Uses the Agent Communication Protocol (ACP). Available as a primary Agent backend; cannot be dispatched as an MCP tool.",
        "connectedViaCli": "Authenticated via CLI",
        "connectedViaCliDesc": "This tool is authenticated. Select it in Default Models to use it as a backend.",
        "claudeSubscription": {
          "manageTitle": "Manage subscription accounts",
          "trackNote": "Use the per-account Apply to CLI action to write an account into the native CLI store (~/.claude/.credentials.json), so a standalone terminal `claude` invocation uses that account. A one-time backup of any existing login is kept."
        },
        "codexSubscription": {
          "manageTitle": "Manage subscription accounts",
          "trackNote": "Use the per-account Apply to CLI action to write an account into the native CLI store (~/.codex/auth.json), so a standalone terminal `codex` invocation uses that account. A one-time backup of any existing login is kept."
        },
        "authMethodLabel": "Method",
        "accountEmail": "Account",
        "elftiaAccount": "Also configure Elftia account",
        "useCodeCliAuth": "Use Code CLI authentication",
        "useCodeCliAuthDesc": "Skip API key injection and let Claude Code CLI use its own credentials (~/.claude/.credentials.json).",
        "comingSoon": "Routing via node-pty is coming soon.",
        "cliStatus": "CLI Status",
        "accountStatus": "Account Status",
        "useCodeCli": "Use Code CLI",
        "codeCliProvider": "Code CLI",
        "codeCliGroupLabel": "Code CLI",
        "notAuthenticatedError": "Code CLI '{{backendId}}' is not authenticated — open Settings → Code CLI and run the login flow for this backend.",
        "unknownBackendError": "Unknown Code CLI backend '{{backendId}}'. Open Settings → Code CLI to see the available backends.",
        "extraUsageWarningTitle": "Extra usage model",
        "extraUsageWarningDesc": "{{model}} is billed as extra usage and is not included in your Claude plan. Continue?",
        "extraUsageWarningConfirm": "Use this model",
        "followProviderLockedHint": "Locked because the default model is a Code CLI provider; routing follows the CLI.",
        "agentBackend": {
          "title": "Agent Backend",
          "label": "Agent Backend",
          "hint": "Choose the engine that powers all agent conversations (Clawia and agent chats).",
          "claudeSdk": "Claude Agent SDK",
          "claudeSdkDesc": "Full-featured subprocess mode with tool use, skills, and sub-agents.",
          "tinyelf": "TinyElf",
          "tinyelfDesc": "Lightweight in-process engine with multi-provider support.",
          "cli": "External CLI",
          "cliDesc": "Run external Code CLI tools (Claude Code, Gemini CLI, Codex CLI) as agent backends.",
          "cliNotInstalled": "not installed",
          "cliNotAuthenticated": "not authenticated",
          "cliBackendLabel": "CLI Backend",
          "cliBackendHint": "Choose which external CLI tool to use.",
          "cliTimeoutLabel": "Timeout (seconds)",
          "cliTimeoutHint": "Maximum execution time for CLI processes.",
          "cliPtyMode": "PTY Mode",
          "cliPtyModeHint": "Run CLI tools in a pseudo-terminal for interactive output with colors and cursor control.",
          "cliPtyCols": "Columns",
          "cliPtyRows": "Rows"
        },
        "info": {
          "title": "About Code CLI",
          "description": "Code CLI tools (Claude Code, Codex, Gemini CLI) let you use AI directly from the command line. Configure your accounts here so Elftia can use them as an alternative backend."
        }
      }
    }
  },
  "zh": {
    "settings": {
      "codeCli": {
        "title": "关于 Code CLI",
        "description": "Code CLI 工具（Claude Code、Codex、Gemini CLI）可以直接从命令行使用 AI。在此配置您的账号，Elftia 即可将它们作为替代后端使用。",
        "installed": "已安装",
        "notInstalled": "未安装",
        "checking": "检测中...",
        "installGuide": "请安装 {{name}} 以使用此后端。请访问官方文档了��安装步骤。",
        "connected": "已连接",
        "notConnected": "未连接",
        "expired": "已过期",
        "loginButton": "登录",
        "clearButton": "清除",
        "refreshButton": "刷新",
        "installButton": "安装",
        "installing": "安装中...",
        "launch": {
          "button": "启动",
          "title": "启动 {{name}}",
          "description": "打开系统终端并启动此 CLI。",
          "pathLabel": "路径",
          "pathPlaceholder": "可选的工作目录",
          "injectLabel": "注入环境变量",
          "injectTooltip": "开启后，Elftia 会为本次启动的终端准备当前 Provider 配置。这里不会使用订阅账号；需要使用订阅账号时，请在「订阅」中单独应用。",
          "startButton": "启动",
          "error": "启动 Code CLI 失败。"
        },
        "genericInstalledHint": "已在 PATH 中检测到。请通过 CLI 自身命令登录（例如 `opencode auth login`）后，即可作为 Agent 后端使用。",
        "genericNotInstalledHint": "未在 PATH 中检测到。可点击上方按钮安装，或参考该 CLI 的官方文档。",
        "manualInstallHint": "此 CLI 需要手动安装——请参考其官方文档完成安装。",
        "acpProtocolHint": "使用 ACP（Agent Communication Protocol）协议。可作为主 Agent 后端使用，但不能作为 MCP 工具被调度。",
        "connectedViaCli": "已通过 CLI 认证",
        "connectedViaCliDesc": "该工具已认证，可在默认模型中选择它作为后端使用。",
        "claudeSubscription": {
          "manageTitle": "管理订阅账号",
          "trackNote": "使用账号行里的“应用到本机 CLI”操作，会把该账号写入本机 CLI 凭证文件（~/.claude/.credentials.json），因此在终端单独运行 claude 时会使用该账号。首次覆盖前会保留一份原登录的备份。"
        },
        "codexSubscription": {
          "manageTitle": "管理订阅账号",
          "trackNote": "使用账号行里的“应用到本机 CLI”操作，会把该账号写入本机 CLI 凭证文件（~/.codex/auth.json），因此在终端单独运行 codex 时会使用该账号。首次覆盖前会保留一份原登录的备份。"
        },
        "authMethodLabel": "认证方式",
        "accountEmail": "账号",
        "elftiaAccount": "同时配置 Elftia 账号",
        "useCodeCliAuth": "使用 Code CLI 认证",
        "useCodeCliAuthDesc": "跳过 API Key 注入，让 Claude Code CLI 使用其自身凭据（~/.claude/.credentials.json）。",
        "comingSoon": "通过 node-pty 的路由即将推出。",
        "cliStatus": "CLI 状态",
        "accountStatus": "账号状态",
        "useCodeCli": "使用 Code CLI",
        "codeCliProvider": "Code CLI",
        "codeCliGroupLabel": "Code CLI",
        "notAuthenticatedError": "Code CLI '{{backendId}}' 尚未认证——请前往 设置 → Code CLI 完成该后端的登录流程。",
        "unknownBackendError": "未知的 Code CLI 后端 '{{backendId}}'。请在 设置 → Code CLI 查看可用的后端。",
        "extraUsageWarningTitle": "额外计费模型",
        "extraUsageWarningDesc": "{{model}} 按额外用量计费，不包含在您的 Claude 套餐中。是否继续？",
        "extraUsageWarningConfirm": "使用该模型",
        "followProviderLockedHint": "已锁定：默认模型为 Code CLI，自动跟随 CLI 路由。",
        "agentBackend": {
          "title": "智能体后端",
          "label": "智能体后端",
          "hint": "选择驱动所有智能体对话（Clawia 及 Agent 聊天）的引擎。",
          "claudeSdk": "Claude Agent SDK",
          "claudeSdkDesc": "功能完备的子进程模式，支持工具调用、技能和子智能体。",
          "tinyelf": "TinyElf",
          "tinyelfDesc": "轻量级进程内引擎，支持多提供商。",
          "cli": "外部 CLI",
          "cliDesc": "以外部 Code CLI 工具（Claude Code、Gemini CLI、Codex CLI）作为智能体后端。",
          "cliNotInstalled": "未安装",
          "cliNotAuthenticated": "未认证",
          "cliBackendLabel": "CLI 后端",
          "cliBackendHint": "选择要使用的外部 CLI 工具。",
          "cliTimeoutLabel": "超时时间（秒）",
          "cliTimeoutHint": "CLI 进程的最大执行时间。",
          "cliPtyMode": "PTY 模式",
          "cliPtyModeHint": "在伪终端中运行 CLI 工具，支持交互式输出（彩色、光标控制）。",
          "cliPtyCols": "列数",
          "cliPtyRows": "行数"
        },
        "info": {
          "title": "关于 Code CLI",
          "description": "Code CLI 工具（Claude Code、Codex、Gemini CLI）可以直接从命令行使用 AI。在此配置您的账号，Elftia 即可将它们作为替代后端使用。"
        }
      }
    }
  },
  "ja": {
    "settings": {
      "codeCli": {
        "title": "Code CLI について",
        "description": "Code CLI ツール（Claude Code、Codex、Gemini CLI）を使用すると、コマンドラインから直接 AI を利用できます。ここでアカウントを設定すると、Elftia が代替バックエンドとして使用できるようになります。",
        "installed": "インストール済み",
        "notInstalled": "未インストール",
        "checking": "確認中...",
        "installGuide": "このバックエンドを使用するには {{name}} をインストールしてください。セットアップ手順は公式ドキュメントをご覧ください。",
        "connected": "接続済み",
        "notConnected": "未接続",
        "expired": "期限切れ",
        "loginButton": "ログイン",
        "clearButton": "クリア",
        "refreshButton": "更新",
        "installButton": "インストール",
        "installing": "インストール中...",
        "launch": {
          "button": "起動",
          "title": "{{name}} を起動",
          "description": "システム端末を開いて、この CLI を起動します。",
          "pathLabel": "パス",
          "pathPlaceholder": "任意の作業ディレクトリ",
          "injectLabel": "環境変数を注入",
          "injectTooltip": "オンにすると、この端末に現在の提供元設定を一時的に反映して起動します。サブスクリプションアカウントはここでは使いません。必要な場合は「サブスクリプション」から適用してください。",
          "startButton": "起動",
          "error": "Code CLI の起動に失敗しました。"
        },
        "genericInstalledHint": "PATH 上で検出されました。CLI のログインコマンド（例: `opencode auth login`）でサインインすると、Agent バックエンドとして利用できます。",
        "genericNotInstalledHint": "PATH 上で検出されませんでした。上のボタンからインストールするか、CLI の公式ドキュメントを参照してください。",
        "manualInstallHint": "この CLI は手動インストールが必要です。公式ドキュメントを参照してセットアップしてください。",
        "acpProtocolHint": "ACP (Agent Communication Protocol) を使用します。プライマリ Agent バックエンドとして利用可能ですが、MCP ツールとしては呼び出せません。",
        "connectedViaCli": "CLI で認証済み",
        "connectedViaCliDesc": "このツールは認証済みです。デフォルトモデルで選択してバックエンドとして使用できます。",
        "claudeSubscription": {
          "manageTitle": "サブスクリプションアカウントを管理",
          "trackNote": "アカウント行の「CLIに適用」操作を使うと、そのアカウントをネイティブ CLI のストア（~/.claude/.credentials.json）に書き込み、ターミナルで単独で claude を実行したときにもそのアカウントを使えます。既存のログインは初回上書き前にバックアップされます。"
        },
        "codexSubscription": {
          "manageTitle": "サブスクリプションアカウントを管理",
          "trackNote": "アカウント行の「CLIに適用」操作を使うと、そのアカウントをネイティブ CLI のストア（~/.codex/auth.json）に書き込み、ターミナルで単独で codex を実行したときにもそのアカウントを使えます。既存のログインは初回上書き前にバックアップされます。"
        },
        "authMethodLabel": "認証方式",
        "accountEmail": "アカウント",
        "elftiaAccount": "Elftia アカウントも設定する",
        "useCodeCliAuth": "Code CLI 認証を使用",
        "useCodeCliAuthDesc": "API キーの注入をスキップし、Claude Code CLI 自身の認証情報（~/.claude/.credentials.json）を使用します。",
        "comingSoon": "node-pty 経由のルーティングは近日公開予定です。",
        "cliStatus": "CLI ステータス",
        "accountStatus": "アカウントステータス",
        "useCodeCli": "Code CLI を使用",
        "codeCliProvider": "Code CLI",
        "codeCliGroupLabel": "Code CLI",
        "notAuthenticatedError": "Code CLI '{{backendId}}' は認証されていません — 設定 → Code CLI で該当バックエンドのログインフローを実行してください。",
        "unknownBackendError": "未知の Code CLI バックエンド '{{backendId}}' です。設定 → Code CLI で利用可能なバックエンドを確認してください。",
        "extraUsageWarningTitle": "追加課金モデル",
        "extraUsageWarningDesc": "{{model}} は追加使用量として課金され、Claude プランには含まれません。続行しますか？",
        "extraUsageWarningConfirm": "このモデルを使用",
        "followProviderLockedHint": "デフォルトモデルが Code CLI のためロックされています。CLI のルーティングに従います。",
        "agentBackend": {
          "title": "エージェントバックエンド",
          "label": "エージェントバックエンド",
          "hint": "すべてのエージェント会話（Clawia および Agent チャット）を駆動するエンジンを選択します。",
          "claudeSdk": "Claude Agent SDK",
          "claudeSdkDesc": "フル機能のサブプロセスモード。ツール使用、スキル、サブエージェントに対応。",
          "tinyelf": "TinyElf",
          "tinyelfDesc": "軽量なインプロセスエンジン。マルチプロバイダー対応。",
          "cli": "外部 CLI",
          "cliDesc": "外部 Code CLI ツール（Claude Code、Gemini CLI、Codex CLI）をエージェントバックエンドとして実行します。",
          "cliNotInstalled": "未インストール",
          "cliNotAuthenticated": "未認証",
          "cliBackendLabel": "CLI バックエンド",
          "cliBackendHint": "使用する外部 CLI ツールを選択します。",
          "cliTimeoutLabel": "タイムアウト（秒）",
          "cliTimeoutHint": "CLI プロセスの最大実行時間。",
          "cliPtyMode": "PTY モード",
          "cliPtyModeHint": "CLI ツールを擬似端末で実行し、カラーやカーソル制御のインタラクティブ出力をサポートします。",
          "cliPtyCols": "カラム数",
          "cliPtyRows": "行数"
        },
        "info": {
          "title": "Code CLI について",
          "description": "Code CLI ツール（Claude Code、Codex、Gemini CLI）を使用すると、コマンドラインから直接 AI を利用できます。ここでアカウントを設定すると、Elftia が代替バックエンドとして使用できるようになります。"
        }
      }
    }
  }
};
