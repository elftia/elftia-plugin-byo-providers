import React, { useMemo, useState } from 'react';

import { Button } from '../host/ui';
import {
  ByoPortalRoot,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../host/vendored/dialog';
import { useTranslation } from '../host/vendored/useTranslation';

import { useProviderSettings } from './hooks/useProviderSettings';
import { ProviderTemplatePicker } from './PresetProviderGrid';
import { ProviderDetailPanel } from './ProviderDetailPanel';
import { ProviderList } from './ProviderList';
import { isLogJevProvider, LogJevProviderDetails } from './LogJevProviderDetails';

/** Decision credentials and models use the existing masked provider ports. */
export function DecisionModelsPage() {
  const t = useTranslation();
  const settings = useProviderSettings('decision');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const addedPresetIds = useMemo(
    () =>
      new Set(
        settings.providers.map(
          (provider) =>
            (provider as { presetRef?: string }).presetRef || provider.presetId || provider.id
        )
      ),
    [settings.providers]
  );

  const openPicker = () => {
    setAddError(null);
    setPickerOpen(true);
  };
  const handleSelectPreset = async (presetId: string) => {
    setAddError(null);
    const result = await settings.handleAddFromPreset(presetId);
    if (result?.success && result.provider) setPickerOpen(false);
    else setAddError(result?.message || t('providerSettings.errors.saveFailed'));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden" data-testid="decision-models-page">
      <div className="border-b border-border/70 px-5 py-4">
        <h2 className="text-lg font-semibold">{t('decisionModels.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('decisionModels.description')}</p>
      </div>
      {settings.providersError ? (
        <p role="alert" className="px-5 py-2 text-sm text-destructive">
          {settings.providersError}
        </p>
      ) : null}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ProviderList
          providers={settings.providers}
          loading={settings.providersLoading}
          selectedProviderId={settings.selectedProviderId}
          searchTerm={settings.searchTerm}
          setSearchTerm={settings.setSearchTerm}
          onSelectProvider={settings.handleSelectProvider}
          onAddProvider={openPicker}
          isAddingNew={settings.isAddingNew}
        />
        <div className="flex-1 min-w-0 h-full overflow-hidden bg-surface-1/60">
          {settings.selectedProvider ? (
            isLogJevProvider(settings.selectedProvider) ? <LogJevProviderDetails
              key={settings.selectedProvider.id}
              provider={settings.selectedProvider}
              providers={settings.allProviders}
              refresh={settings.refreshProviders}
              onDelete={settings.handleDeleteProvider}
            /> : <ProviderDetailPanel s={settings} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground">{t('decisionModels.empty')}</p>
              <Button onClick={openPicker}>{t('decisionModels.add')}</Button>
            </div>
          )}
        </div>
      </div>
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent
          className="p-0"
          style={{
            width: 'min(64rem, 92vw)',
            maxWidth: 'min(64rem, 92vw)',
            maxHeight: '85dvh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <DialogHeader className="border-b border-border/70 px-5 py-4">
            <DialogTitle>{t('decisionModels.add')}</DialogTitle>
            <DialogDescription>{t('decisionModels.description')}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {addError ? (
              <p role="alert" className="px-4 pt-4 text-sm text-destructive">
                {addError}
              </p>
            ) : null}
            <ProviderTemplatePicker
              category="decision"
              addedPresetIds={addedPresetIds}
              onSelectPreset={handleSelectPreset}
            />
          </div>
        </DialogContent>
      </Dialog>
      <ByoPortalRoot />
    </div>
  );
}
