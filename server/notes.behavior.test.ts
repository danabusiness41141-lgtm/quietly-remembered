import { beforeEach, describe, expect, it, vi } from "vitest";

const state = { notes: new Map<number, any>(), reports: new Map<number, any>(), reactions: new Set<string>(), nextNote: 1, nextReport: 1 };

vi.mock("./db", () => ({
  toggleNoteReaction: async (value: any) => { const key = `${value.noteId}:${value.reaction}:${value.reactorKeyHash}`; if (state.reactions.has(key)) { state.reactions.delete(key); return false; } state.reactions.add(key); return true; },
  createNoteReport: async (value: any) => { const id = state.nextReport++; state.reports.set(id, { id, ...value, status: "open" }); },
  createRemembranceNote: async (value: any) => { const id = state.nextNote++; state.notes.set(id, { id, ...value, createdAt: new Date(id * 1000) }); return id; },
  deleteNoteByManageTokenHash: async (tokenHash: string) => { for (const note of state.notes.values()) if (note.manageTokenHash === tokenHash) note.status = "deleted"; },
  getDb: async () => null,
  getNoteByManageTokenHash: async (tokenHash: string) => { for (const note of state.notes.values()) if (note.manageTokenHash === tokenHash && note.status !== "deleted") return note; return undefined; },
  getNoteReactionCount: async (noteId: number) => [...state.reactions].filter(key => key.startsWith(`${noteId}:`)).length,
  getUserByOpenId: async () => undefined,
  listOpenReports: async () => [...state.reports.values()].filter(report => report.status !== "resolved"),
  listPublishedNotes: async (input: any = {}) => { let rows = [...state.notes.values()].filter(note => note.status === "published").sort((a, b) => b.id - a.id); const search = input.search?.toLowerCase(); if (search) rows = rows.filter(note => note.recipientName.toLowerCase().includes(search)).sort((a, b) => Number(a.recipientName.toLowerCase() !== search) - Number(b.recipientName.toLowerCase() !== search)); if (input.cursor) rows = rows.filter(note => note.id < input.cursor); const limit = input.limit ?? 20; return { items: rows.slice(0, limit).map(note => ({ id: note.id, recipientName: note.recipientName, message: note.message, paperColor: note.paperColor, createdAt: note.createdAt, reactionCount: [...state.reactions].filter(key => key.startsWith(`${note.id}:`)).length })), nextCursor: rows.length > limit ? rows[limit - 1].id : null }; },
  noteExists: async (noteId: number) => state.notes.get(noteId)?.status === "published",
  publishScheduledNote: async () => undefined,
  resolveReport: async (reportId: number, status: string, removeNote: boolean) => { const report = state.reports.get(reportId); if (report) { report.status = status; if (removeNote) state.notes.get(report.noteId).status = "deleted"; } },
  upsertUser: async () => undefined,
}));
vi.mock("./_core/heartbeat", () => ({ createHeartbeatJob: vi.fn(async () => ({ taskUid: "test-task" })), deleteHeartbeatJob: vi.fn(async () => undefined) }));

const { appRouter } = await import("./routers");

function caller(user: any = null, ip = "203.0.113.10") { return appRouter.createCaller({ user, req: { headers: { "x-forwarded-for": ip }, socket: { remoteAddress: ip } }, res: {} } as any); }
const admin = { id: 1, openId: "admin", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

beforeEach(() => { state.notes.clear(); state.reports.clear(); state.reactions.clear(); state.nextNote = 1; state.nextReport = 1; });

describe("public note behavior", () => {
  it("reports a note and lets an admin resolve it by removing the note", async () => {
    const created = await caller().notes.create({ recipientName: "Mina", message: "I remember your laugh.", paperColor: "rose" });
    const note = await caller().notes.list({});
    const report = await caller().notes.report({ noteId: note.items[0].id, reason: "spam", anonymousKey: "reporter-key-123456" });
    expect(report.success).toBe(true);
    const queue = await caller(admin).notes.moderationQueue();
    expect(queue[0].status).toBe("open");
    await caller(admin).notes.resolveReport({ reportId: queue[0].id, status: "resolved", removeNote: true });
    expect((await caller().notes.list({})).items).toHaveLength(0);
    expect(created.manageToken).toHaveLength(43);
  });

  it("deletes through the private link and rejects reuse afterward", async () => {
    const created = await caller().notes.create({ recipientName: "Omar", message: "You are still with me.", paperColor: "blue" });
    const before = await caller().notes.manageGet({ token: created.manageToken });
    expect(before?.recipientName).toBe("Omar");
    await caller().notes.manageDelete({ token: created.manageToken, confirm: true });
    await expect(caller().notes.manageDelete({ token: created.manageToken, confirm: true })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await caller().notes.list({})).items).toHaveLength(0);
  });

  it("preserves a custom paper color through creation and archive listing", async () => {
    await caller().notes.create({ recipientName: "Narin", message: "A page in your color.", paperColor: "#c8b4a7" });
    const listed = await caller().notes.list({});
    expect(listed.items[0]).toMatchObject({ recipientName: "Narin", paperColor: "#c8b4a7" });
  });

  it("toggles a reaction and returns the current count", async () => {
    await caller().notes.create({ recipientName: "Lina", message: "A little heart for you.", paperColor: "sage" });
    const first = await caller().notes.react({ noteId: 1, anonymousKey: "browser-key-123456" });
    const second = await caller().notes.react({ noteId: 1, anonymousKey: "browser-key-123456" });
    const third = await caller().notes.react({ noteId: 1, anonymousKey: "browser-key-123456" });
    expect(first).toEqual({ added: true, count: 1 });
    expect(second).toEqual({ added: false, count: 0 });
    expect(third).toEqual({ added: true, count: 1 });
  });

  it("filters and paginates the public collection", async () => {
    await caller(null, "203.0.113.20").notes.create({ recipientName: "Mina", message: "one", paperColor: "parchment" });
    await caller(null, "203.0.113.21").notes.create({ recipientName: "Mina Rose", message: "two", paperColor: "parchment" });
    await caller(null, "203.0.113.22").notes.create({ recipientName: "Omar", message: "three", paperColor: "parchment" });
    const filtered = await caller().notes.list({ search: "Mina" });
    expect(filtered.items).toHaveLength(2);
    expect(filtered.items[0].recipientName).toBe("Mina");
    const firstPage = await caller().notes.list({ limit: 1 });
    const secondPage = await caller().notes.list({ limit: 1, cursor: firstPage.nextCursor! });
    expect(firstPage.items).toHaveLength(1);
    expect(secondPage.items[0].id).not.toBe(firstPage.items[0].id);
  });
});


describe("moderation and archive boundaries", () => {
  it("places a submitted report in the open moderation queue", async () => {
    await caller().notes.create({ recipientName: "Salma", message: "Please keep this gentle.", paperColor: "rose" });
    await caller().notes.report({ noteId: 1, reason: "other", explanation: "Review this note", anonymousKey: "queue-reporter-key-123456" });
    const queue = await caller(admin).notes.moderationQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ noteId: 1, reason: "other", status: "open" });
  });

  it("returns no next cursor after the final archive page", async () => {
    await caller(null, "203.0.113.31").notes.create({ recipientName: "A", message: "one", paperColor: "parchment" });
    await caller(null, "203.0.113.32").notes.create({ recipientName: "B", message: "two", paperColor: "parchment" });
    const firstPage = await caller().notes.list({ limit: 1 });
    const finalPage = await caller().notes.list({ limit: 1, cursor: firstPage.nextCursor! });
    expect(firstPage.nextCursor).toBe(2);
    expect(finalPage.items).toHaveLength(1);
    expect(finalPage.nextCursor).toBeNull();
  });

  it("rejects unauthenticated scheduled publishing as forbidden", async () => {
    await expect(caller().notes.publishScheduled()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
