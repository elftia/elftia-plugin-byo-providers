/**
 * SubscriptionModelList — the per-provider model chip section (host-API v1.70).
 *
 * Rendered at the BOTTOM of each subscription config card (through the cards'
 * `children` slot): chips for the provider's `effective` models — built-in
 * defaults carry a subtle "默认" badge (NOT removable), image models a "画图"
 * badge, user extras each get a remove (×). "+ 添加模型" opens an inline add
 * form (model id + 对话/画图 kind, default 对话); empty/duplicate ids are
 * rejected with a gentle inline message, never alert(). The tab owns the data
 * (`useSubscriptionModels`); mutations ride `onSetExtras`, which REPLACES the
 * provider's whole extras list host-side and reconciles with the returned view.
 *
 * @module byo-providers/renderer/subscription/SubscriptionModelList
 */

import { Check, X } from 'lucide-react';
import { useCallback, useState } from 'react';

import type {
  HostSubscriptionModelInfo,
  HostSubscriptionProviderModels,
} from '@byo/domain/plugin-types';

import { Button } from '../host/ui';
import { Input } from '../host/ui';
import { cn } from '../host/vendored/cn';
import type { TranslateFn } from '../host/vendored/useTranslation';

type ModelKind = HostSubscriptionModelInfo['kind'];

export interface SubscriptionModelListProps {
  t: TranslateFn;
  providerId: string;
  /** Per-provider slice of the host view; absent provider = all lists empty. */
  models?: HostSubscriptionProviderModels;
  /** REPLACE the provider's whole extras list (the v1.70 host verb). */
  onSetExtras: (providerId: string, extras: HostSubscriptionModelInfo[]) => Promise<void>;
}

export const SubscriptionModelList = ({
  t,
  providerId,
  models,
  onSetExtras,
}: SubscriptionModelListProps) => {
  const defaults = models?.defaults ?? [];
  const extras = models?.extras ?? [];
  const effective = models?.effective ?? [];

  const [isAdding, setIsAdding] = useState(false);
  const [draftId, setDraftId] = useState('');
  const [draftKind, setDraftKind] = useState<ModelKind>('chat');
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const defaultIds = new Set(defaults.map((model) => model.id));
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
      setPending(false);
    }
  }, [closeAddForm, draftId, draftKind, effective, extras, onSetExtras, providerId, t]);

  const handleRemove = useCallback(
    async (modelId: string) => {
      setNotice(null);
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
        setPending(false);
      }
    },
    [extras, onSetExtras, providerId, t],
  );

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
          const isDefault = defaultIds.has(model.id);
          const isExtra = extraIds.has(model.id);
          return (
            <span
              key={model.id}
              className={cn(
                'inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-0.5 text-xs',
                isDefault
                  ? 'border-border/40 bg-surface-1/60 text-text-muted'
                  : 'border-border/60 bg-surface-2/60 text-foreground',
              )}
              data-testid="settings-subscription-models-chip"
              data-model-id={model.id}
              data-model-kind={model.kind}
              data-model-default={isDefault ? 'true' : 'false'}
            >
              <span className="truncate">{model.id}</span>
              {model.kind === 'image' ? (
                <span className="shrink-0 rounded bg-primary/15 px-1 py-px text-[10px] leading-4 text-primary">
                  {t('settings.accountTokens.models.kindImage')}
                </span>
              ) : null}
              {isDefault ? (
                <span className="shrink-0 rounded bg-surface-2 px-1 py-px text-[10px] leading-4 text-text-subtle">
                  {t('settings.accountTokens.models.defaultBadge')}
                </span>
              ) : null}
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
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleAdd();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                closeAddForm();
              }
            }}
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
