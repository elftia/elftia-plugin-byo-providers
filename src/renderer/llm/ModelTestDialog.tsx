/**
 * ModelTestDialog — COPIED from the host
 * `features/settings/components/provider-settings/llm/ModelTestDialog.tsx`
 * (P2b-2 `byo-p2-llm-2`), rewired to the plugin bridge:
 *   - `@/components/ui/{button,dialog}` → `../host/ui` + `../host/vendored/dialog`
 *   - `agent.completion.testModel` → `llmConfigClient.testModel` (the `llm.testModel`
 *     relay → `host.services.llmConfig.testModel`, host-API 1.27)
 *   - `@/shared/state/LocaleContext` → `../host/vendored/useTranslation`
 *
 * NO secret crosses: `testModel` returns a connectivity DIAGNOSTIC only.
 *
 * @module byo-providers/renderer/llm/ModelTestDialog
 */
import { CheckCircle, Loader2, Play, XCircle } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '../host/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../host/vendored/dialog';
import { useTranslation } from '../host/vendored/useTranslation';
import { llmConfigClient } from '../llmConfigClient';

interface ModelTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
}

interface TestResult {
  success: boolean;
  message: string;
  response?: string;
  durationMs?: number;
}

export function ModelTestDialog({
  open,
  onOpenChange,
  providerId,
  providerName,
  modelId,
  modelName,
}: ModelTestDialogProps) {
  const t = useTranslation();
  const [testing, setTesting] = useState(true);
  const [result, setResult] = useState<TestResult | null>(null);
  // Guard: prevent StrictMode double-fire from sending two API calls
  const mountedRef = useRef(false);
  // Monotonic counter to discard stale results when re-test is clicked rapidly
  const callIdRef = useRef(0);

  const runTest = useCallback(async () => {
    const myId = ++callIdRef.current;
    setTesting(true);
    setResult(null);
    try {
      const res = await llmConfigClient.testModel(providerId, modelId);
      if (callIdRef.current !== myId) return;
      setResult({
        success: res.success,
        message: res.message,
        response: res.response,
        durationMs: res.durationMs,
      });
    } catch (error) {
      if (callIdRef.current !== myId) return;
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      if (callIdRef.current === myId) {
        setTesting(false);
      }
    }
  }, [providerId, modelId]);

  // Auto-run test on mount — exactly once. `runTest` is intentionally omitted
  // from the deps (the mountedRef guard ensures a single fire). mountedRef
  // prevents StrictMode from firing a duplicate API call.
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    void runTest();
  }, [runTest]);

  const durationStr = result?.durationMs != null
    ? (result.durationMs / 1000).toFixed(2)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {testing ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : result?.success ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : result ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : null}
            {t('providerSettings.modelsManager.testDialog.title')}
          </DialogTitle>
          <DialogDescription>{modelId}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Provider & Model info */}
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">
              {t('providerSettings.modelsManager.testDialog.provider')}
            </span>
            <span className="font-medium truncate">{providerName}</span>
            <span className="text-muted-foreground">
              {t('providerSettings.modelsManager.testDialog.model')}
            </span>
            <span className="font-medium truncate">{modelName || modelId}</span>
          </div>

          {/* Testing state */}
          {testing ? <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('providerSettings.modelsManager.testDialog.testing')}
            </div> : null}

          {/* Result */}
          {result && !testing ? <div className="space-y-3">
              {/* Success / Failure banner */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  result.success
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0" />
                )}
                <div>
                  <div className="font-medium">
                    {result.success
                      ? t('providerSettings.modelsManager.testDialog.success')
                      : t('providerSettings.modelsManager.testDialog.failure')}
                  </div>
                  {result.success ? (
                    <div className="text-xs opacity-80">
                      {t('providerSettings.modelsManager.testDialog.successMessage')}
                    </div>
                  ) : (
                    <div className="text-xs opacity-80">{result.message}</div>
                  )}
                </div>
              </div>

              {/* AI response — always shown when result exists */}
              {result.success ? <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('providerSettings.modelsManager.testDialog.aiResponse')}
                    </span>
                    {result.response ? (
                      <span className="text-xs text-muted-foreground">
                        {t('providerSettings.modelsManager.testDialog.charCount', {
                          count: result.response.length,
                        })}
                      </span>
                    ) : null}
                  </div>
                  <div className="p-3 rounded-lg bg-surface-1 text-sm max-h-32 overflow-y-auto">
                    {result.response || '—'}
                  </div>
                </div> : null}

              {/* Duration */}
              {durationStr ? <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>
                    {t('providerSettings.modelsManager.testDialog.duration', {
                      time: durationStr,
                    })}
                  </span>
                </div> : null}
            </div> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('providerSettings.modelsManager.testDialog.close')}
          </Button>
          <Button onClick={() => void runTest()} disabled={testing}>
            <Play className="h-4 w-4 mr-1" />
            {t('providerSettings.modelsManager.testDialog.retest')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
