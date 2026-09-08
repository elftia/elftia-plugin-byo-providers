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

export type TokenPlatform =
  | 'claude'
  | 'codex'
  | 'gemini'
  | 'opencodego'
  | 'kimi'
  | 'grok'
  | 'copilot';

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

/** Sanitized Grok (xAI SuperGrok) block — presence booleans only. */
export interface GrokTokenSanitized {
  authMethod: AuthMethod;
  status: TokenStatus;
  expiresAt?: string;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  lastRefreshedAt?: string;
  errorMessage?: string;
}

/**
 * Sanitized GitHub Copilot block — presence booleans + the display-only GHE
 * domain; the long-lived ghu_ token never crosses.
 */
export interface CopilotTokenSanitized {
  authMethod: AuthMethod;
  status: TokenStatus;
  expiresAt?: string;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  enterpriseUrl?: string;
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

/**
 * Display-only view of an in-flight Grok / Copilot device flow (no
 * deviceCode/token); copilot flows may carry the normalized GHE domain.
 */
export interface DeviceFlowView {
  sessionId: string;
  state: 'pending' | 'done' | 'error';
  verificationUri: string;
  verificationUriComplete?: string;
  userCode: string;
  error?: string;
  enterpriseUrl?: string;
}

export interface AccountTokensSanitized {
  claude?: ClaudeTokenSanitized;
  codex?: CodexTokenSanitized;
  gemini?: GeminiTokenSanitized;
  opencodego?: OpenCodeGoTokenSanitized;
  kimi?: KimiTokenSanitized;
  grok?: GrokTokenSanitized;
  copilot?: CopilotTokenSanitized;
  claudeAccounts?: SubscriptionAccountSanitized[];
  codexAccounts?: SubscriptionAccountSanitized[];
  geminiAccounts?: SubscriptionAccountSanitized[];
  opencodegoAccounts?: SubscriptionAccountSanitized[];
  kimiAccounts?: SubscriptionAccountSanitized[];
  grokAccounts?: SubscriptionAccountSanitized[];
  copilotAccounts?: SubscriptionAccountSanitized[];
  updatedAt: string;
}

export interface TokenExchangeResponse {
  success: boolean;
  expiresAt?: string;
  error?: string;
}
