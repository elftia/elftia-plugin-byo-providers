import { Check, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import type {
  HostSubscriptionModelInfo,
  HostSubscriptionProviderModels,
} from '@byo/domain/plugin-types';

import { Button, Input, Switch } from '../host/ui';
import type { TranslateFn } from '../host/vendored/useTranslation';

type ModelKind = HostSubscriptionModelInfo['kind'];

export interface SubscriptionModelListProps {
  t: TranslateFn;
  providerId: string;
  /** Per-provider slice of the host view; absent provider = all lists empty. */
  models?: HostSubscriptionProviderModels;
  /** REPLACE the provider's whole extras list (the v1.70 host verb). */
  onSetExtras: (providerId: string, extras: HostSubscriptionModelInfo[]) => Promise<void>;
  onSetEnabled: (providerId: string, modelId: string, enabled: boolean) => Promise<void>;
  toggleSupported?: boolean;
}

export const SubscriptionModelList = ({
  t,
  providerId,
  models,
  onSetExtras,
  onSetEnabled,
  toggleSupported = true,
}: SubscriptionModelListProps) => {
  const extras = models?.extras ?? [];
  const effective = models?.effective ?? [];

  const [isAdding, setIsAdding] = useState(false);
  const [draftId, setDraftId] = useState('');
  const [draftKind, setDraftKind] = useState<ModelKind>('chat');
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  const extraIds = new Set(extras.map((model) => model.id));

  const openAddForm = useCallback(() => {
    setNotice(null);
    setDraftId('');
    setDraftKind('chat');
    setIsAdding(true);
  }, []);

  const closeAddForm = useCallback(() => {
    setIsAdding(false);
    setDraftId('');
    setDraftKind('chat');
    setNotice(null);
  }, []);

  // Append to the CURRENT extras (the verb REPLACES the whole extras list, so
  // the full next list is threaded — never a delta).
  const handleAdd = useCallback(async () => {
    if (pendingRef.current) return;
    const id = draftId.trim();
    if (!id) {
      setNotice(t('settings.accountTokens.models.errorEmpty'));
      return;
    }
    if (effective.some((model) => model.id === id)) {
      setNotice(t('settings.accountTokens.models.errorDuplicate'));
      return;
    }
    setNotice(null);
    pendingRef.current = true;
    setPending(true);
    try {
      await onSetExtras(providerId, [...extras, { id, kind: draftKind }]);
      closeAddForm();
    } catch (err) {
      setNotice(
        err instanceof Error && err.message
          ? err.message
          : t('settings.accountTokens.models.errorSave'),
      );
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, [closeAddForm, draftId, draftKind, effective, extras, onSetExtras, providerId, t]);

  const handleRemove = useCallback(
    async (modelId: string) => {
      if (pendingRef.current) return;
      setNotice(null);
      pendingRef.current = true;
      setPending(true);
      try {
        await onSetExtras(
          providerId,
          extras.filter((model) => model.id !== modelId),
        );
      } catch (err) {
        setNotice(
          err instanceof Error && err.message
            ? err.message
            : t('settings.accountTokens.models.errorSave'),
        );
      } finally {
        pendingRef.current = false;
        setPending(false);
      }
    },
    [extras, onSetExtras, providerId, t],
  );

  const handleToggle = useCallback(async (modelId: string, enabled: boolean) => {
    if (pendingRef.current || !toggleSupported) return;
    pendingRef.current = true;
    setPending(true);
    setNotice(null);
    try {
      await onSetEnabled(providerId, modelId, enabled);
    } catch (err) {
      setNotice(err instanceof Error && err.message === 'subscription-models-unsupported'
        ? t('settings.accountTokens.models.toggleUnsupported')
        : err instanceof Error && err.message ? err.message : t('settings.accountTokens.models.errorSave'));
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, [onSetEnabled, providerId, t, toggleSupported]);

  return (
    <div
      className="space-y-2 border-t border-border/40 pt-3"
      data-testid="settings-subscription-models"
      data-provider-id={providerId}
    >
      <div className="text-sm font-medium text-foreground">
        {t('settings.accountTokens.models.title')}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {effective.map((model) => {
          const isExtra = extraIds.has(model.id);
          return (
            <span
              key={model.id}
              className="inline-flex max-w-full items-center gap-2 rounded-md border border-border/60 bg-surface-2/60 px-2 py-1 text-xs text-foreground"
              data-testid="settings-subscription-models-chip"
              data-model-id={model.id}
              data-model-kind={model.kind}
              data-model-enabled={model.enabled !== false ? 'true' : 'false'}
            >
              <span className="truncate">{model.id}</span>
              {model.kind === 'image' ? (
                <span className="shrink-0 rounded bg-primary/15 px-1 py-px text-[10px] leading-4 text-primary">
                  {t('settings.accountTokens.models.kindImage')}
                </span>
              ) : null}
              <Switch
                checked={model.enabled !== false}
                onCheckedChange={(enabled) => void handleToggle(model.id, enabled)}
                disabled={pending || !toggleSupported}
                aria-label={`${t('settings.accountTokens.models.enabled')}: ${model.id}`}
                title={!toggleSupported ? t('settings.accountTokens.models.toggleUnsupported') : undefined}
                data-testid="settings-subscription-models-toggle"
                data-model-id={model.id}
              />
              {isExtra ? (
                <button
                  type="button"
                  className="shrink-0 rounded-sm p-0.5 text-text-subtle hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t('settings.accountTokens.models.removeModel')}
                  title={t('settings.accountTokens.models.removeModel')}
                  disabled={pending}
                  onClick={() => void handleRemove(model.id)}
                  data-testid="settings-subscription-models-remove-btn"
                  data-model-id={model.id}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              ) : null}
            </span>
          );
        })}
        <Button
          size="xs"
          variant="outline"
          disabled={pending}
          onClick={openAddForm}
          data-testid="settings-subscription-models-add-btn"
        >
          {t('settings.accountTokens.models.add')}
        </Button>
      </div>
      {isAdding ? (
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="settings-subscription-models-form"
        >
          <Input
            value={draftId}
            onChange={(event) => setDraftId(event.target.value)}
            placeholder={t('settings.accountTokens.models.placeholder')}
            aria-label={t('settings.accountTokens.models.title')}
            disabled={pending}
            className="h-8 max-w-xs flex-1"
            data-testid="settings-subscription-models-input"
          />
          <div className="flex items-center gap-1">
            <Button
              size="xs"
              variant={draftKind === 'chat' ? 'default' : 'outline'}
              onClick={() => setDraftKind('chat')}
              disabled={pending}
              data-testid="settings-subscription-models-kind-chat"
            >
              {t('settings.accountTokens.models.kindChat')}
            </Button>
            <Button
              size="xs"
              variant={draftKind === 'image' ? 'default' : 'outline'}
              onClick={() => setDraftKind('image')}
              disabled={pending}
              data-testid="settings-subscription-models-kind-image"
            >
              {t('settings.accountTokens.models.kindImage')}
            </Button>
          </div>
          <Button
            size="sm"
            onClick={() => void handleAdd()}
            disabled={pending}
            data-testid="settings-subscription-models-save-btn"
          >
            <Check className="h-3.5 w-3.5" />
            {t('settings.accountTokens.models.save')}
          </Button>
          <Button size="sm" variant="outline" onClick={closeAddForm} disabled={pending}>
            {t('common.cancel')}
          </Button>
        </div>
      ) : null}
      {notice ? (
        <p className="text-xs text-destructive" data-testid="settings-subscription-models-error">
          {notice}
        </p>
      ) : null}
    </div>
  );
};
