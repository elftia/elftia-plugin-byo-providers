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

export type TokenPlatform = 'claude' | 'codex' | 'gemini' | 'opencodego' | 'kimi';

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
}

export interface CodexTokenSanitized {
  authMethod: AuthMethod;
  status: TokenStatus;
  expiresAt?: string;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  lastRefreshedAt?: string;
  errorMessage?: string;
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

/** Sanitized Kimi block — `hasDeviceId` presence flag only, never the id. */
export interface KimiTokenSanitized {
  authMethod: AuthMethod;
  status: TokenStatus;
  expiresAt?: string;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  hasDeviceId: boolean;
  lastRefreshedAt?: string;
  errorMessage?: string;
}

/** Display-only view of an in-flight Kimi device flow (no deviceCode/token). */
export interface KimiDeviceFlowView {
  sessionId: string;
  state: 'pending' | 'done' | 'error';
  verificationUri: string;
  verificationUriComplete?: string;
  userCode: string;
  error?: string;
}

export interface AccountTokensSanitized {
  claude?: ClaudeTokenSanitized;
  codex?: CodexTokenSanitized;
  gemini?: GeminiTokenSanitized;
  opencodego?: OpenCodeGoTokenSanitized;
  kimi?: KimiTokenSanitized;
  claudeAccounts?: SubscriptionAccountSanitized[];
  codexAccounts?: SubscriptionAccountSanitized[];
  geminiAccounts?: SubscriptionAccountSanitized[];
  opencodegoAccounts?: SubscriptionAccountSanitized[];
  kimiAccounts?: SubscriptionAccountSanitized[];
  updatedAt: string;
}

export interface TokenExchangeResponse {
  success: boolean;
  expiresAt?: string;
  error?: string;
}
