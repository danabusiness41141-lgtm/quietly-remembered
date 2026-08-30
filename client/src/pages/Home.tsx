import { useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { ArrowUpRight, Expand, Flag, Heart, Minimize2, Pause, Play, RefreshCw, Search, Sparkles, X } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "../contexts/LanguageContext";
import { trpc } from "../lib/trpc";
import { getAnonymousKey } from "../lib/anonymousKey";
import { getPaperClass, getPaperStyle } from "../lib/paper";

const reactedStorageKey = "qr-reacted";

function NoteSkeleton() {
  return <div className="note-skeleton" aria-hidden="true"><span /><span /><span /><i /></div>;
}

export function getArchiveState(input: { isLoading: boolean; isError: boolean; hasNotes: boolean }) {
  if (input.isLoading && !input.hasNotes) return "loading" as const;
  if (input.isError && !input.hasNotes) return "error" as const;
  if (input.hasNotes) return "notes" as const;
  return "empty" as const;
}

export function getExpansionPresentation(expanded: boolean, openLabel = "Open note", closeLabel = "Close note") {
  return { expanded, label: expanded ? closeLabel : openLabel };
}

export function getCardKeyAction(key: string, expanded: boolean) {
  if (key === "Enter" || key === " ") return "toggle" as const;
  if (key === "Escape" && expanded) return "close" as const;
  return null;
}

export function getReactionPresentation(hasReacted: boolean, idleLabel = "Quietly remembered", activeLabel = "Remembered", removeLabel = "Remove remembered") {
  return {
    disabled: false,
    pressed: hasReacted,
    label: hasReacted ? activeLabel : idleLabel,
    title: hasReacted ? removeLabel : idleLabel,
  };
}

export function updateReactionCount(notes: any[], noteId: number, count: number) {
  return notes.map(note => note.id === noteId ? { ...note, reactionCount: count } : note);
}

function MemoryNoteCard({ note, index, t, copy, hasReacted, hasReported, reactionPresentation, expanded, onToggle, onReact, onReport }: any) {
  const expansion = getExpansionPresentation(expanded, String(copy.openNote || "Open note"), String(copy.closeNote || "Close note"));
  const audioRef = useRef<HTMLAudioElement>(null);
  const [soundOpen, setSoundOpen] = useState(false);
  const [soundBusy, setSoundBusy] = useState(false);
  const [soundError, setSoundError] = useState("");
  const audioUrlQuery = trpc.notes.audioUrl.useQuery({ noteId: note.id }, { enabled: false, retry: false });

  const playSound = async () => {
    if (!note.hasAudio || soundBusy || !audioRef.current) return;
    if (!audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setSoundOpen(false);
      return;
    }
    setSoundError("");
    setSoundBusy(true);
    try {
      const result = await audioUrlQuery.refetch();
      const url = result.data?.url;
      if (!url) throw new Error(String(copy.audioUnavailable || "This note has no playable sound."));
      audioRef.current.src = url;
      await audioRef.current.play();
      setSoundOpen(true);
    } catch (caught) {
      setSoundOpen(false);
      setSoundError(caught instanceof Error ? caught.message : String(copy.audioUnavailable || "This note has no playable sound."));
    } finally {
      setSoundBusy(false);
    }
  };

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, details, input, select, textarea, form, a")) return;
    onToggle();
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    const action = getCardKeyAction(event.key, expanded);
    if (!action) return;
    event.preventDefault();
    onToggle();
  };

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const paperColor = String(note.paperColor || "parchment");
  return <article className={`memory-note ${getPaperClass(paperColor)} ambient-${note.ambientLight || "lantern"} ${index % 3 === 1 ? "rotate-note" : ""} ${note.hasAudio ? "has-sound" : ""} ${expanded ? "expanded" : ""}`} style={getPaperStyle(paperColor)} key={note.id} tabIndex={0} role="button" aria-expanded={expansion.expanded} onClick={handleCardClick} onKeyDown={handleCardKeyDown}>
    <div className="note-sparkle" aria-hidden="true">✦</div>
    <div className="note-ambient-glow" aria-hidden="true" />
    <button className="note-expand-button" type="button" onClick={event => { event.stopPropagation(); onToggle(); }} aria-label={expansion.label} title={expansion.label}>{expanded ? <Minimize2 size={13} /> : <Expand size={13} />}</button>
    <p className="note-message">“{note.message}”</p>
    {note.hasAudio && <button className={`note-sound-button ${soundOpen ? "playing" : ""}`} type="button" onClick={event => { event.stopPropagation(); void playSound(); }} disabled={soundBusy} aria-label={String(soundBusy ? (copy.audioLoading || "Loading sound…") : soundOpen ? (copy.pauseSound || "Pause the sound") : (copy.playSound || "Play the sound"))}>
      {soundBusy ? <RefreshCw size={13} className="spin" /> : soundOpen ? <Pause size={13} /> : <Play size={13} />}
      <span>{soundBusy ? (copy.audioLoading || "Loading sound…") : soundOpen ? (copy.pauseSound || "Pause the sound") : (copy.playSound || "Play the sound")}</span>
      <b>{Math.max(1, Math.round((Number(note.audioDurationMs || 0) / 1000)))}s</b>
    </button>}
    <audio ref={audioRef} preload="none" onEnded={() => setSoundOpen(false)} aria-label={String(copy.cardSound || "Sound attached to this note")} />
    {soundError && <p className="note-audio-error" role="alert">{soundError}</p>}
    <footer>
      <strong>for {note.recipientName}</strong>
      <span>{t.footer}</span>
      <div className="note-actions">
        <button className={`reaction-button ${hasReacted ? "active" : ""}`} disabled={reactionPresentation.disabled} onClick={onReact} aria-label={reactionPresentation.title} aria-pressed={reactionPresentation.pressed} title={reactionPresentation.title}>
          <Heart size={13} fill="currentColor" /> <span>{reactionPresentation.label}</span>{note.reactionCount ? <b>{note.reactionCount}</b> : null}
        </button>
        <details className="report-details">
          <summary aria-label={String(copy.report || "Report note")} className={hasReported ? "reported" : ""}><Flag size={13} /><span className="report-label">{hasReported ? (copy.reportSent || "Thank you") : (copy.report || "Report note")}</span></summary>
          {!hasReported && <form onSubmit={onReport}>
            <select name="reason" defaultValue="spam"><option value="spam">{copy.reportSpam || "Spam"}</option><option value="harassment">{copy.reportHarassment || "Harassment or abuse"}</option><option value="private">{copy.reportPrivate || "Private information"}</option><option value="impersonation">{copy.reportImpersonation || "Impersonation"}</option><option value="other">{copy.reportOther || "Other"}</option></select>
            <input name="explanation" maxLength={500} placeholder={String(copy.reportExplain || "Optional note")} />
            <button type="submit">{copy.reportSend || "Send"}</button>
          </form>}
        </details>
      </div>
    </footer>
  </article>;
}

export default function Home() {
  const { t } = useLanguage();
  const copy = t as typeof t & Record<string, any>;
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState<number | undefined>();
  const [notes, setNotes] = useState<any[]>([]);
  const [reacted, setReacted] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(reactedStorageKey) || "[]"); } catch { return []; }
  });
  const [reported, setReported] = useState<number[]>([]);
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const notesQuery = trpc.notes.list.useQuery({ search: query.trim() || undefined, cursor, limit: 20 });
  const react = trpc.notes.react.useMutation({
    onSuccess: (result, input) => {
      setNotes(previous => updateReactionCount(previous, input.noteId, result.count));
      setReacted(previous => {
        const next = previous.includes(input.noteId) ? previous.filter(id => id !== input.noteId) : [...previous, input.noteId];
        localStorage.setItem(reactedStorageKey, JSON.stringify(next));
        return next;
      });
    },
  });
  const report = trpc.notes.report.useMutation({
    onSuccess: (_, input) => setReported(previous => previous.includes(input.noteId) ? previous : [...previous, input.noteId]),
  });

  useEffect(() => { setNotes([]); setCursor(undefined); }, [query]);
  useEffect(() => {
    if (!notesQuery.data?.items) return;
    setNotes(previous => cursor ? [...previous, ...notesQuery.data.items] : notesQuery.data.items);
  }, [notesQuery.data, cursor]);

  const clearSearch = () => { setQuery(""); setCursor(undefined); };
  const hasSearch = Boolean(query.trim());
  const archiveState = getArchiveState({ isLoading: notesQuery.isLoading, isError: notesQuery.isError, hasNotes: notes.length > 0 });
  const isInitialLoading = archiveState === "loading";
  const isInitialError = archiveState === "error";

  return <>
    <section className="home-intro container">
      <div className="home-intro-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> {t.homeKicker}</div>
        <h1>{t.homeTitle}</h1>
        <p>{t.homeDesc}</p>
        <Link href="/write" className="button">{t.leave} <ArrowUpRight size={15} /></Link>
      </div>
      <div className="home-intro-art">
        <img src="/quietly-remembered-memory-card.png" alt="" />
        <span>{t.anonymous} <Sparkles size={14} /></span>
      </div>
    </section>

    <section className="feed-section container" aria-labelledby="notes-heading">
      <div className="feed-toolbar">
        <div>
          <div className="section-kicker">{t.collection}</div>
          <h2 id="notes-heading">{t.notesTitle}</h2>
        </div>
        <label className={`search-box ${hasSearch ? "has-value" : ""}`}>
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">{t.search}</span>
          <input value={query} onChange={event => { setQuery(event.target.value); setCursor(undefined); }} placeholder={String(t.search)} />
          {hasSearch && <button type="button" className="clear-search" onClick={clearSearch} aria-label={String(copy.clearSearch || "Clear search")}><X size={14} /></button>}
        </label>
      </div>
      <p className="feed-explainer">{copy.feedExplainer || "This is a living collection. Notes appear here after they are sent and kept gently by the community."}</p>

      {isInitialLoading && <div className="feed-grid" aria-label={String(copy.loading || "Loading the notes…")}><NoteSkeleton /><NoteSkeleton /><NoteSkeleton /></div>}
      {isInitialError && <div className="empty-search error-state"><span>↺</span><h3>{copy.unavailable || "The collection is taking a quiet pause."}</h3><p>{copy.sendError || "Something went wrong. Please try again."}</p><button className="text-link text-button" onClick={() => notesQuery.refetch()}><RefreshCw size={14} /> {copy.retry || "Try again"}</button></div>}
      {!isInitialLoading && !isInitialError && notes.length > 0 && <>
        <div className="feed-status" aria-live="polite">{notesQuery.isFetching && <><RefreshCw size={12} /> {copy.loading || "Loading the notes…"}</>}</div>
        <div className="feed-grid">
          {notes.map((note: any, index: number) => {
            const hasReacted = reacted.includes(note.id);
            const reactionPresentation = getReactionPresentation(hasReacted, String(copy.remembered || "Quietly remembered"), String(copy.remembered || "Remembered"), String(copy.rememberedRemove || "Remove remembered"));
            const hasReported = reported.includes(note.id);
            return <MemoryNoteCard key={note.id} note={note} index={index} t={t} copy={copy} hasReacted={hasReacted} hasReported={hasReported} reactionPresentation={reactionPresentation} expanded={expandedNoteId === note.id} onToggle={() => setExpandedNoteId(previous => previous === note.id ? null : note.id)} onReact={() => react.mutate({ noteId: note.id, anonymousKey: getAnonymousKey() })} onReport={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); report.mutate({ noteId: note.id, reason: String(form.get("reason")) as any, explanation: String(form.get("explanation") || "") || undefined, anonymousKey: getAnonymousKey() }); }} />;
          })}
        </div>
        {notesQuery.data?.nextCursor ? <button className="load-more" disabled={notesQuery.isFetching} onClick={() => setCursor(notesQuery.data?.nextCursor ?? undefined)}>{notesQuery.isFetching ? (copy.loading || "Loading…") : (copy.loadMore || "Load more")}</button> : <p className="collection-end">{copy.collectionEnd || "That is all for now."}</p>}
      </>}
      {!isInitialLoading && !isInitialError && !notes.length && <div className="empty-search"><span>✦</span><h3>{hasSearch ? <>{t.empty} “{query}”</> : (copy.emptyCollection || "No notes have been left yet.")}</h3><p>{hasSearch ? t.emptyDesc : (copy.startCollectionDesc || "You could be the first person to leave a few words here.")}</p><div className="empty-actions">{hasSearch && <button className="text-link text-button" onClick={clearSearch}><X size={14} /> {copy.clearSearch || "Clear search"}</button>}<Link href="/write" className="text-link">{t.writeOne} <ArrowUpRight size={14} /></Link></div></div>}
    </section>
    <section className="home-invitation"><div className="container invitation-inner"><span className="invitation-mark">✦</span><h2>{t.invitation}</h2><Link href="/write" className="text-link">{t.writeAnon} <ArrowUpRight size={14} /></Link></div></section>
  </>;
}
