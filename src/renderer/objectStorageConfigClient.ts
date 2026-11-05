import type {
  HostObjectStorageMutationResult,
  HostObjectStorageProvider,
  HostObjectStorageProviderPatch,
} from "@elftia/plugin-types";

import { getHost } from "./host/hostBridge";

function invoke<T>(method: string, payload?: unknown): Promise<T> {
  return getHost().ipc.invoke<T>(method, payload);
}

export const objectStorageConfigClient = {
  listProviders(): Promise<readonly HostObjectStorageProvider[]> {
    return invoke("storage.listProviders");
  },
  addProvider(
    templateId: string,
    name?: string,
  ): Promise<HostObjectStorageMutationResult> {
    return invoke("storage.addProvider", { templateId, name });
  },
  deleteProvider(id: string): Promise<HostObjectStorageMutationResult> {
    return invoke("storage.deleteProvider", { id });
  },
  updateProvider(
    id: string,
    patch: HostObjectStorageProviderPatch,
  ): Promise<HostObjectStorageMutationResult> {
    return invoke("storage.updateProvider", { id, patch });
  },
  setCredentials(
    id: string,
    credentials: {
      accessKeyId?: string;
      secretAccessKey?: string;
      sessionToken?: string;
    },
  ): Promise<HostObjectStorageMutationResult> {
    return invoke("storage.setCredentials", { id, credentials });
  },
  clearCredentials(id: string): Promise<HostObjectStorageMutationResult> {
    return invoke("storage.clearCredentials", { id });
  },
  setDefaultProvider(
    id: string | null,
  ): Promise<HostObjectStorageMutationResult> {
    return invoke("storage.setDefaultProvider", { id });
  },
};
