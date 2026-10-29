import { describe, expect, it } from "vitest";

import {
  MUSIC_PROVIDER_LIBRARY,
  MUSIC_PROVIDER_TEMPLATES,
} from "../src/renderer/media/constants";
import { MUSIC_PROVIDER_LIBRARY as composerLibrary } from "../src/renderer/media/music-constants";

describe("music provider templates", () => {
  it.each([
    ["elevenlabs", ["music_v2_5", "music_v2"]],
    ["lyria", ["lyria-3.5", "lyria-3-pro-preview", "lyria-3-clip-preview"]],
    ["mureka", ["mureka-9.5", "mureka-9", "mureka-o2"]],
    ["suno", ["suno-v6", "suno-v5.5", "suno-v5"]],
  ])("offers %s and its models in both settings entry points", (id, models) => {
    expect(composerLibrary).toBe(MUSIC_PROVIDER_LIBRARY);
    for (const catalog of [MUSIC_PROVIDER_LIBRARY, MUSIC_PROVIDER_TEMPLATES]) {
      const provider = catalog.find((entry) => entry.id === id);
      expect(provider?.models.map((model) => model.id)).toEqual(models);
      expect(provider?.defaultModelId).toBe(models[0]);
    }
  });
  it("offers the new Suno models for compatible relays", () => {
    expect(
      MUSIC_PROVIDER_TEMPLATES.find(
        (provider) => provider.id === "suno-compatible",
      )?.defaultModelId,
    ).toBe("suno-v6");
  });
});
