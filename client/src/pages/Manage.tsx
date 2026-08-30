import { useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, LockKeyhole, Trash2 } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { trpc } from "../lib/trpc";

export default function Manage() {
  const { t } = useLanguage(); const copy = t as typeof t & Record<string, any>;
  const [, params] = useRoute("/manage/:token"); const token = params?.token || ""; const [done, setDone] = useState(false);
  const note = trpc.notes.manageGet.useQuery({ token }, { enabled: Boolean(token) });
  const remove = trpc.notes.manageDelete.useMutation({ onSuccess: () => setDone(true) });
  const deleteNote = () => { if (window.confirm(String(copy.deleteConfirm || "Delete this note permanently?"))) remove.mutate({ token, confirm: true }); };
  return <section className="subpage manage-page container"><Link href="/" className="back-link"><ArrowLeft size={14}/> {t.back}</Link><div className="manage-shell"><div className="section-kicker">{copy.manage || "Private note link"}</div>{done?<><h1>{copy.deleteSuccess || "This note has been quietly removed."}</h1><Link className="button button-quiet" href="/">{t.collection} ↗</Link></>:note.isLoading?<h1>{copy.loading || "Loading…"}</h1>:!note.data?<><h1>{copy.invalidManage || "This private link is no longer valid."}</h1><p>{copy.manageHint || "This link may have expired or already been used."}</p></>:<><h1>{copy.manageNoteTitle || "Your note"}</h1><article className={`memory-note note-${note.data.paperColor}`}><p>“{note.data.message}”</p><footer><strong>for {note.data.recipientName}</strong><span><LockKeyhole size={13}/> {copy.manage || "Private management"}</span></footer></article><button className="quiet-delete" onClick={deleteNote} disabled={remove.isPending}><Trash2 size={15}/> {copy.deleteNote || "Delete this note"}</button></>}</div></section>;
}
