/**
 * ModelGroupList.tsx - 模型分组列表组件
 *
 * 显示模型分组及其模型列表，支持展开/折叠、启用/禁用、编辑/删除等操作
 *
 * @module components/MediaProviderSettings/components/ModelGroupList
 */

import {
  Check,
  ChevronDown,
  ChevronUp,
  Settings2,
  Trash2,
  X
} from 'lucide-react';

import { Badge, Button, Input, Switch } from '../../host/ui';
import type { BaseModel, GenericModelGroup } from '../types';

export interface ModelGroupListProps<T extends BaseModel> {
  /**
   * 可见分组列表（已过滤）
   */
  visibleGroups: GenericModelGroup<T>[];
  /**
   * 折叠状态
   */
  collapsedGroups: Record<string, boolean>;
  /**
   * 切换折叠状态
   */
  onToggleGroup: (groupId: string) => void;
  /**
   * 当前默认模型 ID
   */
  defaultModelId: string;
  /**
   * 设置默认模型
   */
  onSetDefault: (modelId: string) => void;
  /**
   * 切换模型启用状态
   */
  onToggleModel: (modelId: string, enabled: boolean) => void;
  /**
   * 打开编辑模型对话框
   */
  onEditModel: (model: T) => void;
  /**
   * 删除模型
   */
  onRemoveModel: (modelId: string) => void;
  /**
   * 正在编辑的模型（行内编辑）
   */
  editingModel: { id: string; name: string } | null;
  /**
   * 设置正在编辑的模型
   */
  setEditingModel: React.Dispatch<React.SetStateAction<{ id: string; name: string } | null>>;
  /**
   * 应用行内编辑
   */
  onApplyEdit: () => void;
  /**
   * 翻译函数
   */
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function ModelGroupList<T extends BaseModel>({
  visibleGroups,
  collapsedGroups,
  onToggleGroup,
  defaultModelId,
  onSetDefault,
  onToggleModel,
  onEditModel,
  onRemoveModel,
  editingModel,
  setEditingModel,
  onApplyEdit,
  t
}: ModelGroupListProps<T>) {
  if (visibleGroups.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        {t('providerSettings.modelsManager.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visibleGroups.map((group) => (
        <div key={group.id} className="border rounded-md overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-colors"
            onClick={() => onToggleGroup(group.id)}
          >
            <div>
              <div className="text-sm font-medium">{group.name || group.id}</div>
              <div className="text-xs text-muted-foreground">
                {t('providerSettings.listStatus', { count: group.models.length })}
              </div>
            </div>
            {collapsedGroups[group.id] ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          {!collapsedGroups[group.id] && (
            <div className="divide-y">
              {group.models.map((model) => {
                const isEditingModel = editingModel?.id === model.id;
                const enabled = model.enabled !== false;
                const isDefault = defaultModelId === model.id;
                return (
                  <div key={model.id} className="flex items-center gap-3 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      {isEditingModel ? (
                        <div className="flex gap-2">
                          <Input
                            value={editingModel?.name ?? ''}
                            onChange={(event) =>
                              setEditingModel((prev) =>
                                prev ? { ...prev, name: event.target.value } : prev
                              )
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                onApplyEdit();
                              }
                              if (event.key === 'Escape') {
                                setEditingModel(null);
                              }
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={onApplyEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingModel(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-sm truncate">
                            {model.name || model.id}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {model.id}
                          </div>
                        </>
                      )}
                    </div>
                    {!isEditingModel && (
                      <>
                        {isDefault ? (
                          <Badge variant="secondary" className="text-[11px] uppercase">
                            {t('mediaSettings.image.defaultModel')}
                          </Badge>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onSetDefault(model.id)}
                          >
                            {t('mediaSettings.image.makeDefault')}
                          </Button>
                        )}
                        <Badge variant={enabled ? 'outline' : 'secondary'}>
                          {enabled
                            ? t('providerSettings.modelsManager.enabled')
                            : t('providerSettings.modelsManager.disabled')}
                        </Badge>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => onToggleModel(model.id, checked)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditModel(model)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => onRemoveModel(model.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
