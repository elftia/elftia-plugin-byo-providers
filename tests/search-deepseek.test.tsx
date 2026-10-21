import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/renderer/host/hostBridge", () => ({
  getHost: () => ({ react: { instance: React } }),
}));
vi.mock("../src/renderer/searchConfigClient", () => ({
  searchConfigClient: {
    getProviderConfig: vi.fn(async (id: string) => ({
      id,
      enabled: true,
      configured: false,
    })),
    isProviderEnabled: vi.fn(async () => false),
  },
}));

import { searchConfigClient } from "../src/renderer/searchConfigClient";
import {
  useSearchProviders,
  type SearchProvidersBag,
} from "../src/renderer/useSearchProviders";

describe("DeepSeek search settings", () => {
  it("uses the live configured boolean instead of mistaking a non-null disabled/keyless config for a credential", async () => {
    let bag!: SearchProvidersBag;
    function Probe() {
      bag = useSearchProviders();
      return null;
    }
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<Probe />);
    });
    expect(bag.isConfigured("deepseek")).toBe(false);
    vi.mocked(searchConfigClient.getProviderConfig).mockResolvedValue({
      id: "deepseek",
      enabled: true,
      configured: true,
    });
    await act(async () => bag.refresh());
    expect(bag.isConfigured("deepseek")).toBe(true);
    act(() => renderer.unmount());
  });
});
