export const AUDIO_MAX_BYTES = 2_000_000;
export const AUDIO_MAX_DURATION_MS = 30_000;
export const AUDIO_SOURCE_MAX_BYTES = 10_000_000;

export const AUDIO_MIME_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg"] as const;
export type AudioMimeType = (typeof AUDIO_MIME_TYPES)[number];

export type AudioAttachment = {
  base64: string;
  mimeType: "audio/webm";
  durationMs: number;
  bytes: number;
  name: string;
};

export function normalizeAudioMimeType(file: Pick<File, "type" | "name">): AudioMimeType | null {
  if (file.type.startsWith("audio/")) return "audio/webm";
  const extension = file.name.toLowerCase().split(".").pop();
  if (["aac", "flac", "m4a", "mp3", "oga", "ogg", "wav", "webm"].includes(extension || "")) return "audio/webm";
  return null;
}

export function validateAudioMetadata(input: { mimeType: string | null; bytes: number; durationMs: number }) {
  if (!input.mimeType || !(AUDIO_MIME_TYPES as readonly string[]).includes(input.mimeType)) return "Please choose an audio file we can compress (MP3, M4A, WAV, WebM, OGG, or FLAC).";
  if (input.bytes < 1 || input.bytes > AUDIO_MAX_BYTES) return "Compressed audio must be smaller than 2 MB.";
  if (!Number.isFinite(input.durationMs) || input.durationMs < 1 || input.durationMs > AUDIO_MAX_DURATION_MS) return "Audio must be 30 seconds or shorter.";
  return null;
}

export function validateAudioSourceBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 1 || bytes > AUDIO_SOURCE_MAX_BYTES) return "The source audio must be smaller than 10 MB before compression.";
  return null;
}

function readAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read this audio file."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function readDurationMs(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration * 1000));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this audio file."));
    };
    audio.src = url;
  });
}

function getRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") throw new Error("This browser cannot compress audio here. Please try a newer browser.");
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  throw new Error("This browser cannot create the compact audio format yet. Please try Chrome, Edge, or Firefox.");
}

async function compressAudioFile(file: File): Promise<Blob> {
  const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) throw new Error("This browser cannot compress audio here. Please try a newer browser.");
  const context = new AudioContextConstructor();
  const destination = context.createMediaStreamDestination();
  const sourceUrl = URL.createObjectURL(file);
  const element = document.createElement("audio");
  element.preload = "auto";
  element.src = sourceUrl;
  const source = context.createMediaElementSource(element);
  source.connect(destination);
  const recorder = new MediaRecorder(destination.stream, { mimeType: getRecorderMimeType(), audioBitsPerSecond: 64_000 });
  const chunks: Blob[] = [];
  const compressed = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => reject(new Error("Could not compress this audio file."));
    recorder.onstop = () => resolve(new Blob(chunks, { type: "audio/webm" }));
  });
  const stop = () => { if (recorder.state !== "inactive") recorder.stop(); };
  element.onended = stop;
  recorder.start();
  try {
    await element.play();
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => { stop(); reject(new Error("Audio compression took too long.")); }, AUDIO_MAX_DURATION_MS + 4_000);
      element.onerror = () => { window.clearTimeout(timeout); stop(); reject(new Error("Could not decode this audio file.")); };
      element.onended = () => { window.clearTimeout(timeout); stop(); resolve(); };
    });
    const result = await compressed;
    if (result.size > AUDIO_MAX_BYTES) throw new Error("The compressed audio is still larger than 2 MB. Please choose a shorter sound.");
    return result;
  } finally {
    element.pause();
    source.disconnect();
    destination.stream.getTracks().forEach(track => track.stop());
    URL.revokeObjectURL(sourceUrl);
    await context.close();
  }
}

export async function prepareAudioAttachment(file: File): Promise<AudioAttachment> {
  const outputMimeType = normalizeAudioMimeType(file);
  if (!outputMimeType) throw new Error("Please choose an audio file we can compress (MP3, M4A, WAV, WebM, OGG, or FLAC).");
  const sourceError = validateAudioSourceBytes(file.size);
  if (sourceError) throw new Error(sourceError);
  const durationMs = await readDurationMs(file);
  if (!Number.isFinite(durationMs) || durationMs < 1 || durationMs > AUDIO_MAX_DURATION_MS) throw new Error("Audio must be 30 seconds or shorter.");
  const compressed = await compressAudioFile(file);
  const error = validateAudioMetadata({ mimeType: "audio/webm", bytes: compressed.size, durationMs });
  if (error) throw new Error(error);
  return { base64: await readAsDataUrl(compressed), mimeType: "audio/webm", durationMs, bytes: compressed.size, name: file.name };
}
