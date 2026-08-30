import { describe, expect, it } from "vitest";
import { AUDIO_MAX_BYTES, AUDIO_SOURCE_MAX_BYTES, normalizeAudioMimeType, validateAudioMetadata, validateAudioSourceBytes } from "./audio";

describe("ambient audio intake", () => {
  it("keeps the user source budget separate from the stored output budget", () => {
    expect(AUDIO_SOURCE_MAX_BYTES).toBe(10_000_000);
    expect(AUDIO_MAX_BYTES).toBe(2_000_000);
  });
  it("rejects source files over the 10 MB intake budget", () => {
    expect(validateAudioSourceBytes(10_000_001)).toContain("10 MB");
    expect(validateAudioSourceBytes(10_000_000)).toBeNull();
  });

  it("accepts compact supported audio metadata", () => {
    expect(validateAudioMetadata({ mimeType: "audio/webm", bytes: 120_000, durationMs: 8_500 })).toBeNull();
    expect(normalizeAudioMimeType({ type: "", name: "memory.m4a" })).toBe("audio/webm");
    expect(normalizeAudioMimeType({ type: "audio/wav", name: "memory.wav" })).toBe("audio/webm");
  });

  it("rejects oversized, long, and unsupported audio", () => {
    expect(validateAudioMetadata({ mimeType: "audio/webm", bytes: 2_000_001, durationMs: 5_000 })).toContain("2 MB");
    expect(validateAudioMetadata({ mimeType: "audio/mpeg", bytes: 100, durationMs: 30_001 })).toContain("30 seconds");
    expect(validateAudioMetadata({ mimeType: "video/mp4", bytes: 100, durationMs: 5_000 })).toContain("compress");
  });
});
