import type {
  AgentBackendHostApi as SdkAgentBackendHostApi,
  AgentBackendHostServices as SdkAgentBackendHostServices,
  HostLlmConfigLike as SdkHostLlmConfigLike,
  HostMediaConfigLike as SdkHostMediaConfigLike,
  HostMediaType,
  HostSubscriptionAuthLike as SdkHostSubscriptionAuthLike,
} from '@elftia/plugin-types';

export type {
  AgentUiHostApi,
  HostAccountTokensSanitized,
  HostMaskedMediaProvider,
  HostMaskedSearchProviderConfig,
  HostMediaType,
  HostOAuthExchangeRequest,
  HostOAuthInitParams,
  HostSearchKeyWriteResult,
  HostSearchProviderConfigInput,
  HostSearchProvidersList,
  HostSearchValidateResult,
  HostSubscriptionAccountSanitized,
  HostSubscriptionEntry,
  HostSubscriptionOpResult,
  HostSubscriptionRefreshResult,
} from '@elftia/plugin-types';

export type HostCliBackendId = 'claude-code' | 'codex-cli' | 'gemini-cli';

export type HostMediaProviderSecretField = 'byteplusAk' | 'byteplusSk';

/**
 * The explicit key-reveal result (host-API v1.50) — the ONE deliberate outward
 * secret exception: carries the stored key for USER-INITIATED display (the
 * settings eye icon). Local mirror of the SDK's `HostMediaKeyRevealResult` /
 * `HostLlmKeyRevealResult` (this plugin pins an older SDK; the shapes are
 * structural lower bounds, same as the other local extensions).
 */
export interface HostKeyRevealResult {
  readonly success: boolean;
  /** The stored secret (plaintext); `''` when none is stored. */
  readonly value?: string;
  readonly error?: string;
}

export interface HostMediaConfigLike extends SdkHostMediaConfigLike {
  setProviderSecret?(
    mediaType: 'video',
    id: string,
    field: HostMediaProviderSecretField,
    value: string,
  ): Promise<{ success: boolean; error?: string }>;
  /** v1.50 — reveal the stored provider key (user-initiated display only). */
  revealProviderKey?(
    mediaType: HostMediaType,
    id: string,
  ): Promise<HostKeyRevealResult>;
  /** v1.50 — reveal a stored video secret field (user-initiated display only). */
  revealProviderSecret?(
    mediaType: 'video',
    id: string,
    field: HostMediaProviderSecretField,
  ): Promise<HostKeyRevealResult>;
}

export interface HostLlmConfigLike extends SdkHostLlmConfigLike {
  /** v1.50 — reveal the stored provider key (user-initiated display only). */
  revealProviderKey?(providerId: string): Promise<HostKeyRevealResult>;
  /** v1.64 — provider pool-key plan quota (optional; feature-detected). */
  getProviderKeyQuota?(
    providerId: string,
    keyId: string,
    force?: boolean,
  ): Promise<HostProviderKeyQuota>;
}

export interface HostCliBackendConfig {
  readonly cliBackendId?: HostCliBackendId;
  readonly cliTimeout?: number;
  readonly cliPtyMode?: boolean;
  readonly cliPtyCols?: number;
  readonly cliPtyRows?: number;
  readonly agentBackend?: never;
}

export interface HostAgentConfigLike {
  getCliBackendConfig(): Promise<HostCliBackendConfig>;
  setCliBackendConfig(
    patch: HostCliBackendConfig,
  ): Promise<{ success: boolean; error?: string }>;
}

export interface HostCliAuthStatus {
  readonly backendId: string;
  readonly displayName: string;
  readonly installed: boolean;
  readonly authenticated: boolean;
  readonly enabled: boolean;
  readonly email?: string;
  readonly authMethod?: string;
  readonly installable?: boolean;
  readonly protocol?: 'standard' | 'acp';
  readonly error?: string;
  readonly [key: string]: unknown;
}

export interface HostCliAuthStatusOptions {
  readonly force?: boolean;
}

export type HostCliBackendInfo = { readonly [key: string]: unknown };

export interface HostCliRuntimeResult {
  readonly ok: boolean;
  readonly error?: string;
}

export interface HostCliLaunchTerminalInput {
  readonly backendId: string;
  readonly cwd?: string;
  readonly injectProviderEnv?: boolean;
}

export interface HostCliRuntimeLike {
  getAuthStatus(options?: HostCliAuthStatusOptions): Promise<HostCliAuthStatus[]>;
  setEnabled(backendId: string, enabled: boolean): Promise<HostCliRuntimeResult>;
  install(backendId: string): Promise<HostCliRuntimeResult>;
  launchTerminal(input: HostCliLaunchTerminalInput): Promise<HostCliRuntimeResult>;
  listBackends(): Promise<HostCliBackendInfo[]>;
}

export interface HostSecretsPackArgs {
  readonly passphrase: string;
}

export interface HostSecretsPackImportCounts {
  readonly providerKeys: number;
  readonly poolKeys: number;
  readonly tokenSets: number;
  readonly mediaKeys: number;
  readonly searchKeys: number;
  readonly duplicatePoolKeys: number;
  readonly skipped: readonly string[];
}

export interface HostSecretsPackExportResult {
  readonly success: boolean;
  readonly path?: string;
  readonly canceled?: boolean;
  readonly message?: string;
}

export interface HostSecretsPackImportResult {
  readonly success: boolean;
  readonly imported?: HostSecretsPackImportCounts;
  readonly canceled?: boolean;
  readonly message?: string;
}

export interface HostSecretsPackLike {
  export(args: HostSecretsPackArgs): Promise<HostSecretsPackExportResult>;
  import(args: HostSecretsPackArgs): Promise<HostSecretsPackImportResult>;
}

export interface HostObjectStorageProviderConfig {
  readonly bucket: string;
  readonly region?: string;
  readonly endpoint?: string;
  readonly prefix?: string;
  readonly publicBaseUrl?: string;
  readonly urlMode: 'signed' | 'public';
  readonly expiresInSeconds?: number;
  readonly forcePathStyle?: boolean;
}

export interface HostObjectStorageProvider {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly kind: 's3' | 'oss';
  readonly isDefault: boolean;
  readonly configured: boolean;
  readonly ready: boolean;
  readonly config: HostObjectStorageProviderConfig;
  readonly accessKeyId?: never;
  readonly secretAccessKey?: never;
  readonly sessionToken?: never;
}

export interface HostObjectStorageMutationResult {
  readonly success: boolean;
  readonly provider?: HostObjectStorageProvider;
  readonly error?: string;
}

export interface HostObjectStorageConfigLike {
  listProviders(): Promise<readonly HostObjectStorageProvider[]>;
  updateProvider(
    id: string,
    patch: Partial<HostObjectStorageProviderConfig>,
  ): Promise<HostObjectStorageMutationResult>;
  setCredentials(
    id: string,
    credentials: { accessKeyId?: string; secretAccessKey?: string; sessionToken?: string },
  ): Promise<HostObjectStorageMutationResult>;
  clearCredentials(id: string): Promise<HostObjectStorageMutationResult>;
  setDefaultProvider(id: string | null): Promise<HostObjectStorageMutationResult>;
}

/**
 * Secret-free account allowance snapshot (host-API v1.64). Local structural
 * mirror — the plugin pins an older SDK (Kimi-flow precedent). Unknown /
 * unsupported quota is explicit, never a measured 0%.
 */
export interface HostAllowanceWindow {
  readonly id: string;
  readonly label: string;
  readonly scope: string;
  readonly modelFamily?: string;
  readonly usedPercent: number | null;
  readonly windowMinutes?: number;
  readonly resetsAt?: string;
  readonly remainingSeconds?: number;
  readonly state: string;
}

export interface HostAccountAllowanceSnapshot {
  readonly providerId: string;
  readonly accountId: string;
  readonly source: string;
  readonly observedAt: string;
  readonly expiresAt?: string;
  readonly windows: HostAllowanceWindow[];
  readonly lastErrorCode?: string;
  readonly primaryOverSecondaryLimitPercent?: number;
}

/** Secret-free plan quota for one provider pool key (host-API v1.64). */
export interface HostProviderKeyQuota {
  readonly providerId: string;
  readonly keyId: string;
  readonly supported: boolean;
  readonly observedAt: string;
  readonly expiresAt?: string;
  readonly windows: HostAllowanceWindow[];
  readonly lastErrorCode?: string;
}

export interface HostModelTestResult {
  readonly success: boolean;
  readonly message: string;
  readonly response?: string;
  readonly model: string;
  readonly durationMs?: number;
}

export interface HostLlmConfigLike extends SdkHostLlmConfigLike {
  testModel(providerId: string, modelId: string): Promise<HostModelTestResult>;
}

/**
 * Display-only view of one in-flight Kimi device flow (host-API v1.63). The
 * `deviceCode` and all tokens stay HOST-side; only display fields cross.
 * Local structural mirror — this plugin pins an older SDK (same pattern as
 * the v1.50 reveal results above).
 */
export interface HostKimiDeviceFlowView {
  readonly sessionId: string;
  readonly state: 'pending' | 'done' | 'error';
  readonly verificationUri: string;
  readonly verificationUriComplete?: string;
  readonly userCode: string;
  readonly error?: string;
}

/**
 * Display-only view of one in-flight Grok / Copilot device flow (host-API
 * v1.65) — the same token-free shape as the Kimi view; copilot flows may
 * carry the normalized `enterpriseUrl` back for display.
 */
export interface HostDeviceFlowView {
  readonly sessionId: string;
  readonly state: 'pending' | 'done' | 'error';
  readonly verificationUri: string;
  readonly verificationUriComplete?: string;
  readonly userCode: string;
  readonly error?: string;
  /** Copilot only: the normalized GHE domain riding this flow (absent = personal). */
  readonly enterpriseUrl?: string;
}

/** Secret-free model metadata (v1.70), with persisted enable state (v1.71). */
export interface HostSubscriptionModelInfo {
  readonly id: string;
  readonly kind: 'chat' | 'image';
  /** Absent on pre-v1.71 hosts means enabled. */
  readonly enabled?: boolean;
}

/** Defaults and extras retain disabled entries so settings can re-enable them. */
export interface HostSubscriptionProviderModels {
  readonly configured?: boolean;
  readonly defaults: HostSubscriptionModelInfo[];
  readonly extras: HostSubscriptionModelInfo[];
  readonly effective: HostSubscriptionModelInfo[];
}

/** The whole subscription-model view (host-API v1.70), keyed by providerId. */
export type HostSubscriptionModelsView = Record<string, HostSubscriptionProviderModels>;

export interface HostSubscriptionAuthLike extends SdkHostSubscriptionAuthLike {
  setClaudeManualToken(
    accessToken: string,
    subscriptionLevel?: string,
    label?: string,
  ): Promise<{ success: boolean; error?: string }>;
  setCodexManualToken(
    accessToken: string,
    label?: string,
  ): Promise<{ success: boolean; error?: string }>;
  setGeminiManualToken(
    accessToken: string,
    refreshToken?: string,
  ): Promise<{ success: boolean; error?: string }>;
  updateClaudeSubscriptionLevel(
    level: string,
  ): Promise<{ success: boolean; error?: string }>;
  /** v1.64 — account allowance snapshot (optional; feature-detected). */
  getAccountAllowance?(
    providerId: string,
    accountId: string,
    force?: boolean,
  ): Promise<HostAccountAllowanceSnapshot>;
  /** v1.63 — Kimi RFC 8628 device flow (optional; feature-detected). */
  startKimiDeviceFlow?(): Promise<HostKimiDeviceFlowView>;
  pollKimiDeviceFlow?(sessionId: string): Promise<HostKimiDeviceFlowView>;
  cancelKimiDeviceFlow?(sessionId: string): Promise<void>;
  refreshKimiToken?(): Promise<boolean>;
  /** v1.65 — Grok RFC 8628 device flow (optional; feature-detected). */
  startGrokDeviceFlow?(): Promise<HostDeviceFlowView>;
  pollGrokDeviceFlow?(sessionId: string): Promise<HostDeviceFlowView>;
  cancelGrokDeviceFlow?(sessionId: string): Promise<void>;
  refreshGrokToken?(): Promise<boolean>;
  /**
   * v1.65 — GitHub Copilot RFC 8628 device flow (optional; feature-detected).
   * `enterpriseUrl` (bare host or full URL) routes the chain onto a GitHub
   * Enterprise host; normalized + validated HOST-side.
   */
  startCopilotDeviceFlow?(enterpriseUrl?: string): Promise<HostDeviceFlowView>;
  pollCopilotDeviceFlow?(sessionId: string): Promise<HostDeviceFlowView>;
  cancelCopilotDeviceFlow?(sessionId: string): Promise<void>;
  /** v1.65 — local no-op restamp (ghu_ tokens have no exchange endpoint). */
  refreshCopilotToken?(): Promise<boolean>;
  /**
   * v1.67 — codex loopback sign-in (auto-complete via 127.0.0.1:1455; no code
   * paste). Local structural mirror — this plugin pins an older SDK.
   */
  startCodexLoopbackLogin?(): Promise<
    | { ok: true; authUrl: string; sessionId: string }
    | { ok: false; error: string }
  >;
  pollCodexLoopbackLogin?(sessionId: string): Promise<{
    sessionId: string;
    state: 'pending' | 'done' | 'error';
    error?: string;
  }>;
  cancelCodexLoopbackLogin?(sessionId: string): Promise<void>;
  /**
   * v1.70 — subscription model lists (defaults + user extras; optional;
   * feature-detected). `setSubscriptionExtraModels` REPLACES the provider's
   * whole extras list and returns the refreshed view. Older hosts lack BOTH
   * verbs — the UI hides the model sections entirely (allowance precedent).
   */
  getSubscriptionModels?(): Promise<HostSubscriptionModelsView>;
  setSubscriptionExtraModels?(
    providerId: string,
    models: HostSubscriptionModelInfo[],
  ): Promise<HostSubscriptionModelsView>;
  /** v1.71 — applies to built-in and user-added models; feature-detected. */
  setSubscriptionModelEnabled?(
    providerId: string,
    modelId: string,
    enabled: boolean,
  ): Promise<HostSubscriptionModelsView>;
}

export type AgentBackendHostServices = SdkAgentBackendHostServices & {
  readonly llmConfig?: HostLlmConfigLike;
  readonly mediaConfig?: HostMediaConfigLike;
  readonly subscriptionAuth?: HostSubscriptionAuthLike;
  readonly agentConfig?: HostAgentConfigLike;
  readonly cliRuntime?: HostCliRuntimeLike;
  readonly secretsPack?: HostSecretsPackLike;
  readonly objectStorageConfig?: HostObjectStorageConfigLike;
  /** v1.66 — system-browser URL opener (optional; feature-detected). */
  readonly externalLinks?: HostExternalLinksLike;
};

/**
 * Host system-browser URL opener (host-API v1.66). The plugin renderer frame
 * is sandboxed (`allow-scripts`, opaque origin): `window.open` inside it is a
 * silent no-op, so OAuth/device-flow verification pages MUST ride this port.
 * Local structural mirror — this plugin pins an older SDK (Kimi-flow
 * precedent).
 */
export interface HostExternalLinksLike {
  /**
   * Open an http(s) URL in the user's system browser. Resolves
   * `{ ok: false, error: 'url-not-allowed' }` for non-http(s) URLs. Absent on
   * older hosts — UI falls back to rendering the URL as selectable text.
   */
  openExternal(url: string): Promise<{ ok: boolean; error?: string }>;
}

export type AgentBackendHostApi = Omit<SdkAgentBackendHostApi, 'services'> & {
  readonly services: AgentBackendHostServices;
};
