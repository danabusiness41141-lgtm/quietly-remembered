import { describe, expect, it } from "vitest";
import { getArchiveState, getCardKeyAction, getExpansionPresentation, getReactionPresentation, updateReactionCount } from "./Home";

describe("Home archive state", () => {
  it("shows loading only before the first notes arrive", () => {
    expect(getArchiveState({ isLoading: true, isError: false, hasNotes: false })).toBe("loading");
    expect(getArchiveState({ isLoading: true, isError: false, hasNotes: true })).toBe("notes");
  });

  it("shows a recoverable error when the initial feed request fails", () => {
    expect(getArchiveState({ isLoading: false, isError: true, hasNotes: false })).toBe("error");
  });

  it("shows the empty state only when the request succeeds without notes", () => {
    expect(getArchiveState({ isLoading: false, isError: false, hasNotes: false })).toBe("empty");
  });

  it("supports keyboard expansion and close actions without autoplay semantics", () => {
    expect(getCardKeyAction("Enter", false)).toBe("toggle");
    expect(getCardKeyAction(" ", false)).toBe("toggle");
    expect(getCardKeyAction("Escape", true)).toBe("close");
    expect(getCardKeyAction("Escape", false)).toBeNull();
    expect(getCardKeyAction("ArrowDown", false)).toBeNull();
  });

  it("keeps the card open/close label localized", () => {
    expect(getExpansionPresentation(false, "Open note", "Close note")).toEqual({ expanded: false, label: "Open note" });
    expect(getExpansionPresentation(true, "فتح الرسالة", "إغلاق الرسالة")).toEqual({ expanded: true, label: "إغلاق الرسالة" });
  });

  it("keeps a remembered reaction reversible", () => {
    expect(getReactionPresentation(false, "Remember", "Remembered", "Remove remembered")).toEqual({
      disabled: false,
      pressed: false,
      label: "Remember",
      title: "Remember",
    });
    expect(getReactionPresentation(true, "Remember", "بەبیرهێنرایەوە", "بەبیرهێنراوەکە بسڕەوە")).toEqual({
      disabled: false,
      pressed: true,
      label: "بەبیرهێنرایەوە",
      title: "بەبیرهێنراوەکە بسڕەوە",
    });
  });

  it("updates the visible count when a reaction is removed", () => {
    const notes = [{ id: 7, reactionCount: 3 }, { id: 8, reactionCount: 1 }];
    expect(updateReactionCount(notes, 7, 2)).toEqual([{ id: 7, reactionCount: 2 }, { id: 8, reactionCount: 1 }]);
    expect(updateReactionCount(notes, 7, 0)).toEqual([{ id: 7, reactionCount: 0 }, { id: 8, reactionCount: 1 }]);
  });

  it("preserves localized reversible feedback across the supported languages", () => {
    const activeLabels = ["Remembered", "تم التذكر", "بەبیرهێنرایەوە"];
    for (const label of activeLabels) {
      expect(getReactionPresentation(true, "Remember", label, "Remove remembered")).toMatchObject({ disabled: false, pressed: true, label, title: "Remove remembered" });
    }
  });
});
