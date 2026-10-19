import React, { useState } from 'react';

import { getHost } from '../host/hostBridge';
import { Button } from '../host/ui';
import { useTranslation } from '../host/vendored/useTranslation';

import type { RevealResult } from './keyViewingRequest';

export async function copySavedKey(read: () => Promise<RevealResult>): Promise<boolean> {
  const result = await read();
  if (!result.success || typeof result.value !== 'string') return false;
  const host = getHost() as unknown as { clipboard?: { writeText(text: string): Promise<void> } };
  if (!host.clipboard) throw new Error('Clipboard unavailable');
  await host.clipboard.writeText(result.value);
  return true;
}

export function KeyCopyButton({ read }: { read: () => Promise<RevealResult> }) {
  const t = useTranslation();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending}
        data-testid="settings-button-copy-saved-key"
        onClick={async () => {
          setPending(true);
          setStatus(null);
          try {
            if (await copySavedKey(read)) setStatus('copied');
          } catch {
            setStatus('copyFailed');
          } finally {
            setPending(false);
          }
        }}
      >
        {t('keyViewing.copy')}
      </Button>
      {status ? (
        <span role="status" className="text-xs text-muted-foreground">
          {t(`keyViewing.${status}`)}
        </span>
      ) : null}
    </div>
  );
}
