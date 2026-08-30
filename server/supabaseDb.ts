import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "./supabase";

export const AUDIO_BUCKET = "qr-audio";
export const MAX_AUDIO_BYTES = 2_000_000;
export const MAX_AUDIO_DURATION_MS = 30_000;

export type AudioAttachment = {
  base64: string;
  mimeType: "audio/webm" | "audio/mp4" | "audio/mpeg" | "audio/ogg";
  durationMs: number;
};

export type SupabaseCreateNote = {
  recipientName: string;
  message: string;
  paperColor: string;
  status: "pending" | "published" | "deleted";
  manageTokenHash: string;
  scheduledPublishAt: Date | null;
  ambientLight?: "lantern" | "moon" | "ember" | "none";
  audio?: AudioAttachment;
};

function requireClient(): SupabaseClient {
  const client = getSupabaseAdmin();
  if (!client) throw new Error("Supabase is not configured");
  return client;
}

function mapNote(row: any) {
  return {
    id: Number(row.id),
    recipientName: row.recipient_name,
    message: row.message,
    paperColor: row.paper_color,
    createdAt: new Date(row.created_at),
    reactionCount: Number(row.reaction_count ?? 0),
    hasAudio: Boolean(row.audio_path),
    audioDurationMs: row.audio_duration_ms == null ? null : Number(row.audio_duration_ms),
    ambientLight: row.ambient_light || "lantern",
  };
}

function audioExtension(mimeType: AudioAttachment["mimeType"]) {
  if (mimeType === "audio/webm") return "webm";
  if (mimeType === "audio/mp4") return "m4a";
  if (mimeType === "audio/mpeg") return "mp3";
  return "ogg";
}

function decodeAttachment(audio: AudioAttachment) {
  const encoded = audio.base64.replace(/^data:[^;]+;base64,/, "");
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > MAX_AUDIO_BYTES) throw new Error("Audio must be a compressed file under 2 MB.");
  if (audio.durationMs < 1 || audio.durationMs > MAX_AUDIO_DURATION_MS) throw new Error("Audio must be 30 seconds or shorter.");
  return bytes;
}

async function attachAudio(client: SupabaseClient, noteId: number, audio: AudioAttachment) {
  const bytes = decodeAttachment(audio);
  const path = `${noteId}/${Date.now()}-${randomBytes(10).toString("hex")}.${audioExtension(audio.mimeType)}`;
  const upload = await client.storage.from(AUDIO_BUCKET).upload(path, bytes, {
    contentType: audio.mimeType,
    cacheControl: "3600",
    upsert: false,
  });
  if (upload.error) throw upload.error;

  const update = await client.from("qr_notes").update({
    audio_path: path,
    audio_mime_type: audio.mimeType,
    audio_bytes: bytes.byteLength,
    audio_duration_ms: audio.durationMs,
  }).eq("id", noteId);
  if (update.error) throw update.error;
}

export async function listPublishedNotesSupabase(input: { search?: string; cursor?: number; limit?: number } = {}) {
  const client = requireClient();
  const search = input.search?.trim().replace(/\s+/g, " ") || "";
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const now = new Date().toISOString();
  let query = client.from("qr_notes").select("id,recipient_name,message,paper_color,created_at,audio_path,audio_duration_ms,ambient_light").eq("status", "published").or(`scheduled_publish_at.is.null,scheduled_publish_at.lte.${now}`).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit + 1);
  if (search) query = query.ilike("recipient_name", `%${search}%`);
  if (input.cursor) query = query.lt("id", input.cursor);
  const result = await query;
  if (result.error) throw result.error;
  const rows = (result.data ?? []).map((row: any) => ({ ...row, reaction_count: 0 }));
  if (!rows.length) return { items: [], nextCursor: null };

  const ids = rows.map(row => Number(row.id));
  const reactionResult = await client.from("qr_note_reactions").select("note_id").in("note_id", ids);
  if (reactionResult.error) throw reactionResult.error;
  const counts = new Map<number, number>();
  for (const reaction of reactionResult.data ?? []) counts.set(Number(reaction.note_id), (counts.get(Number(reaction.note_id)) ?? 0) + 1);
  const ranked = rows.map(row => ({ ...row, reaction_count: counts.get(Number(row.id)) ?? 0 }));
  if (search) {
    const normalized = search.toLocaleLowerCase();
    ranked.sort((a, b) => {
      const rank = (value: string) => value.toLocaleLowerCase() === normalized ? 0 : value.toLocaleLowerCase().startsWith(normalized) ? 1 : 2;
      return rank(a.recipient_name) - rank(b.recipient_name) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }
  const items = ranked.slice(0, limit).map(mapNote);
  return { items, nextCursor: ranked.length > limit ? items[items.length - 1]?.id ?? null : null };
}

export async function createRemembranceNoteSupabase(note: SupabaseCreateNote) {
  const client = requireClient();
  const result = await client.from("qr_notes").insert({
    recipient_name: note.recipientName,
    message: note.message,
    paper_color: note.paperColor,
    status: note.status,
    manage_token_hash: note.manageTokenHash,
    scheduled_publish_at: note.scheduledPublishAt?.toISOString() ?? null,
    ambient_light: note.ambientLight ?? "lantern",
  }).select("id").single();
  if (result.error) throw result.error;
  const id = Number(result.data.id);
  if (note.audio) {
    try { await attachAudio(client, id, note.audio); }
    catch (error) {
      await client.from("qr_notes").update({ status: "deleted", deleted_at: new Date().toISOString() }).eq("id", id);
      throw error;
    }
  }
  return id;
}

export async function getNoteByManageTokenHashSupabase(tokenHash: string) {
  const client = requireClient();
  const result = await client.from("qr_notes").select("id,recipient_name,message,paper_color,status,scheduled_publish_at,schedule_cron_task_uid,ambient_light,audio_path,audio_duration_ms").eq("manage_token_hash", tokenHash).neq("status", "deleted").limit(1);
  if (result.error) throw result.error;
  const row = result.data?.[0];
  return row ? { id: Number(row.id), recipientName: row.recipient_name, message: row.message, paperColor: row.paper_color, status: row.status, scheduledPublishAt: row.scheduled_publish_at ? new Date(row.scheduled_publish_at) : null, scheduleCronTaskUid: row.schedule_cron_task_uid, ambientLight: row.ambient_light, hasAudio: Boolean(row.audio_path), audioDurationMs: row.audio_duration_ms == null ? null : Number(row.audio_duration_ms) } : undefined;
}

export async function deleteNoteByManageTokenHashSupabase(tokenHash: string) {
  const client = requireClient();
  const result = await client.from("qr_notes").update({ status: "deleted", deleted_at: new Date().toISOString(), scheduled_publish_at: null, schedule_cron_task_uid: null }).eq("manage_token_hash", tokenHash);
  if (result.error) throw result.error;
}

export async function setScheduleTaskUidSupabase(noteId: number, taskUid: string) {
  const result = await requireClient().from("qr_notes").update({ schedule_cron_task_uid: taskUid }).eq("id", noteId);
  if (result.error) throw result.error;
}

export async function createNoteReportSupabase(report: { noteId: number; reason: string; explanation?: string | null; reporterKeyHash: string }) {
  const result = await requireClient().from("qr_note_reports").insert({ note_id: report.noteId, reason: report.reason, explanation: report.explanation ?? null, reporter_key_hash: report.reporterKeyHash });
  if (result.error) throw result.error;
}

export async function toggleNoteReactionSupabase(reaction: { noteId: number; reaction: string; reactorKeyHash: string }) {
  const client = requireClient();
  const existing = await client.from("qr_note_reactions").select("id").eq("note_id", reaction.noteId).eq("reaction", reaction.reaction).eq("reactor_key_hash", reaction.reactorKeyHash).limit(1);
  if (existing.error) throw existing.error;
  const existingId = existing.data?.[0]?.id;
  if (existingId) {
    const removed = await client.from("qr_note_reactions").delete().eq("id", existingId);
    if (removed.error) throw removed.error;
    return false;
  }
  const added = await client.from("qr_note_reactions").insert({ note_id: reaction.noteId, reaction: reaction.reaction, reactor_key_hash: reaction.reactorKeyHash });
  if (!added.error) return true;
  if (added.error.code === "23505") return true;
  throw added.error;
}

export async function getNoteReactionCountSupabase(noteId: number) {
  const result = await requireClient().from("qr_note_reactions").select("id", { count: "exact", head: true }).eq("note_id", noteId);
  if (result.error) throw result.error;
  return result.count ?? 0;
}

export async function publishScheduledNoteSupabase(taskUid: string) {
  const result = await requireClient().from("qr_notes").update({ scheduled_publish_at: null, schedule_cron_task_uid: null, status: "published" }).eq("schedule_cron_task_uid", taskUid).eq("status", "published").lte("scheduled_publish_at", new Date().toISOString());
  if (result.error) throw result.error;
}

export async function noteExistsSupabase(noteId: number) {
  const now = new Date().toISOString();
  const result = await requireClient().from("qr_notes").select("id").eq("id", noteId).eq("status", "published").or(`scheduled_publish_at.is.null,scheduled_publish_at.lte.${now}`).limit(1);
  if (result.error) throw result.error;
  return Boolean(result.data?.length);
}

export async function listOpenReportsSupabase() {
  const result = await requireClient().from("qr_note_reports").select("id,note_id,reason,explanation,status,created_at,qr_notes(recipient_name,message)").in("status", ["open", "reviewed"]).order("created_at", { ascending: false }).limit(100);
  if (result.error) throw result.error;
  return (result.data ?? []).map((row: any) => ({ id: Number(row.id), noteId: Number(row.note_id), reason: row.reason, explanation: row.explanation, status: row.status, createdAt: new Date(row.created_at), recipientName: row.qr_notes?.recipient_name ?? "", message: row.qr_notes?.message ?? "" }));
}

export async function resolveReportSupabase(reportId: number, status: "reviewed" | "resolved", removeNote: boolean) {
  const client = requireClient();
  const report = await client.from("qr_note_reports").select("note_id").eq("id", reportId).limit(1);
  if (report.error) throw report.error;
  if (removeNote && report.data?.[0]?.note_id) {
    const noteUpdate = await client.from("qr_notes").update({ status: "deleted", deleted_at: new Date().toISOString(), scheduled_publish_at: null, schedule_cron_task_uid: null }).eq("id", report.data[0].note_id);
    if (noteUpdate.error) throw noteUpdate.error;
  }
  const result = await client.from("qr_note_reports").update({ status }).eq("id", reportId);
  if (result.error) throw result.error;
}

export async function getNoteAudioUrlSupabase(noteId: number) {
  const client = requireClient();
  const now = new Date().toISOString();
  const result = await client.from("qr_notes").select("audio_path").eq("id", noteId).eq("status", "published").or(`scheduled_publish_at.is.null,scheduled_publish_at.lte.${now}`).limit(1);
  if (result.error) throw result.error;
  const path = result.data?.[0]?.audio_path;
  if (!path) return null;
  const signed = await client.storage.from(AUDIO_BUCKET).createSignedUrl(path, 300);
  if (signed.error) throw signed.error;
  return signed.data.signedUrl;
}
