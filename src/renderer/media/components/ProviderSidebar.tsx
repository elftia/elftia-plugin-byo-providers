/**
 * ProviderSidebar.tsx - Provider 侧边栏组件
 *
 * 显示 Provider 列表和搜索功能
 *
 * @module components/MediaProviderSettings/components/ProviderSidebar
 */

import { CircleDot, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';

import { Badge, Button, Input } from '../../host/ui';
import { cn } from '../../host/vendored/cn';
import { ScrollArea } from '../../host/vendored/scroll-area';
import type { ProviderStatus } from '../types';
import { statusColor } from '../utils';

interface ProviderItem {
  id: string;
  name: string;
  description?: string;
  status?: ProviderStatus;
  enabled?: boolean;
  badge?: string;
  custom?: boolean;
  models?: unknown[];
}

export interface ProviderSidebarProps<T extends ProviderItem> {
  /**
   * Provider 列表
   */
  providers: T[];
  /**
   * 已过滤的 Provider 列表
   */
  filteredProviders: T[];
  /**
   * 选中的 Provider ID
   */
  selectedProviderId: string;
  /**
   * 选中 Provider 回调
   */
  onSelectProvider: (id: string) => void;
  /**
   * 搜索词
   */
  searchTerm: string;
  /**
   * 设置搜索词
   */
  onSearchChange: (term: string) => void;
  /**
   * 是否正在加载
   */
  isLoading?: boolean;
  /**
   * 添加 Provider 回调（可选）
   */
  onAddProvider?: () => void;
  /**
   * 是否显示添加按钮
   */
  showAddButton?: boolean;
  /**
   * 添加按钮是否禁用
   */
  addButtonDisabled?: boolean;
  /**
   * 添加表单插槽（可选）
   */
  addFormSlot?: React.ReactNode;
  /**
   * 翻译函数
   */
  t: (key: string, params?: Record<string, string | number>) => string;
  /**
   * 检查 Provider 是否启用的函数（用于 Video）
   */
  getProviderEnabled?: (provider: T) => boolean;
  /**
   * 获取 Provider 的模型数量
   */
  getModelCount?: (provider: T) => number;
}

export function ProviderSidebar<T extends ProviderItem>({
  filteredProviders,
  selectedProviderId,
  onSelectProvider,
  searchTerm,
  onSearchChange,
  isLoading = false,
  onAddProvider,
  showAddButton = true,
  addButtonDisabled = false,
  addFormSlot,
  t,
  getProviderEnabled,
  getModelCount
}: ProviderSidebarProps<T>) {
  const [enabledOnly, setEnabledOnly] = useState(false);

  const isProviderEnabled = (provider: T): boolean =>
    getProviderEnabled ? getProviderEnabled(provider) : provider.enabled ?? false;

  const displayProviders = enabledOnly
    ? filteredProviders.filter(isProviderEnabled)
    : filteredProviders;

  return (
    <div className="w-72 border-r border-border bg-surface-1/60 flex flex-col">
      <div className="p-3 border-b border-border/70 flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('mediaSettings.common.searchPlaceholder')}
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-8 h-9"
          />
          {searchTerm ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {/* "Enabled only" filter — reuses the generic `providerSettings.*` filter
            strings (already in the plugin's merged i18n seed) so every provider
            sidebar shares one translated label, matching the LLM ProviderList. */}
        <button
          type="button"
          className={cn(
            'h-9 w-9 flex items-center justify-center rounded-md border transition-colors flex-shrink-0',
            enabledOnly
              ? 'border-primary text-primary bg-primary/10'
              : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground',
          )}
          onClick={() => setEnabledOnly((prev) => !prev)}
          aria-pressed={enabledOnly}
          aria-label={enabledOnly ? t('providerSettings.showAll') : t('providerSettings.showEnabledOnly')}
          title={enabledOnly ? t('providerSettings.showAll') : t('providerSettings.showEnabledOnly')}
        >
          <CircleDot className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {displayProviders.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              {searchTerm.trim() || enabledOnly
                ? t('mediaSettings.common.emptySearch')
                : t('mediaSettings.common.emptyList')}
            </p>
          ) : (
            displayProviders.map((provider) => {
              const isSelected = provider.id === selectedProviderId;
              const enabled = getProviderEnabled
                ? getProviderEnabled(provider)
                : provider.enabled ?? false;
              const modelCount = getModelCount
                ? getModelCount(provider)
                : provider.models?.length ?? 0;
              return (
                <button
                  key={provider.id}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-transparent hover:border-primary/40 hover:bg-surface-2'
                  )}
                  onClick={() => onSelectProvider(provider.id)}
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          statusColor(provider.status, enabled)
                        )}
                      />
                      <span className="font-medium text-sm">{provider.name}</span>
                      {provider.custom ? (
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {t('mediaSettings.image.customLabel')}
                        </Badge>
                      ) : null}
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] uppercase tracking-wide"
                    >
                      {enabled
                        ? t('mediaSettings.common.enabled')
                        : t('mediaSettings.common.disabled')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {modelCount > 0
                      ? t('mediaSettings.common.modelCount', { count: modelCount })
                      : t('mediaSettings.common.noModels')}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
      <div className="border-t border-border/70 p-3 space-y-3">
        {addFormSlot}
        {showAddButton && onAddProvider ? (
          <Button
            className="w-full"
            variant="outline"
            onClick={onAddProvider}
            disabled={addButtonDisabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('mediaSettings.common.addProvider')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
