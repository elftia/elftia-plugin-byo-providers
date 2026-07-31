import { KeyRound, X } from 'lucide-react';
import React, { lazy, Suspense, useState } from 'react';

import { Button } from '../host/ui';
import { useTranslation } from '../host/vendored/useTranslation';

import { useProviderSettings } from './hooks/useProviderSettings';
import { ProviderDetails } from './ProviderDetails';
import { ProviderForm } from './ProviderForm';
import { ProviderList } from './ProviderList';

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

export function ProviderSettings() {
  const t = useTranslation();
  // Re-entry banner dismiss state (per-view, resets on remount) — non-blocking.
  const [reentryDismissed, setReentryDismissed] = useState(false);
  const {
    providers,
    providersLoading,
    searchTerm,
    setSearchTerm,
    selectedProviderId,
    selectedProvider,
    isEditing,
    isAddingNew,
    formData,
    setFormData,
    formError,
    showTemplates: _showTemplates,
    setShowTemplates: _setShowTemplates,
    showApiKey,
    setShowApiKey,
    modelSearch,
    setModelSearch,
    collapsedGroups,
    toggleGroupCollapse,
    showManageModels,
    setShowManageModels,
    showAddModelDialog,
    setShowAddModelDialog,
    modelDiscoveryLoading,
    modelDiscoveryError,
    catalogSearchTerm,
    setCatalogSearchTerm,
    catalogFilter,
    setCatalogFilter,
    catalogCollapsedGroups,
    toggleCatalogGroup,
    newModelEntry,
    setNewModelEntry,
    modelStatus,
    editingModel,
    setEditingModel,
    showEditModelDialog,
    setShowEditModelDialog,
    editModelEntry,
    setEditModelEntry,
    inlineName,
    setInlineName,
    inlineModelsEndpoint,
    setInlineModelsEndpoint,
    inlineApiKey,
    setInlineApiKey,
    inlineApiUrl,
    setInlineApiUrl,
    inlineMaxConcurrency,
    setInlineMaxConcurrency,
    visibleModelGroups,
    normalizedModelGroups,
    defaultGroupId,
    discoveryResult,
    filteredDiscoveryModels,
    catalogGroups,
    existingModelIds,
    handleSelectProvider,
    handleAddProvider,
    handleReorderProviders,
    handleSelectApiMode,
    handleUseTemplate: _handleUseTemplate,
    handleSaveProvider,
    handleCancelEdit,
    handleInlineUpdate,
    handleToggleProvider,
    handleToggleOfficial,
    handleDeleteProvider,
    handleResetProvider,
    missingKeyCount,
    handleRemoveModel,
    handleAddModelEntry,
    handleAddDiscoveredModel,
    handleApplyModelEdit,
    handleApplyEditModelDialog,
    handleToggleModelEnabled,
    loadModelDiscovery,
    onShowEditModelDialog
  } = useProviderSettings();

  const showReentryBanner = missingKeyCount > 0 && !reentryDismissed;

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
              {t('providerSettings.reentryBanner.message', { count: missingKeyCount })}
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

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel - Provider List */}
        <ProviderList
          providers={providers}
          loading={providersLoading}
          selectedProviderId={selectedProviderId}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSelectProvider={handleSelectProvider}
          onAddProvider={handleAddProvider}
          onReorderProviders={handleReorderProviders}
          isAddingNew={isAddingNew}
        />

        {/* Right Panel - Details/Form */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-1/60 wallpaper-blur">
          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isAddingNew ? (
              <ProviderForm
                isEditing={false}
                isAddingNew
                formData={formData}
                setFormData={setFormData}
                formError={formError}
                showApiKey={showApiKey}
                setShowApiKey={setShowApiKey}
                onCancel={handleCancelEdit}
                onSave={handleSaveProvider}
              />
            ) : isEditing ? (
              <ProviderForm
                isEditing={isEditing}
                isAddingNew={isAddingNew}
                formData={formData}
                setFormData={setFormData}
                formError={formError}
                showApiKey={showApiKey}
                setShowApiKey={setShowApiKey}
                hasKey={selectedProvider?.hasKey}
                hasCodingPlanKey={Boolean(selectedProvider?.codingPlan?.enabled)}
                onCancel={handleCancelEdit}
                onSave={handleSaveProvider}
              />
            ) : (
              <ProviderDetails
                selectedProvider={selectedProvider}
                visibleModelGroups={visibleModelGroups}
                inlineName={inlineName}
                setInlineName={setInlineName}
                inlineApiKey={inlineApiKey}
                setInlineApiKey={setInlineApiKey}
                inlineApiUrl={inlineApiUrl}
                setInlineApiUrl={setInlineApiUrl}
                inlineModelsEndpoint={inlineModelsEndpoint}
                setInlineModelsEndpoint={setInlineModelsEndpoint}
                inlineMaxConcurrency={inlineMaxConcurrency}
                setInlineMaxConcurrency={setInlineMaxConcurrency}
                showApiKey={showApiKey}
                setShowApiKey={setShowApiKey}
                modelStatus={modelStatus}
                modelSearch={modelSearch}
                setModelSearch={setModelSearch}
                collapsedGroups={collapsedGroups}
                toggleGroupCollapse={toggleGroupCollapse}
                editingModel={editingModel}
                setEditingModel={setEditingModel}
                onInlineUpdate={handleInlineUpdate}
                onSelectApiMode={handleSelectApiMode}
                onToggleProvider={handleToggleProvider}
                onToggleOfficial={handleToggleOfficial}
                onDeleteProvider={handleDeleteProvider}
                onResetProvider={handleResetProvider}
                onShowManageModels={() => setShowManageModels(true)}
                onShowAddModelDialog={() => setShowAddModelDialog(true)}
                onApplyModelEdit={handleApplyModelEdit}
                onToggleModelEnabled={handleToggleModelEnabled}
                onRemoveModel={handleRemoveModel}
                onShowEditModelDialog={onShowEditModelDialog}
              />
            )}
          </div>
        </div>
      </div>
      </div>

      <Suspense fallback={null}>
        {showManageModels ? (
          <ManageModelsDialog
            selectedProvider={selectedProvider}
            showManageModels={showManageModels}
            setShowManageModels={setShowManageModels}
            discoveryResult={discoveryResult}
            filteredDiscoveryModels={filteredDiscoveryModels}
            catalogGroups={catalogGroups}
            catalogSearchTerm={catalogSearchTerm}
            setCatalogSearchTerm={setCatalogSearchTerm}
            catalogFilter={catalogFilter}
            setCatalogFilter={setCatalogFilter}
            catalogCollapsedGroups={catalogCollapsedGroups}
            toggleCatalogGroup={toggleCatalogGroup}
            modelDiscoveryLoading={modelDiscoveryLoading}
            modelDiscoveryError={modelDiscoveryError}
            existingModelIds={existingModelIds}
            onLoadModelDiscovery={loadModelDiscovery}
            onAddDiscoveredModel={handleAddDiscoveredModel}
          />
        ) : null}

        {showAddModelDialog ? (
          <ManualModelDialog
            selectedProvider={selectedProvider}
            showAddModelDialog={showAddModelDialog}
            setShowAddModelDialog={setShowAddModelDialog}
            newModelEntry={newModelEntry}
            setNewModelEntry={setNewModelEntry}
            normalizedModelGroups={normalizedModelGroups}
            defaultGroupId={defaultGroupId}
            onAddModelEntry={handleAddModelEntry}
          />
        ) : null}

        {showEditModelDialog ? (
          <EditModelDialog
            selectedProvider={selectedProvider}
            showEditModelDialog={showEditModelDialog}
            setShowEditModelDialog={setShowEditModelDialog}
            editModelEntry={editModelEntry}
            setEditModelEntry={setEditModelEntry}
            normalizedModelGroups={normalizedModelGroups}
            onApplyEditModelDialog={handleApplyEditModelDialog}
            setEditingModel={setEditingModel}
          />
        ) : null}
      </Suspense>
    </>
  );
}

export default ProviderSettings;
