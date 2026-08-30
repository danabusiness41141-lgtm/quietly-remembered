import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  toggleNoteReaction: vi.fn(),
  createNoteReport: vi.fn(),
  createRemembranceNote: vi.fn(async () => 1),
  deleteNoteByManageTokenHash: vi.fn(),
  getNoteByManageTokenHash: vi.fn(),
  getNoteReactionCount: vi.fn(async () => 0),
  getDb: vi.fn(async () => null),
  listOpenReports: vi.fn(async () => []),
  listPublishedNotes: vi.fn(async () => ({ items: [], nextCursor: null })),
  noteExists: vi.fn(async () => false),
  publishScheduledNote: vi.fn(),
  resolveReport: vi.fn(),
}));
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function callerFor(ip: string, user: TrpcContext["user"] = null) {
  const ctx = { user, req: { headers: { "x-forwarded-for": ip }, socket: { remoteAddress: ip } }, res: {} } as unknown as TrpcContext;
  return appRouter.createCaller(ctx);
}

describe("notes.create", () => {
  it("rejects an empty recipient name before touching storage", async () => {
    await expect(callerFor("198.51.100.11").notes.create({ recipientName: "", message: "A note", paperColor: "rose" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("accepts a safe custom paper hex color", async () => {
    const result = await callerFor("198.51.100.14").notes.create({ recipientName: "Someone", message: "A custom page.", paperColor: "#c8b4a7" });
    expect(result.success).toBe(true);
  });
  it("rejects unsafe custom paper values", async () => {
    await expect(callerFor("198.51.100.15").notes.create({ recipientName: "Someone", message: "A note", paperColor: "url(javascript:alert(1))" as any })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("silently blocks a filled honeypot", async () => {
    const result = await callerFor("198.51.100.12").notes.create({ recipientName: "Someone", message: "hello", paperColor: "rose", honeypot: "bot" });
    expect(result).toEqual({ success: true, blocked: true });
  });
  it("throttles repeated submissions from one client", async () => {
    const caller = callerFor("198.51.100.13");
    for (let i = 0; i < 5; i++) await caller.notes.create({ recipientName: "Someone", message: `message ${i}`, paperColor: "parchment" }).catch(() => undefined);
    await expect(caller.notes.create({ recipientName: "Someone", message: "one too many", paperColor: "parchment" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
  it("keeps scheduling disabled until production deployment is explicitly enabled", async () => {
    await expect(callerFor("198.51.100.14").notes.create({ recipientName: "Someone", message: "later", paperColor: "parchment", scheduledPublishAt: new Date(Date.now() + 86_400_000).toISOString() })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});

describe("notes management and moderation", () => {
  it("rejects malformed private management tokens", async () => {
    await expect(callerFor("198.51.100.15").notes.manageGet({ token: "too-short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(callerFor("198.51.100.15").notes.manageDelete({ token: "too-short", confirm: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("does not allow anonymous visitors to read moderator reports", async () => {
    await expect(callerFor("198.51.100.16").notes.moderationQueue()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("validates anonymous keys for reports and reactions", async () => {
    await expect(callerFor("198.51.100.17").notes.report({ noteId: 1, reason: "spam", anonymousKey: "short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(callerFor("198.51.100.17").notes.react({ noteId: 1, anonymousKey: "short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("validates cursor pagination inputs", async () => {
    await expect(callerFor("198.51.100.18").notes.list({ cursor: -1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
