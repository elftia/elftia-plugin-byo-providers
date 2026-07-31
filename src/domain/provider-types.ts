/**
 * Provider 基础类型定义
 *
 * 本文件定义了 LLM Provider 和 Media Provider 的共同基类型。
 * 用于统一抽象和代码复用。
 *
 * @module shared/provider-types
 */

// ============================================================================
// 基础 Provider 类型
// ============================================================================

/**
 * Provider 状态
 */
export type ProviderStatus = 'stable' | 'beta' | 'comingSoon' | 'deprecated';

/**
 * 基础 Provider 接口 - 所有 Provider 类型的共同基类
 */
export interface BaseProvider {
  /** 唯一标识符 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 是否启用 */
  enabled: boolean;
  /** 图标标识 */
  icon?: string;
  /** 官网链接 */
  website?: string;
  /** 文档链接 */
  docsUrl?: string;
  /** 备注说明 */
  notes?: string;
  /** 状态 */
  status?: ProviderStatus;
  /** 是否为系统预设 */
  isSystem?: boolean;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

// ============================================================================
// 凭证类型
// ============================================================================

/**
 * 凭证字段键名
 */
export type CredentialKey = 'apiKey' | 'endpoint' | 'projectId' | 'location' | string;

/**
 * 凭证字段定义
 */
export interface CredentialField {
  /** 字段键名 */
  key: CredentialKey;
  /** 显示标签 */
  label: string;
  /** 是否为密钥（需隐藏显示） */
  secret?: boolean;
  /** 是否必填 */
  required?: boolean;
  /** 占位提示 */
  placeholder?: string;
}

/**
 * Provider 凭证配置
 */
export interface ProviderCredentials {
  /** API 端点 */
  endpoint?: string;
  /** API 密钥 */
  apiKey?: string;
  /** 项目 ID (如 Google Cloud) */
  projectId?: string;
  /** 区域 (如 Google Cloud) */
  location?: string;
  /** 其他扩展字段 */
  [key: string]: string | undefined;
}

// ============================================================================
// 模型配置类型
// ============================================================================

/**
 * 基础模型配置
 */
export interface BaseModelConfig {
  /** 模型 ID */
  id: string;
  /** 显示名称 */
  name: string;
  /** 是否启用 */
  enabled: boolean;
  /** 描述 */
  description?: string;
  /** 排序顺序 */
  sortOrder?: number;
}

/**
 * 基础模型分组
 */
export interface BaseModelGroup {
  /** 分组 ID */
  id: string;
  /** 分组名称 */
  name?: string;
  /** 排序顺序 */
  sortOrder?: number;
}

// ============================================================================
// ConfigService 接口
// ============================================================================

/**
 * 缓存统计信息
 */
export interface ConfigServiceCacheStats {
  /** 是否已缓存 */
  cached: boolean;
  /** 缓存条目数量 */
  count: number;
  /** 上次加载时间戳 */
  lastLoadedAt: number;
}

/**
 * ConfigService 基础接口
 * LLMConfigService 和 MediaConfigService 都应实现此接口
 */
export interface IConfigService<T extends BaseProvider> {
  /** 获取所有 Provider */
  listProviders(): Promise<T[]>;
  /** 获取单个 Provider */
  getProvider(id: string): Promise<T | undefined>;
  /** 获取缓存统计 */
  getCacheStats(): ConfigServiceCacheStats;
}

// ============================================================================
// 操作结果类型
// ============================================================================

/**
 * Provider 操作结果
 */
export interface ProviderOperationResult<T extends BaseProvider = BaseProvider> {
  /** 是否成功 */
  success: boolean;
  /** 返回的 Provider */
  provider?: T;
  /** 消息 */
  message?: string;
}
