import { createHash, randomBytes } from "node:crypto";
import { parse as parseCookie } from "cookie";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { toggleNoteReaction, createNoteReport, createRemembranceNote, deleteNoteByManageTokenHash, getNoteAudioUrl, getNoteByManageTokenHash, getNoteReactionCount, listOpenReports, listPublishedNotes, noteExists, publishScheduledNote, resolveReport, setScheduleTaskUid } from "./db";
import { createHeartbeatJob, deleteHeartbeatJob } from "./_core/heartbeat";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { NOTE_RATE_LIMITS } from "./config";

const PAPER_COLORS = ["parchment", "sage", "blue", "rose", "lilac", "butter", "terracotta"] as const;
const PAPER_COLOR_SCHEMA = z.union([z.enum(PAPER_COLORS), z.string().regex(/^#[0-9a-fA-F]{6}$/, "Paper color must be a six-digit hex value.")]);
const reportReasons = ["spam", "harassment", "private", "impersonation", "other"] as const;
const attempts = new Map<string, number[]>();
const reportAttempts = new Map<string, number[]>();
const MAX_SUBMISSIONS_PER_HOUR = NOTE_RATE_LIMITS.submissionsPerHour;
const MAX_REPORTS_PER_HOUR = NOTE_RATE_LIMITS.reportsPerHour;
const SCHEDULED_PUBLISHING_ENABLED = process.env.NODE_ENV === "production" && process.env.QR_ENABLE_SCHEDULED_PUBLISHING === "true";

function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function clientKey(req: any) { return String(req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "unknown").split(",")[0].trim(); }
function enforceSubmissionLimit(req: any) {
  const key = clientKey(req); const now = Date.now(); const current = (attempts.get(key) ?? []).filter(time => now - time < 3_600_000);
  if (current.length >= MAX_SUBMISSIONS_PER_HOUR) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "You have left several notes recently. Please return in a little while." });
  current.push(now); attempts.set(key, current);
}
function enforceReportLimit(key: string) {
  const now = Date.now(); const current = (reportAttempts.get(hash(key)) ?? []).filter(time => now - time < 3_600_000);
  if (current.length >= MAX_REPORTS_PER_HOUR) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Thank you. We have received enough reports from this browser for now." });
  current.push(now); reportAttempts.set(hash(key), current);
}
function toCron(date: Date) { return `0 ${date.getUTCMinutes()} ${date.getUTCHours()} ${date.getUTCDate()} ${date.getUTCMonth() + 1} *`; }

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  notes: router({
    list: publicProcedure.input(z.object({ search: z.string().max(160).optional(), cursor: z.number().int().positive().optional(), limit: z.number().int().min(1).max(50).optional() }).optional()).query(({ input }) => listPublishedNotes(input ?? {})),
    create: publicProcedure.input(z.object({ recipientName: z.string().trim().min(1).max(160), message: z.string().trim().min(1).max(5000), paperColor: PAPER_COLOR_SCHEMA.default("parchment"), honeypot: z.string().max(200).optional(), scheduledPublishAt: z.string().datetime().nullable().optional(), ambientLight: z.enum(["lantern", "moon", "ember", "none"]).default("lantern"), audio: z.object({ base64: z.string().min(1).max(2_800_000), mimeType: z.enum(["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg"]), durationMs: z.number().int().min(1).max(30_000) }).optional() })).mutation(async ({ ctx, input }) => {
      if (input.honeypot?.trim()) return { success: true, blocked: true } as const;
      enforceSubmissionLimit(ctx.req);
      const publishAt = input.scheduledPublishAt ? new Date(input.scheduledPublishAt) : null;
      if (publishAt && publishAt.getTime() <= Date.now()) throw new TRPCError({ code: "BAD_REQUEST", message: "Please choose a future time for this note." });
      if (publishAt && !SCHEDULED_PUBLISHING_ENABLED) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Scheduled publishing will be available after the site is deployed." });
      const token = randomBytes(32).toString("base64url");
      const noteId = await createRemembranceNote({ recipientName: input.recipientName, message: input.message, paperColor: input.paperColor, status: "published", manageTokenHash: hash(token), scheduledPublishAt: publishAt, ambientLight: input.ambientLight, audio: input.audio });
      if (publishAt && noteId) {
        const job = await createHeartbeatJob({ name: `publish-note-${noteId}`, cron: toCron(publishAt), path: "/api/scheduled/publish-note", payload: { noteId }, description: "Publish an anonymous remembrance note at its chosen time." }, parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "");
        await setScheduleTaskUid(noteId, job.taskUid);
      }
      return { success: true, manageToken: token, scheduled: Boolean(publishAt) } as const;
    }),
    manageGet: publicProcedure.input(z.object({ token: z.string().min(40).max(100) })).query(({ input }) => getNoteByManageTokenHash(hash(input.token))),
    manageDelete: publicProcedure.input(z.object({ token: z.string().min(40).max(100), confirm: z.literal(true) })).mutation(async ({ input }) => { const note = await getNoteByManageTokenHash(hash(input.token)); if (!note) throw new TRPCError({ code: "NOT_FOUND", message: "This private link is not valid." }); if (note.scheduleCronTaskUid) await deleteHeartbeatJob(note.scheduleCronTaskUid, "").catch(() => undefined); await deleteNoteByManageTokenHash(hash(input.token)); return { success: true } as const; }),
    report: publicProcedure.input(z.object({ noteId: z.number().int().positive(), reason: z.enum(reportReasons), explanation: z.string().trim().max(500).optional(), anonymousKey: z.string().min(16).max(160) })).mutation(async ({ input }) => { enforceReportLimit(input.anonymousKey); if (!(await noteExists(input.noteId))) throw new TRPCError({ code: "NOT_FOUND", message: "That note is no longer available." }); await createNoteReport({ noteId: input.noteId, reason: input.reason, explanation: input.explanation || null, reporterKeyHash: hash(input.anonymousKey) }); return { success: true } as const; }),
    react: publicProcedure.input(z.object({ noteId: z.number().int().positive(), anonymousKey: z.string().min(16).max(160) })).mutation(async ({ input }) => { if (!(await noteExists(input.noteId))) throw new TRPCError({ code: "NOT_FOUND", message: "That note is no longer available." }); const added = await toggleNoteReaction({ noteId: input.noteId, reaction: "remembered", reactorKeyHash: hash(input.anonymousKey) }); return { added, count: await getNoteReactionCount(input.noteId) } as const; }),
    audioUrl: publicProcedure.input(z.object({ noteId: z.number().int().positive() })).query(async ({ input }) => { if (!(await noteExists(input.noteId))) throw new TRPCError({ code: "NOT_FOUND", message: "That note is no longer available." }); return { url: await getNoteAudioUrl(input.noteId) } as const; }),
    publishScheduled: publicProcedure.mutation(async ({ ctx }) => {
      let user;
      try {
        user = await (await import("./_core/sdk")).sdk.authenticateRequest(ctx.req);
      } catch {
        throw new TRPCError({ code: "FORBIDDEN", message: "cron-only" });
      }
      if (!user.isCron || !user.taskUid) throw new TRPCError({ code: "FORBIDDEN", message: "cron-only" });
      await publishScheduledNote(user.taskUid);
      return { success: true } as const;
    }),
    moderationQueue: adminProcedure.query(() => listOpenReports()),
    resolveReport: adminProcedure.input(z.object({ reportId: z.number().int().positive(), status: z.enum(["reviewed", "resolved"]), removeNote: z.boolean().default(false) })).mutation(async ({ input }) => { await resolveReport(input.reportId, input.status, input.removeNote); return { success: true } as const; }),
  }),
});

export type AppRouter = typeof appRouter;
