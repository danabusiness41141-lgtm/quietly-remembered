import { and, desc, eq, like, lt, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertNoteReaction, InsertNoteReport, InsertRemembranceNote, InsertUser, noteReactions, noteReports, remembranceNotes, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getSupabaseAdmin } from "./supabase";
import * as supabaseDb from "./supabaseDb";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const publicFields = {
  id: remembranceNotes.id,
  recipientName: remembranceNotes.recipientName,
  message: remembranceNotes.message,
  paperColor: remembranceNotes.paperColor,
  createdAt: remembranceNotes.createdAt,
  reactionCount: sql<number>`(SELECT COUNT(*) FROM noteReactions r WHERE r.noteId = ${remembranceNotes.id})`,
};

export async function listPublishedNotes(input: { search?: string; cursor?: number; limit?: number } = {}) {
  if (getSupabaseAdmin()) return supabaseDb.listPublishedNotesSupabase(input);
  const db = await getDb();
  if (!db) return { items: [], nextCursor: null };
  const search = input.search?.trim().replace(/\s+/g, " ") || "";
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const now = new Date();
  const visibility = and(
    eq(remembranceNotes.status, "published"),
    or(sql`${remembranceNotes.scheduledPublishAt} IS NULL`, lte(remembranceNotes.scheduledPublishAt, now)),
    input.cursor ? lt(remembranceNotes.id, input.cursor) : undefined,
  );
  const searchFilter = search ? like(remembranceNotes.recipientName, `%${search}%`) : undefined;
  const ranking = sql<number>`CASE WHEN LOWER(${remembranceNotes.recipientName}) = LOWER(${search}) THEN 0 WHEN LOWER(${remembranceNotes.recipientName}) LIKE LOWER(${`${search}%`}) THEN 1 ELSE 2 END`;
  const orderBy = search
    ? [ranking, desc(remembranceNotes.createdAt), desc(remembranceNotes.id)]
    : [desc(remembranceNotes.createdAt), desc(remembranceNotes.id)];
  const rows = await db.select(publicFields).from(remembranceNotes)
    .where(and(visibility, searchFilter))
    .orderBy(...orderBy)
    .limit(limit + 1);
  const items = rows.slice(0, limit).map(row => ({ ...row, hasAudio: false, audioDurationMs: null, ambientLight: "lantern" }));
  return { items, nextCursor: rows.length > limit ? items[items.length - 1]?.id ?? null : null };
}

export async function createRemembranceNote(note: InsertRemembranceNote & { ambientLight?: "lantern" | "moon" | "ember" | "none"; audio?: supabaseDb.AudioAttachment }) {
  if (getSupabaseAdmin()) return supabaseDb.createRemembranceNoteSupabase({
    recipientName: note.recipientName,
    message: note.message,
    paperColor: note.paperColor ?? "parchment",
    status: note.status ?? "published",
    manageTokenHash: note.manageTokenHash ?? "",
    scheduledPublishAt: note.scheduledPublishAt ?? null,
    ambientLight: note.ambientLight,
    audio: note.audio,
  });
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(remembranceNotes).values(note);
  const insertId = Number((result as any)[0]?.insertId ?? (result as any).insertId);
  return insertId;
}

export async function getNoteByManageTokenHash(hash: string) {
  if (getSupabaseAdmin()) return supabaseDb.getNoteByManageTokenHashSupabase(hash);
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({ id: remembranceNotes.id, recipientName: remembranceNotes.recipientName, message: remembranceNotes.message, paperColor: remembranceNotes.paperColor, status: remembranceNotes.status, scheduledPublishAt: remembranceNotes.scheduledPublishAt, scheduleCronTaskUid: remembranceNotes.scheduleCronTaskUid }).from(remembranceNotes).where(and(eq(remembranceNotes.manageTokenHash, hash), sql`${remembranceNotes.status} <> 'deleted'`)).limit(1);
  return rows[0];
}

export async function deleteNoteByManageTokenHash(hash: string) {
  if (getSupabaseAdmin()) return supabaseDb.deleteNoteByManageTokenHashSupabase(hash);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(remembranceNotes).set({ status: "deleted", deletedAt: new Date(), scheduledPublishAt: null, scheduleCronTaskUid: null }).where(eq(remembranceNotes.manageTokenHash, hash));
}

export async function createNoteReport(report: InsertNoteReport) {
  if (getSupabaseAdmin()) return supabaseDb.createNoteReportSupabase({ noteId: report.noteId, reason: report.reason, explanation: report.explanation, reporterKeyHash: report.reporterKeyHash });
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(noteReports).values(report);
}

export async function toggleNoteReaction(reaction: InsertNoteReaction) {
  if (getSupabaseAdmin()) return supabaseDb.toggleNoteReactionSupabase({ noteId: reaction.noteId, reaction: reaction.reaction ?? "remembered", reactorKeyHash: reaction.reactorKeyHash });
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select({ id: noteReactions.id }).from(noteReactions).where(and(eq(noteReactions.noteId, reaction.noteId), eq(noteReactions.reaction, reaction.reaction ?? "remembered"), eq(noteReactions.reactorKeyHash, reaction.reactorKeyHash))).limit(1);
  if (existing[0]) { await db.delete(noteReactions).where(eq(noteReactions.id, existing[0].id)); return false; }
  try { await db.insert(noteReactions).values(reaction); return true; }
  catch (error: any) { if (error?.code === "ER_DUP_ENTRY") return true; throw error; }
}

export async function getNoteReactionCount(noteId: number) {
  if (getSupabaseAdmin()) return supabaseDb.getNoteReactionCountSupabase(noteId);
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`COUNT(*)` }).from(noteReactions).where(eq(noteReactions.noteId, noteId));
  return Number(rows[0]?.count ?? 0);
}

export async function setScheduleTaskUid(noteId: number, taskUid: string) {
  if (getSupabaseAdmin()) return supabaseDb.setScheduleTaskUidSupabase(noteId, taskUid);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(remembranceNotes).set({ scheduleCronTaskUid: taskUid }).where(eq(remembranceNotes.id, noteId));
}

export async function getNoteAudioUrl(noteId: number) {
  if (getSupabaseAdmin()) return supabaseDb.getNoteAudioUrlSupabase(noteId);
  return null;
}

export async function publishScheduledNote(taskUid: string) {
  if (getSupabaseAdmin()) return supabaseDb.publishScheduledNoteSupabase(taskUid);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(remembranceNotes).set({ scheduledPublishAt: null, scheduleCronTaskUid: null, status: "published" }).where(and(eq(remembranceNotes.scheduleCronTaskUid, taskUid), eq(remembranceNotes.status, "published"), lte(remembranceNotes.scheduledPublishAt, new Date())));
}

export async function noteExists(noteId: number) {
  if (getSupabaseAdmin()) return supabaseDb.noteExistsSupabase(noteId);
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: remembranceNotes.id }).from(remembranceNotes).where(and(eq(remembranceNotes.id, noteId), eq(remembranceNotes.status, "published"), or(sql`${remembranceNotes.scheduledPublishAt} IS NULL`, lte(remembranceNotes.scheduledPublishAt, new Date())))).limit(1);
  return rows.length > 0;
}

export async function listOpenReports() {
  if (getSupabaseAdmin()) return supabaseDb.listOpenReportsSupabase();
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: noteReports.id, noteId: noteReports.noteId, reason: noteReports.reason, explanation: noteReports.explanation, status: noteReports.status, createdAt: noteReports.createdAt, recipientName: remembranceNotes.recipientName, message: remembranceNotes.message }).from(noteReports).leftJoin(remembranceNotes, eq(noteReports.noteId, remembranceNotes.id)).where(or(eq(noteReports.status, "open"), eq(noteReports.status, "reviewed"))).orderBy(desc(noteReports.createdAt)).limit(100);
}

export async function resolveReport(reportId: number, status: "reviewed" | "resolved", removeNote: boolean) {
  if (getSupabaseAdmin()) return supabaseDb.resolveReportSupabase(reportId, status, removeNote);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const reports = await db.select({ noteId: noteReports.noteId }).from(noteReports).where(eq(noteReports.id, reportId)).limit(1);
  if (removeNote && reports[0]?.noteId) await db.update(remembranceNotes).set({ status: "deleted", deletedAt: new Date(), scheduledPublishAt: null, scheduleCronTaskUid: null }).where(eq(remembranceNotes.id, reports[0].noteId));
  await db.update(noteReports).set({ status }).where(eq(noteReports.id, reportId));
}
