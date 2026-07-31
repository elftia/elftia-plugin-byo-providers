/**
 * ManageModelsModal.tsx - 模型管理弹窗组件
 *
 * 用于显示和管理 Provider 的原始模型目录
 *
 * @module components/MediaProviderSettings/components/ManageModelsModal
 */

import { RefreshCw } from 'lucide-react';

import { Button } from '../../host/ui';
import type { BaseModel, GenericModelGroup } from '../types';

export interface ManageModelsModalProps<T extends BaseModel> {
  /**
   * 是否显示弹窗
   */
  isOpen: boolean;
  /**
   * 关闭弹窗回调
   */
  onClose: () => void;
  /**
   * Provider 名称
   */
  providerName: string;
  /**
   * 原始模型目录
   */
  originalModels: T[];
  /**
   * 原始分组
   */
  originalGroups: GenericModelGroup<T>[];
  /**
   * 已存在的模型 ID 集合
   */
  existingModelIds: Set<string>;
  /**
   * 添加模型回调
   */
  onAddModel: (model: T) => void;
  /**
   * 恢复模型回调
   */
  onRestore: () => void;
  /**
   * 翻译函数
   */
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function ManageModelsModal<T extends BaseModel>({
  isOpen,
  onClose,
  providerName,
  originalModels,
  originalGroups,
  existingModelIds,
  onAddModel,
  onRestore,
  t
}: ManageModelsModalProps<T>) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {t('providerSettings.modelsManager.manageDialog.title')} · {providerName}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('providerSettings.modelsManager.manageDialog.sourceCache')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onRestore}>
              <RefreshCw className="h-4 w-4 mr-1" />
              {t('mediaSettings.image.refreshModels')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {t('providerSettings.modelsManager.manageDialog.close')}
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {originalModels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('providerSettings.modelsManager.manageDialog.empty')}
            </p>
          ) : (
            originalModels.map((model) => {
              const exists = existingModelIds.has(model.id);
              return (
                <div
                  key={model.id}
                  className="border rounded-md p-3 flex items-center gap-4 justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{model.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{model.id}</div>
                    {model.description ? <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {model.description}
                      </p> : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={exists ? 'outline' : 'default'}
                    disabled={exists}
                    onClick={() => onAddModel(model)}
                  >
                    {exists
                      ? t('providerSettings.modelsManager.messages.duplicate')
                      : t('providerSettings.modelsManager.manageDialog.addFromCatalog')}
                  </Button>
                </div>
              );
            })
          )}
          <details className="border rounded-md">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
              {t('providerSettings.modelsManager.manageDialog.raw')}
            </summary>
            <pre className="text-xs bg-muted/40 p-3 max-h-64 overflow-y-auto">
              {JSON.stringify(
                {
                  models: originalModels,
                  groups: originalGroups
                },
                null,
                2
              )}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
