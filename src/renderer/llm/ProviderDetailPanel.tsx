/**
 * ProviderDetailPanel — the provider half of the model-services right panel
 * (extracted from the former standalone `ProviderSettings` page, whose sidebar
 * the unified `ModelServicesPage` replaces).
 *
 * Renders the existing ProviderDetails / ProviderForm surfaces + the lazy model
 * dialogs against ONE `useProviderSettings` bag, so the unified page and the
 * hook share a single provider cache / selection state. No data wiring changes
 * — this is the former right panel, prop-for-prop.
 */
import { KeyRound, X } from 'lucide-react';
import React, { lazy, Suspense, useState } from 'react';

import { Button } from '../host/ui';
import { useTranslation } from '../host/vendored/useTranslation';

import type { useProviderSettings } from './hooks/useProviderSettings';
import { ProviderDetails } from './ProviderDetails';
import { ProviderForm } from './ProviderForm';

// Heavy model dialogs split into their own chunk (design D4 / task 3.5) — only
// loaded when the user opens one (gated on the `show*` flags below).
const ManageModelsDialog = lazy(() =>
  import('./ManageModelsDialog').then((m) => ({ default: m.ManageModelsDialog })),
);
const ManualModelDialog = lazy(() =>
  import('./ManualModelDialog').then((m) => ({ default: m.ManualModelDialog })),
);
const EditModelDialog = lazy(() =>
  import('./EditModelDialog').then((m) => ({ default: m.EditModelDialog })),
);
// The encrypted credential migration-pack export/import bar + dialogs — now a
// cross-page primitive in `../shared/` (`secrets-pack-media-search`). Lazy-split
// (the P2b pattern) — pulled in only when the LLM section mounts; the dialogs
// themselves only render the heavy body when opened.
const MigrationPackDialogs = lazy(() =>
  import('../shared/MigrationPackDialogs').then((m) => ({ default: m.MigrationPackDialogs })),
);

export type ProviderSettingsBag = ReturnType<typeof useProviderSettings>;

export function ProviderDetailPanel({ s }: { s: ProviderSettingsBag }) {
  const t = useTranslation();
  // Re-entry banner dismiss state (per-view, resets on remount) — non-blocking.
  const [reentryDismissed, setReentryDismissed] = useState(false);

  const showReentryBanner = s.missingKeyCount > 0 && !reentryDismissed;

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* MigrationPackDialogs (P2b-2 `byo-p2-llm-2`): the encrypted credential
            pack export/import bar, wired to `secretsPackClient` over the new
            `host.services.secretsPack` port (`host:secrets-pack`). PASSPHRASE-IN,
            COUNTS/PATH-OUT — no blob/plaintext crosses. Lazy-split. */}
        <Suspense fallback={null}>
          <MigrationPackDialogs />
        </Suspense>

        {/* Secret re-entry banner (provider-storage-overlay): non-blocking,
            dismissible — shown when ≥1 enabled provider has no stored key
            (e.g. a new machine / restored profile where machine-local secrets
            did not travel). Affected rows are identifiable via `hasKey`. */}
        {showReentryBanner ? (
          <div
            className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-surface-2/60 text-sm"
            role="status"
          >
            <KeyRound className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="flex-1 min-w-0 text-foreground">
              {t('providerSettings.reentryBanner.message', { count: s.missingKeyCount })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setReentryDismissed(true)}
              title={t('common.dismiss')}
              aria-label={t('common.dismiss')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <div className="flex-1 min-h-0 overflow-y-auto">
          {s.isAddingNew ? (
            <ProviderForm
              isEditing={false}
              isAddingNew
              formData={s.formData}
              setFormData={s.setFormData}
              formError={s.formError}
              showApiKey={s.showApiKey}
              setShowApiKey={s.setShowApiKey}
              onCancel={s.handleCancelEdit}
              onSave={s.handleSaveProvider}
            />
          ) : s.isEditing ? (
            <ProviderForm
              isEditing={s.isEditing}
              isAddingNew={s.isAddingNew}
              formData={s.formData}
              setFormData={s.setFormData}
              formError={s.formError}
              showApiKey={s.showApiKey}
              setShowApiKey={s.setShowApiKey}
              hasKey={s.selectedProvider?.hasKey}
              hasCodingPlanKey={Boolean(s.selectedProvider?.codingPlan?.enabled)}
              onCancel={s.handleCancelEdit}
              onSave={s.handleSaveProvider}
            />
          ) : (
            <ProviderDetails
              selectedProvider={s.selectedProvider}
              visibleModelGroups={s.visibleModelGroups}
              inlineName={s.inlineName}
              setInlineName={s.setInlineName}
              inlineApiKey={s.inlineApiKey}
              setInlineApiKey={s.setInlineApiKey}
              revealedApiKey={s.revealedApiKey}
              onToggleShowApiKey={s.handleToggleShowApiKey}
              onApiKeyInputChange={s.handleApiKeyInputChange}
              inlineApiUrl={s.inlineApiUrl}
              setInlineApiUrl={s.setInlineApiUrl}
              inlineModelsEndpoint={s.inlineModelsEndpoint}
              setInlineModelsEndpoint={s.setInlineModelsEndpoint}
              inlineMaxConcurrency={s.inlineMaxConcurrency}
              setInlineMaxConcurrency={s.setInlineMaxConcurrency}
              showApiKey={s.showApiKey}
              setShowApiKey={s.setShowApiKey}
              modelStatus={s.modelStatus}
              modelSearch={s.modelSearch}
              setModelSearch={s.setModelSearch}
              collapsedGroups={s.collapsedGroups}
              toggleGroupCollapse={s.toggleGroupCollapse}
              editingModel={s.editingModel}
              setEditingModel={s.setEditingModel}
              onInlineUpdate={s.handleInlineUpdate}
              onSelectApiMode={s.handleSelectApiMode}
              onToggleProvider={s.handleToggleProvider}
              onToggleOfficial={s.handleToggleOfficial}
              onDeleteProvider={s.handleDeleteProvider}
              onResetProvider={s.handleResetProvider}
              onShowManageModels={() => s.setShowManageModels(true)}
              onShowAddModelDialog={() => s.setShowAddModelDialog(true)}
              onApplyModelEdit={s.handleApplyModelEdit}
              onToggleModelEnabled={s.handleToggleModelEnabled}
              onRemoveModel={s.handleRemoveModel}
              onShowEditModelDialog={s.onShowEditModelDialog}
            />
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        {s.showManageModels ? (
          <ManageModelsDialog
            selectedProvider={s.selectedProvider}
            showManageModels={s.showManageModels}
            setShowManageModels={s.setShowManageModels}
            discoveryResult={s.discoveryResult}
            filteredDiscoveryModels={s.filteredDiscoveryModels}
            catalogGroups={s.catalogGroups}
            catalogSearchTerm={s.catalogSearchTerm}
            setCatalogSearchTerm={s.setCatalogSearchTerm}
            catalogFilter={s.catalogFilter}
            setCatalogFilter={s.setCatalogFilter}
            catalogCollapsedGroups={s.catalogCollapsedGroups}
            toggleCatalogGroup={s.toggleCatalogGroup}
            modelDiscoveryLoading={s.modelDiscoveryLoading}
            modelDiscoveryError={s.modelDiscoveryError}
            existingModelIds={s.existingModelIds}
            onLoadModelDiscovery={s.loadModelDiscovery}
            onAddDiscoveredModel={s.handleAddDiscoveredModel}
          />
        ) : null}

        {s.showAddModelDialog ? (
          <ManualModelDialog
            selectedProvider={s.selectedProvider}
            showAddModelDialog={s.showAddModelDialog}
            setShowAddModelDialog={s.setShowAddModelDialog}
            newModelEntry={s.newModelEntry}
            setNewModelEntry={s.setNewModelEntry}
            normalizedModelGroups={s.normalizedModelGroups}
            defaultGroupId={s.defaultGroupId}
            onAddModelEntry={s.handleAddModelEntry}
          />
        ) : null}

        {s.showEditModelDialog ? (
          <EditModelDialog
            selectedProvider={s.selectedProvider}
            showEditModelDialog={s.showEditModelDialog}
            setShowEditModelDialog={s.setShowEditModelDialog}
            editModelEntry={s.editModelEntry}
            setEditModelEntry={s.setEditModelEntry}
            normalizedModelGroups={s.normalizedModelGroups}
            onApplyEditModelDialog={s.handleApplyEditModelDialog}
            setEditingModel={s.setEditingModel}
          />
        ) : null}
      </Suspense>
    </>
  );
}

export default ProviderDetailPanel;
