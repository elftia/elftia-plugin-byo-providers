import * as React from "react";

import type {
  HostObjectStorageProvider,
  HostObjectStorageProviderConfig,
} from "@elftia/plugin-types";

import { getHost } from "../host/hostBridge";
import { Button, Input, Select, Switch } from "../host/ui";
import { objectStorageConfigClient } from "../objectStorageConfigClient";

type Draft = HostObjectStorageProviderConfig;

/** Builtin templates the host exposes (`addProvider` accepts these ids). */
const TEMPLATES: ReadonlyArray<{ id: string; label: string }> = [
  { id: "aws-s3", label: "AWS S3" },
  { id: "cloudflare-r2", label: "Cloudflare R2" },
  { id: "aliyun-oss", label: "阿里云 OSS" },
  { id: "s3-compatible", label: "S3 Compatible（MinIO / B2 / Wasabi…）" },
];

const TEMPLATE_LABELS: Record<string, string> = Object.fromEntries(
  TEMPLATES.map((template) => [template.id, template.label]),
);

function providerDraft(provider: HostObjectStorageProvider): Draft {
  return { ...provider.config };
}

function Field(props: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{props.label}</span>
      <Input
        type={props.type}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

function StatusMessage(props: { kind: "ok" | "error"; text: string }) {
  return (
    <div
      className={`mt-3 rounded-md px-3 py-2 text-sm ${
        props.kind === "ok"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {props.text}
    </div>
  );
}

export function ObjectStorageSettings() {
  const React_ = getHost().react.instance;
  const [providers, setProviders] = React_.useState<
    readonly HostObjectStorageProvider[]
  >([]);
  const [selectedId, setSelectedId] = React_.useState<string | null>(null);
  const [draft, setDraft] = React_.useState<Draft | null>(null);
  const [draftName, setDraftName] = React_.useState("");
  const [credentials, setCredentials] = React_.useState({
    accessKeyId: "",
    secretAccessKey: "",
    sessionToken: "",
  });
  const [busy, setBusy] = React_.useState(false);
  const [status, setStatus] = React_.useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  const [newTemplateId, setNewTemplateId] = React_.useState("cloudflare-r2");
  const [deleteArmed, setDeleteArmed] = React_.useState(false);

  const applyProviders = (
    next: readonly HostObjectStorageProvider[],
    preferId?: string | null,
  ) => {
    setProviders(next);
    const selected =
      next.find((provider) => provider.id === (preferId ?? selectedId)) ??
      next[0];
    setSelectedId(selected ? selected.id : null);
    setDraft(selected ? providerDraft(selected) : null);
    setDraftName(selected ? selected.name : "");
    setCredentials({
      accessKeyId: "",
      secretAccessKey: "",
      sessionToken: "",
    });
  };

  const refresh = React_.useCallback(
    async (preferId?: string | null) => {
      const next = await objectStorageConfigClient.listProviders();
      applyProviders(next, preferId);
    },
    // applyProviders closes over selectedId for the non-preferred path; the
    // callback identity only matters for the mount effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  React_.useEffect(() => {
    void refresh().catch((error: unknown) =>
      setStatus({ kind: "error", text: String(error) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = providers.find((provider) => provider.id === selectedId);
  const selectProvider = (provider: HostObjectStorageProvider) => {
    setSelectedId(provider.id);
    setDraft(providerDraft(provider));
    setDraftName(provider.name);
    setCredentials({
      accessKeyId: "",
      secretAccessKey: "",
      sessionToken: "",
    });
    setStatus(null);
    setDeleteArmed(false);
  };
  const patchDraft = (patch: Partial<Draft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const run = async (operation: () => Promise<{ success: boolean; error?: string }>) => {
    setBusy(true);
    setStatus(null);
    try {
      const result = await operation();
      if (!result.success) {
        setStatus({ kind: "error", text: result.error || "保存失败" });
        return false;
      }
      return true;
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : String(error),
      });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const refreshAfter = async (preferId?: string | null, okText?: string) => {
    try {
      await refresh(preferId);
      if (okText) setStatus({ kind: "ok", text: okText });
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const addProvider = async () => {
    const ok = await run(() =>
      objectStorageConfigClient.addProvider(newTemplateId),
    );
    if (!ok) return;
    // Select the newly added instance (the last one for its template).
    const next = await objectStorageConfigClient.listProviders();
    const created = [...next]
      .filter((provider) => provider.templateId === newTemplateId)
      .pop();
    applyProviders(next, created?.id ?? null);
    setStatus({ kind: "ok", text: "已添加，填写后点击下方“保存”" });
  };

  /** One save action: name + connection config + any newly typed credentials. */
  const saveProvider = async () => {
    if (!selected || !draft) return;
    const ok = await run(() =>
      objectStorageConfigClient.updateProvider(selected.id, {
        ...draft,
        name: draftName,
      }),
    );
    if (!ok) return;
    const hasNewCredentials = Object.values(credentials).some((value) =>
      value.trim(),
    );
    if (hasNewCredentials) {
      const credOk = await run(() =>
        objectStorageConfigClient.setCredentials(selected.id, credentials),
      );
      if (!credOk) return;
    }
    await refreshAfter(selected.id, "已保存");
  };

  const toggleEnabled = async (enabled: boolean) => {
    if (!selected) return;
    const ok = await run(() =>
      objectStorageConfigClient.updateProvider(selected.id, { enabled }),
    );
    if (ok) await refreshAfter(selected.id);
  };

  const setDefault = async () => {
    if (!selected) return;
    const ok = await run(() =>
      objectStorageConfigClient.setDefaultProvider(selected.id),
    );
    if (ok) await refreshAfter(selected.id, "已设为默认");
  };

  const clearCredentials = async () => {
    if (!selected) return;
    const ok = await run(() =>
      objectStorageConfigClient.clearCredentials(selected.id),
    );
    if (ok) await refreshAfter(selected.id, "凭据已清除");
  };

  const deleteProvider = async () => {
    if (!selected) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    const ok = await run(() =>
      objectStorageConfigClient.deleteProvider(selected.id),
    );
    if (ok) await refreshAfter(undefined, "已删除");
  };

  return (
    <div
      data-testid="byo-object-storage-layout"
      className="flex gap-6 h-[calc(100vh-200px)] min-h-[480px]"
    >
      <aside className="w-[260px] shrink-0 flex flex-col rounded-lg border border-border/50 bg-surface-1/50 wallpaper-blur p-3 overflow-y-auto">
        <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          对象存储
        </div>
        <div className="space-y-1 flex-1">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => selectProvider(provider)}
              className={`w-full rounded-md px-3 py-2.5 text-left transition-colors ${
                provider.id === selectedId
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/60 text-foreground"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">
                  {provider.name}
                </span>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    provider.ready && provider.enabled
                      ? "bg-emerald-500"
                      : provider.enabled
                        ? "bg-amber-500/70"
                        : "bg-muted-foreground/40"
                  }`}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground truncate">
                {TEMPLATE_LABELS[provider.templateId] ?? provider.templateId}
                {provider.isDefault ? " · 默认" : ""}
                {provider.enabled ? "" : " · 已停用"}
                {" · "}
                {provider.configured ? "凭据已配置" : "未配置凭据"}
              </div>
            </button>
          ))}
          {providers.length === 0 ? (
            <div className="px-2 py-6 text-xs text-muted-foreground">
              还没有对象存储。添加一个后，需要公网链接的媒体生成会自动上传本地素材。
            </div>
          ) : null}
        </div>
        <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
          <Select
            value={newTemplateId}
            onChange={setNewTemplateId}
            options={TEMPLATES.map((template) => ({
              value: template.id,
              label: template.label,
            }))}
          />
          <Button
            data-testid="byo-object-storage-add-btn"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={busy}
            onClick={() => void addProvider()}
          >
            添加存储服务
          </Button>
          <p className="px-1 text-[11px] leading-4 text-muted-foreground">
            同一来源可以添加多个（例如不同桶），通过“设为默认”切换。
          </p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto rounded-xl border border-border/70 bg-surface-1/60 wallpaper-blur p-5 md:p-6">
        {!selected || !draft ? (
          <div className="p-6 text-sm text-muted-foreground">
            {providers.length === 0
              ? "左侧添加一个对象存储服务开始配置。"
              : "正在加载对象存储配置…"}
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-foreground">名称</span>
                  <Input
                    data-testid="byo-object-storage-name-input"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                  />
                </label>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selected.description}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">启用</span>
                  <Switch
                    data-testid="byo-object-storage-enabled-switch"
                    checked={selected.enabled}
                    disabled={busy}
                    onCheckedChange={(enabled) => void toggleEnabled(enabled)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    data-testid="byo-object-storage-default-btn"
                    variant={selected.isDefault ? "secondary" : "outline"}
                    size="sm"
                    disabled={busy || selected.isDefault}
                    onClick={() => void setDefault()}
                  >
                    {selected.isDefault ? "当前默认" : "设为默认"}
                  </Button>
                  <Button
                    data-testid="byo-object-storage-delete-btn"
                    variant={deleteArmed ? "destructive" : "ghost"}
                    size="sm"
                    disabled={busy}
                    onClick={() => void deleteProvider()}
                  >
                    {deleteArmed ? "确认删除" : "删除"}
                  </Button>
                </div>
              </div>
            </div>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">连接配置</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Bucket"
                  value={draft.bucket}
                  onChange={(bucket) => patchDraft({ bucket })}
                />
                <Field
                  label="Region"
                  value={draft.region ?? ""}
                  placeholder="us-east-1 / auto"
                  onChange={(region) => patchDraft({ region })}
                />
                <Field
                  label="Endpoint"
                  value={draft.endpoint ?? ""}
                  placeholder="https://…"
                  onChange={(endpoint) => patchDraft({ endpoint })}
                />
                <Field
                  label="对象前缀"
                  value={draft.prefix ?? ""}
                  placeholder="elftia"
                  onChange={(prefix) => patchDraft({ prefix })}
                />
                <Field
                  label="公共 URL 前缀（可选）"
                  value={draft.publicBaseUrl ?? ""}
                  placeholder="https://cdn.example.com"
                  onChange={(publicBaseUrl) => patchDraft({ publicBaseUrl })}
                />
                <Field
                  label="签名 URL 有效期（秒）"
                  value={String(draft.expiresInSeconds ?? 3600)}
                  onChange={(value) =>
                    patchDraft({ expiresInSeconds: Number(value) || 3600 })
                  }
                />
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-foreground">外链模式</span>
                  <Select
                    value={draft.urlMode}
                    onChange={(urlMode) =>
                      patchDraft({ urlMode: urlMode as Draft["urlMode"] })
                    }
                    options={[
                      { value: "signed", label: "签名 URL（推荐）" },
                      { value: "public", label: "公开 URL" },
                    ]}
                  />
                </label>
                {selected.kind === "s3" ? (
                  <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        Path-style URL
                      </div>
                      <div className="text-xs text-muted-foreground">
                        R2、MinIO 等通常需要开启
                      </div>
                    </div>
                    <Switch
                      checked={draft.forcePathStyle ?? false}
                      onCheckedChange={(forcePathStyle) =>
                        patchDraft({ forcePathStyle })
                      }
                    />
                  </div>
                ) : null}
              </div>
            </section>

            <section className="mt-8 space-y-4 border-t border-border/60 pt-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground">访问凭据</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  凭据只写入主进程加密存储；留空字段不会覆盖已有值。
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Access Key ID"
                  type="password"
                  value={credentials.accessKeyId}
                  placeholder={
                    selected.configured ? "已保存（留空保持不变）" : "留空保持不变"
                  }
                  onChange={(accessKeyId) =>
                    setCredentials((current) => ({ ...current, accessKeyId }))
                  }
                />
                <Field
                  label="Secret Access Key"
                  type="password"
                  value={credentials.secretAccessKey}
                  placeholder={
                    selected.configured ? "已保存（留空保持不变）" : "留空保持不变"
                  }
                  onChange={(secretAccessKey) =>
                    setCredentials((current) => ({ ...current, secretAccessKey }))
                  }
                />
                <Field
                  label="Session Token / STS（可选）"
                  type="password"
                  value={credentials.sessionToken}
                  placeholder="留空保持不变"
                  onChange={(sessionToken) =>
                    setCredentials((current) => ({ ...current, sessionToken }))
                  }
                />
              </div>
            </section>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button
                data-testid="byo-object-storage-save-btn"
                disabled={busy}
                onClick={() => void saveProvider()}
              >
                保存
              </Button>
              <Button
                variant="outline"
                disabled={busy || !selected.configured}
                onClick={() => void clearCredentials()}
              >
                清除凭据
              </Button>
              {status ? (
                <StatusMessage kind={status.kind} text={status.text} />
              ) : null}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default ObjectStorageSettings;
