/**
 * AccountTokensTab/types.ts - Local type definitions for AccountTokens components
 */

import type {
  ClaudeAuthMethod,
  ClaudeTokenSanitized,
  CodexTokenSanitized,
  GeminiTokenSanitized,
  KimiDeviceFlowView,
  KimiTokenSanitized,
  OAuthParams,
  OpenCodeGoTokenSanitized,
  SubscriptionAccountSanitized,
  SubscriptionLevel,
  TokenPlatform,
  TokenStatus,
} from '@byo/domain/subscription';

export type TranslationFn = (key: string, params?: Record<string, string | number> | string) => string;

/** Status badge configuration */
export interface StatusConfig {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  label: string;
}

/** Props for StatusBadge component */
export interface StatusBadgeProps {
  status?: TokenStatus;
  t: TranslationFn;
}

/** Props for AuthMethodSelector component */
export interface AuthMethodSelectorProps {
  t: TranslationFn;
  platform: 'claude' | 'codex' | 'gemini';
  value: ClaudeAuthMethod | 'oauth' | 'manual';
  onChange: (method: ClaudeAuthMethod | 'oauth' | 'manual') => void;
  disabled?: boolean;
}

/** Props for SubscriptionLevelSelector component */
export interface SubscriptionLevelSelectorProps {
  t: TranslationFn;
  value: SubscriptionLevel;
  onChange: (level: SubscriptionLevel) => void;
  disabled?: boolean;
}

/** OAuth flow state */
export interface OAuthFlowState {
  isInProgress: boolean;
  params: OAuthParams | null;
  authCode: string;
  isExchanging: boolean;
  error: string | null;
}

/** Props for OAuthFlow component */
export interface OAuthFlowProps {
  t: TranslationFn;
  platform: TokenPlatform;
  oauthParams: OAuthParams;
  accountLabel?: string;
  authCode: string;
  isExchanging: boolean;
  error: string | null;
  onAccountLabelChange?: (label: string) => void;
  onAuthCodeChange: (code: string) => void;
  onExchange: () => void;
  onCancel: () => void;
}

/** Props for ManualInputModal component */
export interface ManualInputModalProps {
  t: TranslationFn;
  platform: TokenPlatform;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accessToken: string, extra?: { subscriptionLevel?: SubscriptionLevel; refreshToken?: string }) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  accountLabel?: string;
  onAccountLabelChange?: (label: string) => void;
}

/** Base config card props */
export interface BaseConfigCardProps {
  t: TranslationFn;
  isLoading?: boolean;
}

/** Props for ClaudeConfigCard */
export interface ClaudeConfigCardProps extends BaseConfigCardProps {
  config?: ClaudeTokenSanitized;
  onStartOAuth: () => Promise<OAuthParams>;
  // NOTE (byo-p2-subscription): the PKCE `verifier` is NOT a parameter — the
  // plugin never holds it (the host retains it keyed by `state`). The exchange
  // relays ONLY `{ code, state, label? }`; the host looks the verifier up.
  onExchangeOAuthToken: (code: string, state: string, label?: string) => Promise<void>;
  onStartSetupToken: () => Promise<OAuthParams>;
  onExchangeSetupToken: (code: string, state: string, label?: string) => Promise<void>;
  onSetManualToken: (
    accessToken: string,
    subscriptionLevel?: SubscriptionLevel,
    label?: string,
  ) => Promise<void>;
  onUpdateSubscriptionLevel: (level: SubscriptionLevel) => Promise<void>;
  onClear: () => Promise<void>;
  onRefresh: () => Promise<boolean>;
  // Multi-account (subscription-multi-account)
  accounts?: SubscriptionAccountSanitized[];
  onSetActiveAccount?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateAccountLabel?: (id: string, label: string) => Promise<AccountMutationResult>;
  onRemoveAccount?: (id: string) => Promise<{ success: boolean; error?: string }>;
}

/** Result of an internal account mutation. */
export interface AccountMutationResult {
  success: boolean;
  error?: string;
}

/** Props for CodexConfigCard (multi-account: code-cli-account-switching) */
export interface CodexConfigCardProps extends BaseConfigCardProps {
  config?: CodexTokenSanitized;
  onStartOAuth: () => Promise<OAuthParams>;
  /**
   * Exchange an OAuth code, appending a new account with an optional label. The
   * `state` (from `onStartOAuth`) MUST be threaded back — the host looks the
   * retained PKCE verifier up by it. The verifier itself is NOT a parameter (the
   * plugin never holds it).
   */
  onExchangeToken: (code: string, state: string, label?: string) => Promise<void>;
  /** Set a manual token, appending a new account with an optional label. */
  onSetManualToken: (accessToken: string, label?: string) => Promise<void>;
  onClear: () => Promise<void>;
  onRefresh: () => Promise<boolean>;
  // Multi-account (code-cli-account-switching)
  accounts?: SubscriptionAccountSanitized[];
  onSetActiveAccount?: (id: string) => Promise<AccountMutationResult>;
  onUpdateAccountLabel?: (id: string, label: string) => Promise<AccountMutationResult>;
  onRemoveAccount?: (id: string) => Promise<AccountMutationResult>;
}

/** Props for OpenCodeGoConfigCard (NEW; API-key form + multi-account) */
export interface OpenCodeGoConfigCardProps extends BaseConfigCardProps {
  /** Top-level sanitized block of the ACTIVE account (host display only). */
  config?: OpenCodeGoTokenSanitized;
  accounts?: SubscriptionAccountSanitized[];
  /** Append a new account (API-key form). */
  onAddAccount: (input: {
    apiKey: string;
    label?: string;
    baseUrl?: string;
    zenBaseUrl?: string;
  }) => Promise<AccountMutationResult>;
  onSetActiveAccount: (id: string) => Promise<AccountMutationResult>;
  onUpdateAccountLabel?: (id: string, label: string) => Promise<AccountMutationResult>;
  onRemoveAccount: (id: string) => Promise<AccountMutationResult>;
}

/** Props for GeminiConfigCard */
export interface GeminiConfigCardProps extends BaseConfigCardProps {
  config?: GeminiTokenSanitized;
  onStartOAuth: () => Promise<OAuthParams>;
  // `state` (from `onStartOAuth`) MUST be threaded back — the host looks the
  // retained PKCE verifier up by it; the verifier is NOT a parameter.
  onExchangeToken: (code: string, state: string) => Promise<void>;
  onSetManualToken: (accessToken: string, refreshToken?: string) => Promise<void>;
  onClear: () => Promise<void>;
  onRefresh: () => Promise<boolean>;
}

/** Props for KimiConfigCard (RFC 8628 device flow; host holds the deviceCode) */
export interface KimiConfigCardProps extends BaseConfigCardProps {
  config?: KimiTokenSanitized;
  accounts?: SubscriptionAccountSanitized[];
  /** Start a device flow; the view carries ONLY display fields. */
  onStartLogin: () => Promise<KimiDeviceFlowView>;
  onPollFlow: (sessionId: string) => Promise<KimiDeviceFlowView>;
  onCancelFlow: (sessionId: string) => Promise<void>;
  onSetActiveAccount?: (id: string) => Promise<AccountMutationResult>;
  onUpdateAccountLabel?: (id: string, label: string) => Promise<AccountMutationResult>;
  onRemoveAccount?: (id: string) => Promise<AccountMutationResult>;
  onClear: () => Promise<void>;
  onRefresh: () => Promise<boolean>;
}

/** Props for main AccountTokensTab component */
export interface AccountTokensTabProps {
  t: TranslationFn;
}

/** Re-export types needed by components */
export type {
  ClaudeAuthMethod,
  ClaudeTokenSanitized,
  CodexTokenSanitized,
  GeminiTokenSanitized,
  KimiDeviceFlowView,
  KimiTokenSanitized,
  OAuthParams,
  OpenCodeGoTokenSanitized,
  SubscriptionAccountSanitized,
  SubscriptionLevel,
  TokenPlatform,
  TokenStatus,
};
