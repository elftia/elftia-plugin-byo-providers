import type {
  AgentBackendHostApi as SdkAgentBackendHostApi,
  AgentBackendHostServices as SdkAgentBackendHostServices,
  HostLlmConfigLike as SdkHostLlmConfigLike,
  HostSubscriptionAuthLike as SdkHostSubscriptionAuthLike,
} from '@elftia/plugin-types';

export type {
  AgentUiHostApi,
  HostAccountTokensSanitized,
  HostCliImportResult,
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
}

export type AgentBackendHostServices = SdkAgentBackendHostServices & {
  readonly llmConfig?: HostLlmConfigLike;
  readonly subscriptionAuth?: HostSubscriptionAuthLike;
  readonly agentConfig?: HostAgentConfigLike;
  readonly cliRuntime?: HostCliRuntimeLike;
  readonly secretsPack?: HostSecretsPackLike;
  readonly objectStorageConfig?: HostObjectStorageConfigLike;
};

export type AgentBackendHostApi = Omit<SdkAgentBackendHostApi, 'services'> & {
  readonly services: AgentBackendHostServices;
};
