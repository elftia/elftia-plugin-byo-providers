/**
 * oauthPaste — pure split + CSRF-validate of the Claude OAuth paste string.
 *
 * Claude's `code: 'true'` OAuth flow hands the user a combined `<code>#<state>`
 * string to paste. This mirrors the reference daemon implementation
 * (`packages/omnicross-daemon/src/commands/login.ts` `loginClaude`): split on
 * '#', require a non-empty code, and (when a state segment is present) validate
 * it against the state we generated — a CSRF guard. The CLEAN code + the REAL
 * generated state are what the exchange must send (the old chain sent the whole
 * blob as the code and hardcoded `state: ''`, which Anthropic always rejected).
 */

/** Discriminated result of parsing a pasted `code#state` string. */
export type ParsedOAuthPaste =
  | { ok: true; code: string }
  | { ok: false; reason: 'empty-code' | 'state-mismatch' };

/**
 * Split a pasted `code#state` (or bare `code`) string and validate the state.
 *
 * @param pasted        the raw pasted string (already trimmed by the caller is fine)
 * @param expectedState the `state` from `generateAuthParams()` (the real one)
 */
export function parseOAuthPaste(pasted: string, expectedState: string): ParsedOAuthPaste {
  const trimmed = pasted.trim();
  // Claude's oob callback returns `code#state`; split on the FIRST '#' only
  // (the state segment itself never contains '#', but be defensive about code).
  const hashIdx = trimmed.indexOf('#');
  const code = (hashIdx === -1 ? trimmed : trimmed.slice(0, hashIdx)).trim();
  const pastedState = hashIdx === -1 ? '' : trimmed.slice(hashIdx + 1).trim();

  if (!code) return { ok: false, reason: 'empty-code' };
  // Only validate when the user actually pasted a state segment (a bare code is
  // accepted — same as the daemon's `if (pastedState && pastedState !== state)`).
  if (pastedState && pastedState !== expectedState) {
    return { ok: false, reason: 'state-mismatch' };
  }
  return { ok: true, code };
}
