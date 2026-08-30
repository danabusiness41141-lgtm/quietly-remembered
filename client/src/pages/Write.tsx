import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Check, Copy, Feather, Heart, LockKeyhole, Send, Sparkles } from "lucide-react";
import { prepareAudioAttachment, type AudioAttachment } from "../lib/audio";
import { getPaperClass, getPaperStyle, paperTones, isCustomPaperColor } from "../lib/paper";
import { useLanguage } from "../contexts/LanguageContext";
import { trpc } from "../lib/trpc";

type AmbientLight = "lantern" | "moon" | "ember" | "none";

const ambientLights: { key: AmbientLight; glyph: string }[] = [
  { key: "lantern", glyph: "◉" },
  { key: "moon", glyph: "◐" },
  { key: "ember", glyph: "✦" },
  { key: "none", glyph: "·" },
];

export function buildManageUrl(origin: string, token: string) {
  return token ? `${origin}/manage/${token}` : "";
}

export function getCopyLinkLabel(copied: boolean, copiedLabel = "Copied", idleLabel = "Copy private link") {
  return copied ? copiedLabel : idleLabel;
}

export async function copyTextToClipboard(text: string, clipboard?: Pick<Clipboard, "writeText">) {
  const target = clipboard ?? (typeof navigator !== "undefined" ? navigator.clipboard : undefined);
  if (!target) throw new Error("Clipboard unavailable");
  await target.writeText(text);
}

export function WriteConfirmation({ t, copy, person, manageUrl, scheduledAt, copied, copyError = "", onCopy }: { t: any; copy: Record<string, any>; person: string; manageUrl: string; scheduledAt: string; copied: boolean; copyError?: string; onCopy: () => void }) {
  return (
    <div className="confirmation" role="status">
      <div className="confirmation-icon"><Heart size={24} fill="currentColor" /></div>
      <div className="section-kicker">{t.confirmationKicker} {person}</div>
      <h2>{t.confirmationTitle}</h2>
      <p>{scheduledAt ? (copy.scheduledSaved || "Your note is saved and will appear at the chosen time.") : (copy.postedNow || "Your note is here now.")}</p>
      <p className="confirmation-detail">{t.confirmationDesc}</p>
      <div className="manage-callout">
        <div className="manage-callout-heading"><LockKeyhole size={14} /><strong>{copy.manage || "Keep this private link"}</strong></div>
        <p>{copy.manageHint || "It is the only way to delete this note later. Save it somewhere safe."}</p>
        <div className="manage-link-row">
          <input readOnly value={manageUrl} aria-label={String(copy.manage || "Private manage link")} />
          <button type="button" onClick={onCopy} aria-label={getCopyLinkLabel(copied, String(copy.copyLinkDone || "Copied"), String(copy.copyLink || "Copy private link"))}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
        <span className={`copy-feedback ${copyError ? "copy-error" : ""}`} aria-live="polite">{copyError || (copied ? (copy.copyLinkDone || "Copied") : "")}</span>
      </div>
      <div className="confirmation-actions">
        <Link href="/" className="button button-quiet">{t.collection} <ArrowLeft size={14} /></Link>
        <Link href="/write" className="text-link">{t.another} <Sparkles size={13} /></Link>
      </div>
    </div>
  );
}

export default function Write() {
  const { t } = useLanguage();
  const copy = t as typeof t & Record<string, any>;
  const [person, setPerson] = useState("");
  const [message, setMessage] = useState("");
  const [color, setColor] = useState<string>("parchment");
  const [customColor, setCustomColor] = useState("#c8b4a7");
  const [ambientLight, setAmbientLight] = useState<AmbientLight>("lantern");
  const [audio, setAudio] = useState<AudioAttachment | null>(null);
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [manageToken, setManageToken] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const create = trpc.notes.create.useMutation({
    onSuccess: result => {
      if (result.blocked) return;
      setManageToken(result.manageToken);
      setSubmitted(true);
    },
    onError: err => {
      const code = (err as any).data?.code;
      setError(
        code === "TOO_MANY_REQUESTS"
          ? String(copy.rateLimited || "Please return in a little while.")
          : code === "PRECONDITION_FAILED"
            ? String(copy.scheduledUnavailable || "Scheduled publishing is available after deployment.")
            : String(copy.sendError || "Something went wrong. Please try again.")
      );
    },
  });

  const localMinSchedule = useMemo(() => {
    const minimum = new Date(Date.now() + 60_000);
    return new Date(minimum.getTime() - minimum.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
      setError("");
    const publish = scheduledAt ? new Date(scheduledAt) : null;
    create.mutate({
      recipientName: person.trim(),
      message: message.trim(),
      paperColor: color,
      honeypot,
      scheduledPublishAt: publish ? publish.toISOString() : null,
      ambientLight,
      audio: audio ? { base64: audio.base64, mimeType: audio.mimeType, durationMs: audio.durationMs } : undefined,
    });
  };

  const prepareAudio = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setAudioError("");
    setAudioBusy(true);
    try {
      setAudio(await prepareAudioAttachment(file));
    } catch (caught) {
      setAudio(null);
      setAudioError(caught instanceof Error ? caught.message : String(copy.soundError || "Please choose a compressed audio file under 2 MB and 30 seconds."));
    } finally {
      setAudioBusy(false);
    }
  };

  const manageUrl = buildManageUrl(window.location.origin, manageToken);
  const copyLink = async () => {
    if (!manageUrl) return;
    setCopyError("");
    try {
      await copyTextToClipboard(manageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(String(copy.copyLinkError || "Copying is unavailable here. Please save this private link manually."));
    }
  };

  return (
    <main className="write-page container">
      <Link href="/" className="back-link"><ArrowLeft size={14} /> {t.back}</Link>
      <div className="write-page-grid">
        <div className="write-page-copy">
          <div className="section-kicker">{t.writeKicker}</div>
          <h1>{t.writeTitle}</h1>
          <p className="write-lead">{t.writeDesc}</p>
          <div className="write-guidance">
            <div className="guidance-mark"><Feather size={17} /></div>
            <p>{copy.writeGuidance || "You do not have to explain everything. Begin wherever the memory begins."}</p>
          </div>
          <div className="privacy-note">
            <LockKeyhole size={16} />
            <span><strong>{t.anonymous}</strong><br />{t.anonymousDesc}</span>
          </div>
        </div>

        <div className={`letter-card write-card ${getPaperClass(color)} ambient-${ambientLight}`} style={getPaperStyle(color)}>
          <div className="card-tape" />
          <div className="write-ambient-preview" aria-hidden="true"><span className="write-ambient-orb" /><span>{copy[`light${ambientLight[0].toUpperCase()}${ambientLight.slice(1)}`] || ambientLight}</span></div>
          <div className="card-corner">✦</div>
          {submitted ? (
            <WriteConfirmation t={t} copy={copy} person={person} manageUrl={manageUrl} scheduledAt={scheduledAt} copied={copied} copyError={copyError} onCopy={copyLink} />
          ) : (
            <form onSubmit={submit} className="write-form">
              <div className="form-topline"><span>{t.dear} {person || "..."}</span><Sparkles size={15} /></div>
              <div className="field-group">
                <label htmlFor="person">{t.who}</label>
                <span className="field-hint">{copy.writeNameHint || "Only the name they would recognize."}</span>
                <input id="person" value={person} onChange={event => setPerson(event.target.value)} placeholder={String(t.namePlaceholder)} autoComplete="off" maxLength={160} required />
              </div>
              <div className="field-group field-message">
                <label htmlFor="message">{t.what}</label>
                <span className="field-hint">{copy.writeMessageHint || "The ordinary things count, too."}</span>
                <textarea id="message" value={message} onChange={event => setMessage(event.target.value)} placeholder={String(t.messagePlaceholder)} rows={8} maxLength={5000} required />
                <span className="character-count">{message.length} / 5000</span>
              </div>
              <input aria-hidden="true" tabIndex={-1} autoComplete="off" className="honeypot" value={honeypot} onChange={event => setHoneypot(event.target.value)} />
              <div className="paper-choice">
                <div><span className="choice-label">{t.paperTone}</span><span className="choice-hint">{copy.paperChoiceHint || "Choose the feeling of the page."}</span></div>
                <div className="paper-swatches" role="group" aria-label={String(t.paperTone)}>
                  {paperTones.map(paper => (
                    <button type="button" key={paper.key} aria-label={String((t as any)[paper.key] || paper.key)} aria-pressed={color === paper.key} className={`color-dot dot-${paper.key} ${color === paper.key ? "selected" : ""}`} onClick={() => setColor(paper.key)}>
                      {color === paper.key && <Check size={11} />}
                    </button>
                  ))}
                  <label className={`custom-color-picker ${isCustomPaperColor(color) ? "selected" : ""}`} style={{ backgroundColor: customColor }}>
                    <input type="color" value={customColor} onChange={event => { setCustomColor(event.target.value); setColor(event.target.value); }} aria-label={String(copy.customPaper || "Custom paper color")} />
                    {isCustomPaperColor(color) && <Check size={11} />}
                  </label>
                </div>
              </div>
              <details className="schedule-details">
                <summary><span>{copy.schedule || "Publish later"}</span><span className="optional-label">{copy.optional || "optional"}</span></summary>
                <p>{copy.scheduleHint || "Choose a future date and time, shown in your local time."}</p>
                <input type="datetime-local" min={localMinSchedule} value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} aria-label={String(copy.schedule || "Publish later")} />
              </details>
              <div className="ambient-choice">
                <div><span className="choice-label">{copy.ambientLight || "Ambient light"}</span><span className="choice-hint">{copy.ambientHint || "A small glow for the feeling of this note."}</span></div>
                <div className="ambient-options" role="group" aria-label={String(copy.ambientLight || "Ambient light")}>
                  {ambientLights.map(light => <button type="button" key={light.key} className={`ambient-option ambient-${light.key} ${ambientLight === light.key ? "selected" : ""}`} aria-pressed={ambientLight === light.key} onClick={() => setAmbientLight(light.key)}><span aria-hidden="true">{light.glyph}</span><span>{copy[`light${light.key[0].toUpperCase()}${light.key.slice(1)}`] || light.key}</span></button>)}
                </div>
              </div>
              <div className="audio-choice">
                <div><span className="choice-label">{copy.addSound || "Add a small sound"}</span><span className="choice-hint">{copy.soundHint || "Optional · compressed audio only · up to 30 seconds / 2 MB"}</span></div>
                <div className="audio-controls">
                  <label className={`audio-upload ${audioBusy ? "busy" : ""}`}>
                    <input type="file" accept="audio/webm,audio/mp4,audio/mpeg,audio/ogg,.m4a,.mp3,.webm,.ogg" onChange={prepareAudio} disabled={audioBusy || create.isPending} />
                    <span>{audioBusy ? (copy.soundLoading || "Loading sound…") : audio ? (copy.soundReady || "Sound ready") : (copy.addSound || "Add a small sound")}</span>
                  </label>
                  {audio && <button type="button" className="audio-remove" onClick={() => setAudio(null)}>{copy.removeSound || "Remove sound"}</button>}
                </div>
                {audioError && <p className="form-error audio-error" role="alert"><span>↺</span>{audioError}</p>}
              </div>
              {error && <p className="form-error" role="alert"><span>↺</span>{error}</p>}
              <div className="form-footer">
                <span className="helper"><LockKeyhole size={13} /> {t.noName}</span>
                <button className="button" type="submit" disabled={!person.trim() || !message.trim() || create.isPending}>
                  {create.isPending ? <span className="submit-loading">{copy.loading || "Holding your note…"}</span> : <>{t.leave} <Send size={15} /></>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
