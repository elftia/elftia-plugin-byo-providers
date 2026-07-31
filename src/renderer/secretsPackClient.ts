/**
 * secretsPackClient — typed renderer wrappers over the main-half `secretsPack.*`
 * relay (P2b-2 `byo-p2-llm-2`).
 *
 * `host.services.secretsPack` is MAIN-side; the renderer reaches it only through
 * `host.ipc.invoke` → the plugin's main relay. PASSPHRASE-IN, COUNTS/PATH/
 * STATUS-OUT: the plugin passes ONLY a passphrase and receives ONLY status/counts/
 * path — the host runs the native save/open dialog + ALL encryption/decryption +
 * the file I/O + the ingest entirely main-side. The encrypted `.epack` blob, the
 * plaintext keys/tokens, and the passphrase NEVER round-trip back to the plugin.
 *
 * Return types are the CANONICAL `@elftia/shared/contracts/api/secretsPack` types
 * (bundled — pure contract/data). By construction NO field carries a key, token,
 * blob, or passphrase (the contract masks them out structurally).
 *
 * @module byo-providers/renderer/secretsPackClient
 */
import type {
  SecretsPackArgs,
  SecretsPackExportResult,
  SecretsPackImportResult,
} from '@byo/domain/secrets-pack';

import { getHost } from './host/hostBridge';

function invoke<T>(method: string, payload?: unknown): Promise<T> {
  return getHost().ipc.invoke<T>(method, payload);
}

/** The encrypted credential migration-pack client (passphrase-in, counts/path-out). */
export const secretsPackClient = {
  /**
   * Export an encrypted pack. Passes ONLY the passphrase; the host picks the
   * destination via the native save dialog, encrypts + writes the `.epack`, and
   * returns `{ success, path?, canceled?, message? }`. No blob/plaintext returns.
   */
  export(args: SecretsPackArgs): Promise<SecretsPackExportResult> {
    return invoke('secretsPack.export', args);
  },
  /**
   * Import an encrypted pack. Passes ONLY the passphrase; the host picks the
   * source via the native open dialog, decrypts + ingests, and returns
   * `{ success, imported?: counts, canceled?, message? }`. Counts only.
   */
  import(args: SecretsPackArgs): Promise<SecretsPackImportResult> {
    return invoke('secretsPack.import', args);
  },
};

export type SecretsPackClient = typeof secretsPackClient;
