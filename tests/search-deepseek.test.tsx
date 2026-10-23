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

  it("does not infer readiness from a non-null legacy config or a SearXNG host", async () => {
    vi.mocked(searchConfigClient.getProviderConfig).mockImplementation(async (id: string) => ({
      id, enabled: false, apiHost: "https://search.example.com",
    }));
    let bag!: SearchProvidersBag;
    function Probe() {
      bag = useSearchProviders();
      return null;
    }
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<Probe />); });
    expect(bag.isConfigured("exa")).toBe(false);
    expect(bag.isConfigured("searxng")).toBe(false);
    act(() => renderer.unmount());
  });

  it("reports a failed masked refresh without replacing known settings with unconfigured defaults", async () => {
    vi.mocked(searchConfigClient.getProviderConfig).mockImplementation(async (id: string) => ({
      id, enabled: true, authMode: "api", configured: true,
    }));
    let bag!: SearchProvidersBag;
    function Probe() {
      bag = useSearchProviders();
      return null;
    }
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<Probe />); });
    expect(bag.entries.exa.config).toMatchObject({ enabled: true, authMode: "api" });
    vi.mocked(searchConfigClient.getProviderConfig).mockRejectedValue(new Error("Host read unavailable"));
    await act(async () => bag.refresh());
    expect(bag.error).toBe("Host read unavailable");
    expect(bag.entries.exa.config).toMatchObject({ enabled: true, authMode: "api" });
    expect(bag.isConfigured("exa")).toBe(true);
    act(() => renderer.unmount());
  });
});
