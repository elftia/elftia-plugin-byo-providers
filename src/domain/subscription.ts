export type {
  AuthMethod,
  ClaudeAuthMethod,
  OAuthParams,
  SubscriptionAccountSanitized,
  SubscriptionLevel,
  TokenStatus,
} from '@omnicross/contracts/account-tokens-types';
export type { OpenCodeGoTokenSanitized } from '@omnicross/contracts/subscription-types';

import type {
  AuthMethod,
  ClaudeAuthMethod,
  SubscriptionAccountSanitized,
  SubscriptionLevel,
  TokenStatus,
} from '@omnicross/contracts/account-tokens-types';
import type { OpenCodeGoTokenSanitized } from '@omnicross/contracts/subscription-types';

export type TokenPlatform = 'claude' | 'codex' | 'gemini' | 'opencodego';

export interface ClaudeTokenSanitized {
  authMethod: ClaudeAuthMethod;
  status: TokenStatus;
  subscriptionLevel?: SubscriptionLevel;
  expiresAt?: string;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  isSetupToken?: boolean;
  setupTokenExpiresAt?: string;
  lastRefreshedAt?: string;
  errorMessage?: string;
  cliImportAvailable?: boolean;
  cliFileForeignAccount?: { label: string };
}

export interface CodexTokenSanitized {
  authMethod: AuthMethod;
  status: TokenStatus;
  expiresAt?: string;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  lastRefreshedAt?: string;
  errorMessage?: string;
  cliImportAvailable?: boolean;
  cliFileForeignAccount?: { label: string };
}

export interface GeminiTokenSanitized {
  authMethod: AuthMethod;
  status: TokenStatus;
  expiresAt?: string;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  lastRefreshedAt?: string;
  errorMessage?: string;
}

export interface AccountTokensSanitized {
  claude?: ClaudeTokenSanitized;
  codex?: CodexTokenSanitized;
  gemini?: GeminiTokenSanitized;
  opencodego?: OpenCodeGoTokenSanitized;
  claudeAccounts?: SubscriptionAccountSanitized[];
  codexAccounts?: SubscriptionAccountSanitized[];
  geminiAccounts?: SubscriptionAccountSanitized[];
  opencodegoAccounts?: SubscriptionAccountSanitized[];
  cliAutoImport?: { claude?: boolean; codex?: boolean };
  externalCliDetected?: { claude?: boolean; codex?: boolean };
  updatedAt: string;
}

export interface TokenExchangeResponse {
  success: boolean;
  expiresAt?: string;
  error?: string;
}

export interface CliImportResult {
  success: boolean;
  imported?: boolean;
  error?: string;
}
