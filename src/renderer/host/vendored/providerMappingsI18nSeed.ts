export const providerMappingsI18nSeed: Record<
  string,
  Record<string, unknown>
> = {
  en: {
    providerMappings: {
      title: "Model mappings",
      description:
        "Read-only preview of this provider’s outbound API model mappings: client model → upstream model.",
      loading: "Loading model mappings…",
      error:
        "Could not load model mappings. Collapse and reopen this section to try again.",
      unavailable: "Outbound model mappings are unavailable on this host.",
      providerMissing:
        "This provider no longer exists. Select another provider.",
      empty:
        "No explicit mappings. With an empty mapping table, models use same-name passthrough.",
      strict: "Strict mapping",
      automatic: "Same-name passthrough enabled",
      strictHint:
        "Only the listed mappings are available; unmapped model names are not passed through.",
      automaticHint:
        "Unmapped models declared by this provider also pass through under the same name.",
      effort: "Effort: {{level}}",
      editHint:
        "Edit these mappings in Settings → API Server → Upstream model mappings. This preview does not change provider models.",
    },
  },
  zh: {
    providerMappings: {
      title: "模型映射",
      description:
        "只读查看此服务商的外发 API 模型映射：客户端模型 → 上游模型。",
      loading: "正在加载模型映射…",
      error: "无法加载模型映射。请收起并重新展开此区域以重试。",
      unavailable: "当前宿主不支持外发模型映射。",
      providerMissing: "此服务商已不存在，请选择其他服务商。",
      empty: "尚无显式映射。映射表为空时，模型使用同名透传。",
      strict: "严格映射",
      automatic: "已启用同名透传",
      strictHint: "仅使用列表中的映射；未映射的模型名称不会透传。",
      automaticHint: "此服务商已声明但未显式映射的模型，也会按同名透传。",
      effort: "思考强度：{{level}}",
      editHint:
        "请在「设置 → API 服务 → 上游模型映射」中编辑。此只读预览不会修改服务商模型。",
    },
  },
  ja: {
    providerMappings: {
      title: "モデルマッピング",
      description:
        "このプロバイダーの外部向け API モデルマッピングを読み取り専用で表示します：クライアントモデル → 上流モデル。",
      loading: "モデルマッピングを読み込み中…",
      error:
        "モデルマッピングを読み込めませんでした。一度閉じてから再度開いてください。",
      unavailable: "このホストでは外部向けモデルマッピングを利用できません。",
      providerMissing:
        "このプロバイダーは存在しません。別のプロバイダーを選択してください。",
      empty:
        "明示的なマッピングはありません。空のマッピング表では同名のモデルがそのまま転送されます。",
      strict: "厳密なマッピング",
      automatic: "同名の転送が有効",
      strictHint:
        "一覧のマッピングのみを使用し、未登録のモデル名は転送しません。",
      automaticHint:
        "このプロバイダーが宣言した未登録のモデルも同名で転送します。",
      effort: "思考強度：{{level}}",
      editHint:
        "「設定 → API サーバー → 上流モデルのマッピング」で編集できます。このプレビューはプロバイダーのモデルを変更しません。",
    },
  },
};
