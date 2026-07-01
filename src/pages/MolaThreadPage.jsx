import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ShieldCheck, MessageSquare, Trash2, Send, Coffee } from "lucide-react";
import { useToast } from "../components/Toast";
import SEO from "../components/SEO";
import Logo from "../components/Logo";

// ── SAHA Mola Forum — başlık detayı + yorumlar + yorum yazma.
//    Tüm nakliyeciler yorum yazar; başlık sahibi/admin siler.

const C = {
  ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA", border: "#E3DDD0", line: "#F0ECE3",
  sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const ARCHIVO = "'Archivo', system-ui, sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const shell = { width: "100%", maxWidth: 460, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: C.bg };
const cardSt = { background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 14, boxShadow: "3px 3px 0 rgba(10,10,10,.12)" };

function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
function fmtDateTime(iso) {
  try { return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function MolaThreadPage({ user, threads = [], replies = [], onFetchReplies, onFetchThread, onAddReply, onRemoveReply, onRemoveThread, onRequireAuth }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelThread, setConfirmDelThread] = useState(false);
  const [confirmDelReply, setConfirmDelReply] = useState(null);

  const listThread = useMemo(() => threads.find((t) => String(t.id) === String(id)), [threads, id]);
  // Cold-launch/deep link: liste henüz boşsa başlığı id ile tek tek çek — aksi halde
  // "Başlık bulunamadı" sahte ekranı görünürdü (liste async yüklenene kadar).
  const [fetchedThread, setFetchedThread] = useState(undefined); // undefined=yükleniyor, null=yok
  useEffect(() => {
    if (listThread || !onFetchThread) return;   // listede var ya da yerel mod
    let alive = true;
    onFetchThread(id).then((t) => { if (alive) setFetchedThread(t || null); }).catch(() => { if (alive) setFetchedThread(null); });
    return () => { alive = false; };
  }, [id, listThread, onFetchThread]);
  const thread = listThread || fetchedThread || null;
  // SB modunda başlık ne listede ne de fetch ile geldi mi henüz belli değil → yükleniyor.
  const threadLoading = !listThread && onFetchThread && fetchedThread === undefined;

  // SB modunda yorumları DB'den çek; yereldeyse App'ten gelen replies'i filtrele.
  const [fetched, setFetched] = useState(null);
  useEffect(() => {
    if (!onFetchReplies) return;   // yerel mod: App state'inden gelir
    let alive = true;
    onFetchReplies(id).then((r) => { if (alive) setFetched(r || []); }).catch(() => { if (alive) setFetched([]); });
    return () => { alive = false; };
  }, [id, onFetchReplies]);
  // App state'inde bu başlığa ait yorumlar (anlık eklenenleri de yansıtır).
  const localReplies = useMemo(() => replies.filter((r) => String(r.threadId) === String(id)), [replies, id]);
  // Birleştir: SB fetch + App state (id'ye göre tekille, kronolojik).
  const threadReplies = useMemo(() => {
    const map = new Map();
    (fetched || []).forEach((r) => map.set(String(r.id), r));
    localReplies.forEach((r) => map.set(String(r.id), r));
    return [...map.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [fetched, localReplies]);

  // ── Gate: giriş / rol ──
  if (!user) {
    return (
      <div style={shell}>
        <SEO title="Mola — Forum" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <Logo size="lg" />
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Giriş gerekli</h1>
          <button onClick={() => onRequireAuth?.()} style={{ marginTop: 4, background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 22px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>Giriş yap</button>
        </div>
      </div>
    );
  }
  // Başlık henüz yükleniyorsa (cold-launch/deep link) not-found gösterme, bekle.
  if (user.role === "nakliyeci" && threadLoading) {
    return (
      <div style={shell}>
        <SEO title="Mola — Forum" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Coffee size={30} color={C.yellow} strokeWidth={2.2} />
          </div>
          <p style={{ fontFamily: ARCHIVO, fontSize: 14, fontWeight: 700, color: C.sub, margin: 0 }}>Başlık yükleniyor…</p>
        </div>
      </div>
    );
  }
  if (user.role !== "nakliyeci" || !thread) {
    return (
      <div style={shell}>
        <SEO title="Mola — Forum" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Coffee size={30} color={C.yellow} strokeWidth={2.2} />
          </div>
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>{user.role !== "nakliyeci" ? "Nakliyecilere özel" : "Başlık bulunamadı"}</h1>
          <button onClick={() => navigate("/mola")} style={{ marginTop: 4, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 20px", fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>Mola Yeri</button>
        </div>
      </div>
    );
  }

  const isOwner = String(thread.ownerId) === String(user.id);
  const send = async () => {
    if (busy) return;
    if (!text.trim()) return;
    setBusy(true);
    const res = await onAddReply?.(thread.id, text.trim());
    setBusy(false);
    if (res && res.ok === false) { toast(res.error || "Gönderilemedi", "error"); return; }
    setText("");
    if (onFetchReplies) onFetchReplies(id).then(setFetched).catch(() => {});
  };
  const delThread = async () => {
    setConfirmDelThread(false);
    const res = await onRemoveThread?.(thread.id);
    if (res && res.ok === false) { toast(res.error || "Silinemedi", "error"); return; }
    toast("Başlık silindi", "info");
    navigate("/mola");
  };
  const delReply = async (rid) => {
    setConfirmDelReply(null);
    const res = await onRemoveReply?.(rid, thread.id);
    if (res && res.ok === false) { toast(res.error || "Silinemedi", "error"); return; }
    setFetched((prev) => (prev ? prev.filter((r) => r.id !== rid) : prev));
  };

  return (
    <div style={shell}>
      <SEO title={`${thread.title} — Mola Forum`} />

      {/* Header */}
      <div style={{ background: C.ink, padding: "14px 18px", color: "#fff", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 14, backgroundImage: HAZARD }} />
        <button onClick={() => navigate("/mola")} aria-label="Geri" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: "transparent", border: "2px solid rgba(255,255,255,0.25)", borderRadius: 6, color: "#fff", cursor: "pointer", flexShrink: 0 }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 16, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>Forum</h1>
          <div style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{thread.replyCount || threadReplies.length} yorum</div>
        </div>
      </div>
      <div style={{ height: 8, backgroundImage: HAZARD }} />

      <div style={{ flex: 1, padding: "16px 16px 120px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Başlık kartı */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={cardSt}>
          <h2 style={{ fontFamily: ARCHIVO, fontSize: 17, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.01em", margin: 0, lineHeight: 1.2 }}>{thread.title}</h2>
          {thread.body && <p style={{ fontSize: 13.5, color: C.sub, margin: "10px 0 0", lineHeight: 1.55 }}>{thread.body}</p>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 12, paddingTop: 11, borderTop: `1.5px solid ${C.line}` }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 11, color: C.ink, fontWeight: 700 }}>
              {thread.ownerName}{thread.ownerVerified && <ShieldCheck size={13} strokeWidth={2.4} color={C.green} />}
              <span style={{ color: C.faint, fontWeight: 400 }}>· {fmtDateTime(thread.createdAt)}</span>
            </span>
            {isOwner && (
              confirmDelThread ? (
                <span style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setConfirmDelThread(false)} style={{ background: C.card, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "5px 9px", fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>Vazgeç</button>
                  <button onClick={delThread} style={{ background: C.red, color: "#fff", border: `2px solid ${C.red}`, borderRadius: 5, padding: "5px 9px", fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>Sil</button>
                </span>
              ) : (
                <button onClick={() => setConfirmDelThread(true)} aria-label="Başlığı sil" style={{ background: "none", border: "none", color: C.red, cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={16} strokeWidth={2.2} /></button>
              )
            )}
          </div>
        </motion.div>

        {/* Yorumlar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          <MessageSquare size={15} strokeWidth={2.4} color={C.ink} />
          <span style={{ fontFamily: ARCHIVO, fontSize: 12, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.01em" }}>Yorumlar ({threadReplies.length})</span>
        </div>

        {threadReplies.length === 0 ? (
          <p style={{ fontFamily: MONO, fontSize: 11.5, color: C.faint, margin: "2px 2px", lineHeight: 1.5 }}>Henüz yorum yok — ilk yazan sen ol.</p>
        ) : (
          threadReplies.map((r) => {
            const mine = String(r.ownerId) === String(user.id);
            return (
              <div key={r.id} style={{ ...cardSt, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 5, background: C.yellow, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ARCHIVO, fontSize: 12, fontWeight: 900, color: C.ink }}>{initials(r.ownerName)}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 11, color: C.ink, fontWeight: 700 }}>
                      {r.ownerName}{r.ownerVerified && <ShieldCheck size={12} strokeWidth={2.4} color={C.green} />}
                    </span>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, flexShrink: 0 }}>{fmtDateTime(r.createdAt)}</span>
                  {mine && (
                    confirmDelReply === r.id ? (
                      <span style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                        <button onClick={() => setConfirmDelReply(null)} style={{ background: C.card, color: C.ink, border: `1.5px solid ${C.ink}`, borderRadius: 4, padding: "3px 6px", fontFamily: MONO, fontSize: 9, fontWeight: 700, cursor: "pointer" }}>İptal</button>
                        <button onClick={() => delReply(r.id)} style={{ background: C.red, color: "#fff", border: `1.5px solid ${C.red}`, borderRadius: 4, padding: "3px 6px", fontFamily: MONO, fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Sil</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDelReply(r.id)} aria-label="Yorumu sil" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", flexShrink: 0, display: "flex" }}><Trash2 size={13} strokeWidth={2.2} /></button>
                    )
                  )}
                </div>
                <p style={{ fontSize: 13.5, color: C.ink, margin: "9px 0 0", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{r.body}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Yorum yazma kutusu — sabit alt (tab bar üstünde) */}
      <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 460, zIndex: 40, padding: "10px 12px", background: C.card, borderTop: `2px solid ${C.ink}`, display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={500} placeholder="Yorum yaz…"
          style={{ flex: 1, boxSizing: "border-box", background: C.stone, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 12px", fontSize: 14, color: C.ink, outline: "none", fontFamily: MONO, resize: "none", maxHeight: 90, lineHeight: 1.4 }} />
        <button onClick={send} disabled={busy || !text.trim()} aria-label="Gönder"
          style={{ flexShrink: 0, width: 46, height: 44, background: text.trim() ? C.yellow : C.stone, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: text.trim() && !busy ? "pointer" : "default", opacity: busy ? 0.6 : 1 }}>
          <Send size={18} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
