import React, { useEffect, useRef, useState } from 'react';

import { Button, Dialog, DialogContent, DialogTitle, Input } from '../host/ui';
import { useTranslation } from '../host/vendored/useTranslation';

import {
  installKeyViewingPrompt,
  onKeyViewingBlur,
  type KeyViewingPromptMode,
  type ProtectedRead,
  type RevealResult,
} from './keyViewingRequest';

type Request = {
  read: ProtectedRead;
  mode: KeyViewingPromptMode;
  resolve: (value: RevealResult) => void;
};

export function KeyViewingPrompt() {
  const t = useTranslation();
  const [request, setRequest] = useState<Request | null>(null);
  const active = useRef<Request | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const settle = (result: RevealResult) => {
    active.current?.resolve(result);
    active.current = null;
    setRequest(null);
    setPassword('');
    setConfirmation('');
    setError(null);
    setPending(false);
  };
  useEffect(() => {
    const uninstall = installKeyViewingPrompt(
      (read, mode) =>
        new Promise((resolve) => {
          active.current?.resolve({ success: false });
          const next = { read, mode, resolve };
          active.current = next;
          setPassword('');
          setConfirmation('');
          setError(null);
          setPending(false);
          setRequest(next);
        })
    );
    const unsubscribe = onKeyViewingBlur(() => settle({ success: false }));
    const cancel = () => settle({ success: false });
    window.addEventListener('elftia-cancel-key-viewing', cancel);
    return () => {
      uninstall();
      unsubscribe();
      window.removeEventListener('elftia-cancel-key-viewing', cancel);
      active.current?.resolve({ success: false });
      active.current = null;
    };
  }, []);

  const submit = async () => {
    if (!request || pending) return;
    if (request.mode === 'set') {
      if (password.length < 4 || password.length > 8) {
        setError('length');
        return;
      }
      if (password !== confirmation) {
        setError('mismatch');
        return;
      }
    }
    setPending(true);
    setError(null);
    try {
      const result = await request.read(password);
      if (active.current !== request) return;
      setPassword('');
      setConfirmation('');
      if (result.success) settle(result);
      else
        setError(
          result.error === 'view-password-locked'
            ? 'locked'
            : result.error === 'view-password-length'
              ? 'length'
            : result.error === 'view-password-invalid' || result.error === 'view-password-required'
              ? 'invalid'
              : 'unavailable'
        );
    } catch {
      if (active.current === request) {
        setPassword('');
        setConfirmation('');
        setError('unavailable');
      }
    } finally {
      if (active.current === request) setPending(false);
    }
  };

  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) settle({ success: false });
      }}
    >
      <DialogContent
        data-testid="dialog-panel-key-viewing-auth"
        aria-describedby="key-viewing-auth-description"
      >
        <DialogTitle>{t(request?.mode === 'set' ? 'keyViewing.setTitle' : 'keyViewing.title')}</DialogTitle>
        <p id="key-viewing-auth-description" className="text-sm text-muted-foreground">
          {t(request?.mode === 'set' ? 'keyViewing.setDescription' : 'keyViewing.description')}
        </p>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Input
            type="password"
            autoComplete={request?.mode === 'set' ? 'new-password' : 'current-password'}
            maxLength={request?.mode === 'set' ? 8 : 128}
            value={password}
            aria-label={t(request?.mode === 'set' ? 'keyViewing.newPassword' : 'keyViewing.password')}
            data-testid="dialog-input-key-viewing-password"
            onChange={(event) => setPassword(event.target.value)}
          />
          {request?.mode === 'set' ? (
            <Input
              type="password"
              autoComplete="new-password"
              maxLength={8}
              value={confirmation}
              aria-label={t('keyViewing.confirmation')}
              data-testid="dialog-input-key-viewing-confirmation"
              onChange={(event) => setConfirmation(event.target.value)}
            />
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {t(`keyViewing.${error}`)}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              data-testid="dialog-button-key-viewing-cancel"
              onClick={() => settle({ success: false })}
            >
              {t('keyViewing.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={pending || !password}
              data-testid="dialog-button-key-viewing-confirm"
            >
              {t(request?.mode === 'set' ? 'keyViewing.save' : 'keyViewing.confirm')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
