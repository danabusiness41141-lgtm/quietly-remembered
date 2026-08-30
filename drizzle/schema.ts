import { int, index, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const remembranceNotes = mysqlTable("remembranceNotes", {
  id: int("id").autoincrement().primaryKey(),
  recipientName: varchar("recipientName", { length: 160 }).notNull(),
  message: text("message").notNull(),
  paperColor: varchar("paperColor", { length: 32 }).default("parchment").notNull(),
  status: mysqlEnum("status", ["pending", "published", "deleted"]).default("published").notNull(),
  manageTokenHash: varchar("manageTokenHash", { length: 128 }).unique(),
  scheduledPublishAt: timestamp("scheduledPublishAt"),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
}, table => ({
  statusCreatedIdx: index("notes_status_created_idx").on(table.status, table.createdAt),
  scheduleIdx: index("notes_schedule_idx").on(table.scheduleCronTaskUid),
}));

export type RemembranceNote = typeof remembranceNotes.$inferSelect;
export type InsertRemembranceNote = typeof remembranceNotes.$inferInsert;

export const noteReports = mysqlTable("noteReports", {
  id: int("id").autoincrement().primaryKey(),
  noteId: int("noteId").notNull(),
  reason: mysqlEnum("reason", ["spam", "harassment", "private", "impersonation", "other"]).notNull(),
  explanation: text("explanation"),
  status: mysqlEnum("status", ["open", "reviewed", "resolved"]).default("open").notNull(),
  reporterKeyHash: varchar("reporterKeyHash", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  noteStatusIdx: index("reports_note_status_idx").on(table.noteId, table.status),
  reporterIdx: index("reports_reporter_idx").on(table.reporterKeyHash, table.createdAt),
}));

export type NoteReport = typeof noteReports.$inferSelect;
export type InsertNoteReport = typeof noteReports.$inferInsert;

export const noteReactions = mysqlTable("noteReactions", {
  id: int("id").autoincrement().primaryKey(),
  noteId: int("noteId").notNull(),
  reaction: varchar("reaction", { length: 32 }).default("remembered").notNull(),
  reactorKeyHash: varchar("reactorKeyHash", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  uniqueReaction: uniqueIndex("note_reactions_unique_idx").on(table.noteId, table.reaction, table.reactorKeyHash),
  noteReactionIdx: index("note_reactions_note_idx").on(table.noteId),
}));

export type NoteReaction = typeof noteReactions.$inferSelect;
export type InsertNoteReaction = typeof noteReactions.$inferInsert;
