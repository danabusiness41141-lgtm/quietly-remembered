import { describe, expect, it } from "vitest";
import { getPaperClass, getPaperStyle, isCustomPaperColor, paperTones } from "./paper";

describe("paper palette", () => {
  it("exposes the curated stationery tones", () => {
    expect(paperTones.map(tone => tone.key)).toEqual(["parchment", "sage", "blue", "rose", "lilac", "butter", "terracotta"]);
  });

  it("accepts only six-digit custom hex values", () => {
    expect(isCustomPaperColor("#c8b4a7")).toBe(true);
    expect(isCustomPaperColor("#ABCDEF")).toBe(true);
    expect(isCustomPaperColor("#fff")).toBe(false);
    expect(isCustomPaperColor("red")).toBe(false);
    expect(isCustomPaperColor("#c8b4a70")).toBe(false);
  });

  it("maps custom values to a safe class and CSS variable", () => {
    expect(getPaperClass("#c8b4a7")).toBe("note-custom");
    expect(getPaperStyle("#c8b4a7")).toMatchObject({ "--custom-paper-color": "#c8b4a7" });
    expect(getPaperClass("rose")).toBe("note-rose");
    expect(getPaperClass("lilac")).toBe("note-lilac");
    expect(getPaperStyle("rose")).toBeUndefined();
  });

  it("switches dark custom notes to light readable tokens", () => {
    expect(getPaperStyle("#68615f")).toMatchObject({ "--note-ink": "#fffaf4", "--note-muted": "rgba(255,250,244,.78)" });
    expect(getPaperStyle("#d8c7d8")).toMatchObject({ "--note-ink": "#352b2a" });
  });
});
