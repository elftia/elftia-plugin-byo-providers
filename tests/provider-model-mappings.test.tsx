import React, { useLayoutEffect } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { HostProviderModelMappings } from "../src/domain/plugin-types";

const { getMappings } = vi.hoisted(() => ({ getMappings: vi.fn() }));
vi.mock("../src/renderer/llmConfigClient", () => ({
  llmConfigClient: { getProviderModelMappings: getMappings },
}));
vi.mock("../src/renderer/host/ui", () => ({
  Badge: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock("../src/renderer/host/vendored/useTranslation", () => ({
  useTranslation: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

import { ProviderModelMappingsSection } from "../src/renderer/llm/ProviderModelMappingsSection";

function deferred() {
  let resolve!: (value: HostProviderModelMappings) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<HostProviderModelMappings>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function snapshot(
  providerId: string,
  source = `${providerId}-client`,
  force = false,
): HostProviderModelMappings {
  return {
    providerId,
    supported: true,
    force,
    mappings: [{ source, target: `${providerId}-target`, effort: "high" }],
  };
}

describe("provider model mapping preview", () => {
  let renderer: ReactTestRenderer | undefined;
  const view = () => JSON.stringify(renderer?.toJSON());
  const content = () =>
    renderer!.root.findByProps({
      "data-testid": "provider-model-mappings-content",
    });
  const mount = async (providerId = "alpha") => {
    await act(async () => {
      renderer = create(
        <ProviderModelMappingsSection providerId={providerId} />,
      );
    });
  };
  const expand = async () => {
    await act(async () => {
      renderer!.root
        .findByProps({ "data-testid": "provider-model-mappings-toggle" })
        .props.onClick();
    });
  };

  afterEach(() => {
    if (renderer) act(() => renderer!.unmount());
    renderer = undefined;
    getMappings.mockReset();
  });

  it("renders the empty table and same-name mode without inventing mappings", async () => {
    getMappings.mockResolvedValue({
      providerId: "alpha",
      supported: true,
      force: false,
      mappings: [],
    });
    await mount();
    await expand();
    expect(
      renderer!.root.findAllByProps({
        "data-testid": "provider-model-mappings-empty",
      }),
    ).toHaveLength(1);
    expect(
      renderer!.root.findAllByProps({
        "data-testid": "provider-model-mapping-row",
      }),
    ).toHaveLength(0);
  });

  it("hides loaded previous-provider rows in the first commit of a new selection", async () => {
    const beta = deferred();
    const commits: string[] = [];
    function Fixture({ providerId }: { providerId: string }) {
      useLayoutEffect(() => {
        if (renderer) commits.push(JSON.stringify(renderer.toJSON()));
      });
      return <ProviderModelMappingsSection providerId={providerId} />;
    }
    getMappings
      .mockResolvedValueOnce(snapshot("alpha"))
      .mockReturnValueOnce(beta.promise);
    await act(async () => {
      renderer = create(<Fixture providerId="alpha" />);
    });
    await expand();
    expect(view()).toContain("alpha-client");
    await act(async () => {
      renderer!.update(<Fixture providerId="beta" />);
    });
    expect(commits.at(-1)).not.toContain("alpha-client");
    expect(content().props["data-state"]).toBe("loading");
    await act(async () => {
      beta.resolve(snapshot("beta"));
    });
    expect(view()).toContain("beta-client");
    expect(view()).not.toContain("alpha-client");
  });

  it.each(["resolve", "reject"] as const)(
    "ignores an earlier provider’s late %s after the current response",
    async (outcome) => {
      const alpha = deferred();
      const beta = deferred();
      getMappings
        .mockReturnValueOnce(alpha.promise)
        .mockReturnValueOnce(beta.promise);
      await mount();
      await expand();
      expect(content().props["data-state"]).toBe("loading");
      await act(async () => {
        renderer!.update(<ProviderModelMappingsSection providerId="beta" />);
      });
      await act(async () => {
        beta.resolve(snapshot("beta"));
      });
      await act(async () => {
        if (outcome === "resolve") alpha.resolve(snapshot("alpha"));
        else alpha.reject(new Error("old provider failed"));
      });
      expect(content().props["data-state"]).toBe("ready");
      expect(view()).toContain("beta-client");
      expect(view()).not.toContain("alpha-client");
    },
  );

  it("shows a load error, never a fake empty table, and refreshes after reopening", async () => {
    getMappings
      .mockRejectedValueOnce(new Error("PRIVATE backend details"))
      .mockResolvedValueOnce(snapshot("alpha"));
    await mount();
    await expand();
    expect(content().props["data-state"]).toBe("error");
    expect(
      renderer!.root.findAllByProps({
        "data-testid": "provider-model-mappings-empty",
      }),
    ).toHaveLength(0);
    expect(view()).not.toContain("PRIVATE");
    await expand();
    await expand();
    expect(content().props["data-state"]).toBe("ready");
    expect(view()).toContain("alpha-client");
  });

  it("renders an unsupported host honestly and rejects a mismatched provider response", async () => {
    getMappings
      .mockResolvedValueOnce({
        providerId: "alpha",
        supported: false,
        reason: "unsupported",
      })
      .mockResolvedValueOnce(snapshot("other"));
    await mount();
    await expand();
    expect(content().props["data-state"]).toBe("unavailable");
    expect(
      renderer!.root.findAllByProps({
        "data-testid": "provider-model-mappings-empty",
      }),
    ).toHaveLength(0);
    await expand();
    await expand();
    expect(content().props["data-state"]).toBe("error");
    expect(view()).not.toContain("other-client");
  });
});
