/**
 * useCredentialAutoSave.ts - 凭证自动保存 Hook
 *
 * 处理凭证字段的自动保存逻辑，包括防抖和状态管理
 *
 * @module components/MediaProviderSettings/hooks/useCredentialAutoSave
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { CredentialStatus } from '../types';

interface UseCredentialAutoSaveOptions {
  /**
   * 自动保存延迟时间（毫秒）
   */
  delay?: number;
  /**
   * 是否跳过自动保存（用于初始化时）
   */
  skipAutoSaveRef?: React.MutableRefObject<boolean>;
}

interface UseCredentialAutoSaveReturn {
  /**
   * 凭证保存状态
   */
  credentialStatus: CredentialStatus;
  /**
   * 设置凭证状态
   */
  setCredentialStatus: React.Dispatch<React.SetStateAction<CredentialStatus>>;
  /**
   * 调度凭证保存（带防抖）
   */
  scheduleCredentialSave: (values: Record<string, string>) => void;
  /**
   * 立即执行凭证保存
   */
  flushCredentialSave: (values?: Record<string, string>) => Promise<void>;
  /**
   * 最新凭证值的引用
   */
  latestCredentialValuesRef: React.MutableRefObject<Record<string, string>>;
  /**
   * 跳过自动保存的引用
   */
  skipAutoSaveRef: React.MutableRefObject<boolean>;
}

/**
 * 凭证自动保存 Hook
 *
 * 提供凭证字段的自动保存功能，包括：
 * - 防抖保存（默认 600ms）
 * - 保存状态管理（idle -> saving -> saved/error -> idle）
 * - 状态自动重置
 */
export function useCredentialAutoSave(
  onSave: (values: Record<string, string>) => Promise<boolean | undefined>,
  options: UseCredentialAutoSaveOptions = {}
): UseCredentialAutoSaveReturn {
  const { delay = 600 } = options;

  const [credentialStatus, setCredentialStatus] = useState<CredentialStatus>('idle');
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAutoSaveRef = useRef(false);
  const latestCredentialValuesRef = useRef<Record<string, string>>({});

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // 状态自动重置
  useEffect(() => {
    if (credentialStatus === 'saved' || credentialStatus === 'error') {
      const timer = setTimeout(() => setCredentialStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [credentialStatus]);

  const flushCredentialSave = useCallback(
    async (values?: Record<string, string>) => {
      const source = values ?? latestCredentialValuesRef.current;
      setCredentialStatus('saving');
      try {
        const result = await onSave(source);
        setCredentialStatus(result === false ? 'error' : 'saved');
      } catch {
        setCredentialStatus('error');
      }
    },
    [onSave]
  );

  const scheduleCredentialSave = useCallback(
    (values: Record<string, string>) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        void flushCredentialSave(values);
      }, delay);
    },
    [flushCredentialSave, delay]
  );

  return {
    credentialStatus,
    setCredentialStatus,
    scheduleCredentialSave,
    flushCredentialSave,
    latestCredentialValuesRef,
    skipAutoSaveRef
  };
}
