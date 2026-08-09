import * as React from 'react';

import type {
  HostObjectStorageProvider,
  HostObjectStorageProviderConfig,
} from '@byo/domain/plugin-types';

import { getHost } from '../host/hostBridge';
import { Button, Input, Select, Switch } from '../host/ui';
import { objectStorageConfigClient } from '../objectStorageConfigClient';

type Draft = HostObjectStorageProviderConfig;

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

export function ObjectStorageSettings() {
  const React_ = getHost().react.instance;
  const [providers, setProviders] = React_.useState<readonly HostObjectStorageProvider[]>([]);
  const [selectedId, setSelectedId] = React_.useState('aws-s3');
  const [draft, setDraft] = React_.useState<Draft | null>(null);
  const [credentials, setCredentials] = React_.useState({
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
  });
  const [busy, setBusy] = React_.useState(false);
  const [message, setMessage] = React_.useState('');

  const refresh = React_.useCallback(async () => {
    const next = await objectStorageConfigClient.listProviders();
    setProviders(next);
    const selected = next.find((provider) => provider.id === selectedId) ?? next[0];
    if (selected) {
      setSelectedId(selected.id);
      setDraft(providerDraft(selected));
    }
  }, [selectedId]);

  React_.useEffect(() => {
    void refresh().catch((error: unknown) => setMessage(String(error)));
  }, [refresh]);

  const selected = providers.find((provider) => provider.id === selectedId);
  const selectProvider = (provider: HostObjectStorageProvider) => {
    setSelectedId(provider.id);
    setDraft(providerDraft(provider));
    setCredentials({ accessKeyId: '', secretAccessKey: '', sessionToken: '' });
    setMessage('');
  };
  const patchDraft = (patch: Partial<Draft>) => {
    setDraft((current) => current ? { ...current, ...patch } : current);
  };

  const run = async (operation: () => Promise<{ success: boolean; error?: string }>) => {
    setBusy(true);
    setMessage('');
    try {
      const result = await operation();
      setMessage(result.success ? '已保存' : result.error || '保存失败');
      if (result.success) await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  if (!selected || !draft) {
    return <div className="p-6 text-sm text-muted-foreground">正在加载对象存储配置…</div>;
  }

  return (
    <div data-testid="byo-object-storage-layout" className="flex gap-6 h-[calc(100vh-200px)] min-h-[480px]">
      <aside className="w-[240px] shrink-0 rounded-lg border border-border/50 bg-surface-1/50 wallpaper-blur p-3 overflow-y-auto">
        <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          文件存储提供商
        </div>
        <div className="space-y-1">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => selectProvider(provider)}
              className={`w-full rounded-md px-3 py-2.5 text-left transition-colors ${
                provider.id === selectedId
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted/60 text-foreground'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{provider.name}</span>
                <span className={`h-2 w-2 rounded-full ${provider.ready ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {provider.isDefault ? '默认 · ' : ''}{provider.configured ? '凭据已配置' : '未配置凭据'}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto rounded-xl border border-border/70 bg-surface-1/60 wallpaper-blur p-5 md:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{selected.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selected.description}</p>
          </div>
          <Button
            variant={selected.isDefault ? 'secondary' : 'outline'}
            size="sm"
            disabled={busy || selected.isDefault}
            onClick={() => void run(() => objectStorageConfigClient.setDefaultProvider(selected.id))}
          >
            {selected.isDefault ? '当前默认' : '设为默认'}
          </Button>
        </div>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">连接配置</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Bucket" value={draft.bucket} onChange={(bucket) => patchDraft({ bucket })} />
            <Field label="Region" value={draft.region ?? ''} placeholder="us-east-1 / auto" onChange={(region) => patchDraft({ region })} />
            <Field label="Endpoint" value={draft.endpoint ?? ''} placeholder="https://…" onChange={(endpoint) => patchDraft({ endpoint })} />
            <Field label="对象前缀" value={draft.prefix ?? ''} placeholder="elftia" onChange={(prefix) => patchDraft({ prefix })} />
            <Field label="公共 URL 前缀（可选）" value={draft.publicBaseUrl ?? ''} placeholder="https://cdn.example.com" onChange={(publicBaseUrl) => patchDraft({ publicBaseUrl })} />
            <Field label="签名 URL 有效期（秒）" value={String(draft.expiresInSeconds ?? 3600)} onChange={(value) => patchDraft({ expiresInSeconds: Number(value) || 3600 })} />
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground">外链模式</span>
              <Select
                value={draft.urlMode}
                onChange={(urlMode) => patchDraft({ urlMode: urlMode as Draft['urlMode'] })}
                options={[
                  { value: 'signed', label: '签名 URL（推荐）' },
                  { value: 'public', label: '公开 URL' },
                ]}
              />
            </label>
            {selected.kind === 's3' ? (
              <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-foreground">Path-style URL</div>
                  <div className="text-xs text-muted-foreground">R2、MinIO 等通常需要开启</div>
                </div>
                <Switch checked={draft.forcePathStyle ?? false} onCheckedChange={(forcePathStyle) => patchDraft({ forcePathStyle })} />
              </div>
            ) : null}
          </div>
          <Button disabled={busy} onClick={() => void run(() => objectStorageConfigClient.updateProvider(selected.id, draft))}>
            保存连接配置
          </Button>
        </section>

        <section className="mt-8 space-y-4 border-t border-border/60 pt-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground">访问凭据</h3>
            <p className="mt-1 text-xs text-muted-foreground">凭据只写入主进程加密存储；留空字段不会覆盖已有值。</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Access Key ID" type="password" value={credentials.accessKeyId} placeholder="留空保持不变" onChange={(accessKeyId) => setCredentials((current) => ({ ...current, accessKeyId }))} />
            <Field label="Secret Access Key" type="password" value={credentials.secretAccessKey} placeholder="留空保持不变" onChange={(secretAccessKey) => setCredentials((current) => ({ ...current, secretAccessKey }))} />
            <Field label="Session Token / STS（可选）" type="password" value={credentials.sessionToken} placeholder="留空保持不变" onChange={(sessionToken) => setCredentials((current) => ({ ...current, sessionToken }))} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || !Object.values(credentials).some((value) => value.trim())}
              onClick={() => void run(() => objectStorageConfigClient.setCredentials(selected.id, credentials))}
            >
              保存凭据
            </Button>
            <Button variant="destructive" disabled={busy || !selected.configured} onClick={() => void run(() => objectStorageConfigClient.clearCredentials(selected.id))}>
              清除凭据
            </Button>
          </div>
        </section>

        {message ? <div className="mt-5 rounded-md bg-muted/60 px-3 py-2 text-sm text-foreground">{message}</div> : null}
      </main>
    </div>
  );
}

export default ObjectStorageSettings;
