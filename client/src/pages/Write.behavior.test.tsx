import { describe, expect, it, vi } from "vitest";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: any) => createElement("a", { href, ...props }, children),
}));
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WriteConfirmation, buildManageUrl, copyTextToClipboard, getCopyLinkLabel } from "./Write";

const copy = {
  postedNow: "Your note is here now.",
  confirmationDesc: "Held safely.",
  manage: "Keep this private link",
  manageHint: "Save it somewhere safe.",
  copyLink: "Copy private link",
  copyLinkDone: "Copied",
  copyLinkError: "Copying is unavailable here.",
};

const t = {
  confirmationKicker: "A note for",
  confirmationTitle: "It is here",
  confirmationDesc: "Your note is held safely.",
  collection: "A quiet collection",
  another: "Write another note",
};

describe("Write confirmation", () => {
  it("builds a private manage URL only when a token exists", () => {
    expect(buildManageUrl("https://quietly.example", "token-123")).toBe("https://quietly.example/manage/token-123");
    expect(buildManageUrl("https://quietly.example", "")).toBe("");
  });

  it("renders the confirmation status, private link, and idle copy control", () => {
    const markup = renderToStaticMarkup(createElement(WriteConfirmation, { t, copy, person: "Mina", manageUrl: "https://quietly.example/manage/token-123", scheduledAt: "", copied: false, onCopy: () => undefined }));
    expect(markup).toContain('role="status"');
    expect(markup).toContain("https://quietly.example/manage/token-123");
    expect(markup).toContain("Copy private link");
  });

  it("renders localized copied feedback after the copy action state changes", () => {
    const markup = renderToStaticMarkup(createElement(WriteConfirmation, { t, copy, person: "Mina", manageUrl: "https://quietly.example/manage/token-123", scheduledAt: "", copied: true, onCopy: () => undefined }));
    expect(getCopyLinkLabel(true, "Copied", "Copy private link")).toBe("Copied");
    expect(markup).toContain("Copied");
  });

  it("renders clipboard failure feedback instead of staying silent", () => {
    const markup = renderToStaticMarkup(createElement(WriteConfirmation, { t, copy, person: "Mina", manageUrl: "https://quietly.example/manage/token-123", scheduledAt: "", copied: false, copyError: copy.copyLinkError, onCopy: () => undefined }));
    expect(markup).toContain("Copying is unavailable here.");
    expect(markup).toContain('class="copy-feedback copy-error"');
  });

  it("propagates clipboard failures for the confirmation handler to render", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("permission denied"));
    await expect(copyTextToClipboard("https://quietly.example/manage/token-123", { writeText })).rejects.toThrow("permission denied");
    expect(writeText).toHaveBeenCalledWith("https://quietly.example/manage/token-123");
  });
});
