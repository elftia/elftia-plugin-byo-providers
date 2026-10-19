export type RevealResult = { success: boolean; value?: string; error?: string };
export type ProtectedRead = (password?: string) => Promise<RevealResult>;
export type KeyViewingPromptMode = 'set' | 'verify';
type Prompt = (read: ProtectedRead, mode: KeyViewingPromptMode) => Promise<RevealResult>;
let prompt: Prompt | null = null;
let generation = 0;

export function cancelKeyViewing(): void {
  generation += 1;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('elftia-cancel-key-viewing'));
}

export function installKeyViewingPrompt(next: Prompt): () => void {
  prompt = next;
  return () => {
    if (prompt === next) prompt = null;
  };
}

/** No password cache or unlocked session: every protected operation asks again. */
export async function requestKeyViewing(read: ProtectedRead): Promise<RevealResult> {
  const version = generation;
  const result = await read();
  if (version !== generation) return { success: false };
  if (result.error === 'view-password-not-set') {
    return prompt ? prompt(read, 'set') : { success: false, error: 'view-password-unavailable' };
  }
  if (result.error === 'view-password-required' || result.error === 'view-password-locked') {
    return prompt ? prompt(read, 'verify') : { success: false, error: 'view-password-unavailable' };
  }
  return result;
}

/** The opaque compartment receives the actual app-window blur from its host. */
export function onKeyViewingBlur(hide: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handler = () => {
    cancelKeyViewing();
    hide();
  };
  window.addEventListener('blur', handler);
  window.addEventListener('elftia-host-window-blur', handler);
  return () => {
    window.removeEventListener('blur', handler);
    window.removeEventListener('elftia-host-window-blur', handler);
  };
}
