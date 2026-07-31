/**
 * ProviderDetailsPanel.tsx - 统一的 Provider 详情面板组件
 *
 * 用于 LLM、图片、视频、音乐四种提供商的详情展示
 * 支持通过 props 和 slots 自定义不同类型的特殊内容
 *
 * @module components/provider-settings/shared/ProviderDetailsPanel
 */

import {
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Settings2,
  Trash2,
  X
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Badge, Button, Input, Switch } from '../../host/ui';

// ============================================================================
// Types
// ============================================================================

export interface CredentialField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  secret?: boolean;
}

export interface ModelManagementProps {
  modelSearchTerm: string;
  setModelSearchTerm: (term: string) => void;
  setShowManageModels: (show: boolean) => void;
  setShowAddModelDialog: (show: boolean) => void;
  setNewModelEntry: (entry: { id: string; name: string; groupId: string; originalId: string }) => void;
  defaultGroupId: string;
  modelStatus: { type: 'success' | 'error'; message: string } | null;
}

export interface ProviderDetailsPanelProps {
  /** 提供商类型 */
  type: 'image' | 'video' | 'music' | 'asr' | 'tts' | 'llm';
  /** 提供商名称 */
  name: string;
  /** 是否可编辑名称 */
  editableName?: boolean;
  /** 名称变更回调 */
  onNameChange?: (name: string) => void;
  /** 名称保存回调 */
  onNameBlur?: () => void;
  /** 类型标签文本 */
  typeBadge: string;
  /** 是否为自定义提供商 */
  isCustom?: boolean;
  /** 是否启用 */
  enabled: boolean;
  /** 切换启用状态 */
  onToggleEnabled: (enabled: boolean) => void;
  /** 是否禁用开关 */
  switchDisabled?: boolean;
  /** 删除回调（仅自定义提供商） */
  onDelete?: () => void;
  /** 错误消息 */
  errorMessage?: string | null;
  /** 凭证字段定义 */
  credentialFields: CredentialField[];
  /** 凭证表单值 */
  formValues: Record<string, string>;
  /** 字段变更回调 */
  onFieldChange: (field: string, value: string) => void;
  /** 是否正在保存凭证 */
  isCredentialSaving?: boolean;
  /** 凭证保存状态消息 */
  credentialStatusMessage?: string | null;
  /** 模型管理相关 props */
  modelManagement?: ModelManagementProps;
  /** 模型列表渲染插槽 */
  modelListSlot?: ReactNode;
  /** 头部之后的自定义内容插槽 */
  afterHeaderSlot?: ReactNode;
  /** 凭证字段之后的自定义内容插槽 */
  afterCredentialsSlot?: ReactNode;
  /** 模型管理之后的自定义内容插槽 */
  afterModelsSlot?: ReactNode;
  /** 底部操作栏之前的自定义内容插槽 */
  beforeFooterSlot?: ReactNode;
  /** 文档链接 */
  docsUrl?: string;
  /** 翻译函数 */
  t: (key: string, params?: Record<string, string | number>) => string;
}

// ============================================================================
// Helper: 统一凭证字段标签
// ============================================================================

function getUnifiedFieldLabel(
  fieldKey: string,
  t: (key: string) => string
): string {
  const lowerKey = fieldKey.toLowerCase();
  if (lowerKey === 'apikey' || lowerKey === 'api_key') {
    return t('providerSettings.credentials.apiKey');
  }
  if (
    lowerKey === 'endpoint' ||
    lowerKey === 'apiurl' ||
    lowerKey === 'api_url' ||
    lowerKey === 'baseurl' ||
    lowerKey === 'api_base_url'
  ) {
    return t('providerSettings.credentials.apiBaseUrl');
  }
  // 对于其他字段，返回原始 label
  return '';
}

// ============================================================================
// Component
// ============================================================================

export function ProviderDetailsPanel({
  name,
  editableName = false,
  onNameChange,
  onNameBlur,
  typeBadge,
  isCustom = false,
  enabled,
  onToggleEnabled,
  switchDisabled = false,
  onDelete,
  errorMessage,
  credentialFields,
  formValues,
  onFieldChange,
  isCredentialSaving = false,
  credentialStatusMessage,
  modelManagement,
  modelListSlot,
  afterHeaderSlot,
  afterCredentialsSlot,
  afterModelsSlot,
  beforeFooterSlot,
  docsUrl,
  t
}: ProviderDetailsPanelProps) {
  // 控制密码字段显示/隐藏
  const [showSecretFields, setShowSecretFields] = useState<Record<string, boolean>>({});

  const toggleSecretField = (fieldKey: string) => {
    setShowSecretFields((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            {editableName && onNameChange ? (
              <Input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                onBlur={onNameBlur}
                className="h-9 text-lg font-semibold border-transparent hover:border-border focus:border-border bg-transparent px-0"
              />
            ) : (
              <h3 className="text-lg font-semibold">{name}</h3>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{typeBadge}</Badge>
              {isCustom ? (
                <Badge variant="secondary">
                  {t('mediaSettings.image.customLabel')}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={enabled}
            onCheckedChange={onToggleEnabled}
            disabled={switchDisabled}
          />
          {isCustom && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
              title={t('common.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {/* 错误消息 */}
      {errorMessage ? (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-3">{errorMessage}</span>
        </div>
      ) : null}

      {/* 头部之后的自定义内容 */}
      {afterHeaderSlot}

      {/* 凭证字段 */}
      {credentialFields.map((field) => {
        const unifiedLabel = getUnifiedFieldLabel(field.key, t);
        const displayLabel = unifiedLabel || field.label;
        // 在 endpoint/url 类型字段旁显示文档链接
        const isUrlField =
          field.key.toLowerCase().includes('endpoint') ||
          field.key.toLowerCase().includes('url') ||
          field.key.toLowerCase().includes('base');
        const showDocsLink = isUrlField && docsUrl;

        return (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                {displayLabel}
                {field.required ? <span className="text-red-500 ml-1">*</span> : null}
              </label>
              <div className="flex-1" />
              {showDocsLink ? (
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={t('mediaSettings.common.learnMore')}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
            {field.secret ? (
              <div className="relative">
                <Input
                  type={showSecretFields[field.key] ? 'text' : 'password'}
                  value={formValues[field.key] ?? ''}
                  onChange={(e) => onFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={isCredentialSaving}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                  onClick={() => toggleSecretField(field.key)}
                >
                  {showSecretFields[field.key] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            ) : (
              <Input
                type="text"
                value={formValues[field.key] ?? ''}
                onChange={(e) => onFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                disabled={isCredentialSaving}
              />
            )}
          </div>
        );
      })}

      {/* 凭证字段之后的自定义内容 */}
      {afterCredentialsSlot}

      {/* 模型管理区域 */}
      {modelManagement ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Input
                placeholder={t('providerSettings.modelsManager.searchPlaceholder')}
                value={modelManagement.modelSearchTerm}
                onChange={(e) => modelManagement.setModelSearchTerm(e.target.value)}
                className="pr-8"
              />
              {modelManagement.modelSearchTerm ? (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                  onClick={() => modelManagement.setModelSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => modelManagement.setShowManageModels(true)}
            >
              <Settings2 className="h-4 w-4 mr-1" />
              {t('providerSettings.modelsManager.manage')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                modelManagement.setNewModelEntry({
                  id: '',
                  name: '',
                  groupId: modelManagement.defaultGroupId,
                  originalId: ''
                });
                modelManagement.setShowAddModelDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('providerSettings.modelsManager.add')}
            </Button>
          </div>
          {modelManagement.modelStatus ? (
            <div
              className={`text-xs px-3 py-2 rounded border ${
                modelManagement.modelStatus.type === 'success'
                  ? 'border-success/30 bg-success/10 text-success'
                  : 'border-destructive/30 bg-destructive/10 text-destructive'
              }`}
            >
              {modelManagement.modelStatus.message}
            </div>
          ) : null}
          {modelListSlot}
        </div>
      ) : null}

      {/* 模型管理之后的自定义内容 */}
      {afterModelsSlot}

      {/* 底部操作栏之前的自定义内容 */}
      {beforeFooterSlot}

      {/* 底部操作栏 - 只显示保存状态 */}
      {credentialStatusMessage ? (
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/40">
          <span className="text-xs text-muted-foreground">{credentialStatusMessage}</span>
        </div>
      ) : null}
    </div>
  );
}

export default ProviderDetailsPanel;
