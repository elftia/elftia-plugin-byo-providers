/**
 * AddModelDialog.tsx - 添加模型对话框组件
 *
 * 用于手动添加新模型
 *
 * @module components/MediaProviderSettings/components/AddModelDialog
 */

import { Button, Input, Select } from '../../host/ui';
import type { BaseModel,GenericModelGroup, ModelEntry } from '../types';

export interface AddModelDialogProps<T extends BaseModel> {
  /**
   * 是否显示对话框
   */
  isOpen: boolean;
  /**
   * 关闭对话框回调
   */
  onClose: () => void;
  /**
   * 新模型条目
   */
  modelEntry: ModelEntry;
  /**
   * 设置新模型条目
   */
  setModelEntry: React.Dispatch<React.SetStateAction<ModelEntry>>;
  /**
   * 可用分组列表
   */
  groups: GenericModelGroup<T>[];
  /**
   * 提交添加回调
   */
  onSubmit: (id: string, name: string, groupId: string) => void;
  /**
   * 翻译函数
   */
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function AddModelDialog<T extends BaseModel>({
  isOpen,
  onClose,
  modelEntry,
  setModelEntry,
  groups,
  onSubmit,
  t
}: AddModelDialogProps<T>) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">
            {t('providerSettings.modelsManager.manualDialog.title')}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t('providerSettings.modelsManager.manualDialog.subtitle')}
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1">
              {t('providerSettings.modelsManager.manualDialog.modelId')}
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={modelEntry.id}
              onChange={(event) =>
                setModelEntry((prev) => ({ ...prev, id: event.target.value }))
              }
              placeholder={t('providerSettings.modelsManager.manualDialog.modelIdPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('providerSettings.modelsManager.manualDialog.modelIdHelper')}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('providerSettings.modelsManager.manualDialog.modelName')}
            </label>
            <Input
              value={modelEntry.name}
              onChange={(event) =>
                setModelEntry((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder={t('providerSettings.modelsManager.manualDialog.modelNamePlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('providerSettings.modelsManager.manualDialog.modelNameHelper')}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('providerSettings.modelsManager.manualDialog.group')}
            </label>
            <Select
              value={modelEntry.groupId}
              onChange={(value) =>
                setModelEntry((prev) => ({ ...prev, groupId: value }))
              }
              className="w-full"
              options={groups.map((group) => ({
                value: group.id,
                label: group.name || group.id
              }))}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3 bg-muted/30">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('providerSettings.modelsManager.manualDialog.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => onSubmit(modelEntry.id, modelEntry.name, modelEntry.groupId)}
            disabled={!modelEntry.id.trim()}
          >
            {t('providerSettings.modelsManager.manualDialog.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
