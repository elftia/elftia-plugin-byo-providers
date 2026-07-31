export const MIN_PASSPHRASE_LENGTH = 8;
export const RECOMMENDED_PASSPHRASE_LENGTH = 12;

export interface SecretsPackArgs {
  passphrase: string;
}

export interface SecretsPackExportResult {
  success: boolean;
  path?: string;
  canceled?: boolean;
  message?: string;
}

export interface SecretsPackImportCounts {
  providerKeys: number;
  poolKeys: number;
  tokenSets: number;
  mediaKeys: number;
  searchKeys: number;
  duplicatePoolKeys: number;
  skipped: string[];
}

export interface SecretsPackImportResult {
  success: boolean;
  imported?: SecretsPackImportCounts;
  canceled?: boolean;
  message?: string;
}
