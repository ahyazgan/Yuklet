import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, BadgeCheck, Phone, Plus, Send, Truck } from "lucide-react";
import { newId, nowIso } from "../utils/id";
import SEO from "../components/SEO";

// ── SAHA messages view (inline-style shell, C palette, Space Mono context).

const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  green: "#16803C",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  line: "#F0ECE3",
  sub: "#5A5852",
  muted: "#9A968D",
  faint: "#A8A39A",
};
const MONO = "'Space Mono','SFMono-Regular',Menlo,Consolas,monospace";
const SANS = "'Plus Jakarta Sans',system-ui,sans-serif";

const shell = {
  margin: "0 auto",
  width: "100%",
  maxWidth: 460,
  minHeight: "100vh",
  background: C.bg,
  color: C.ink,
  fontFamily: SANS,
  display: "flex",
  flexDirection: "column",
};

function fmtTime(iso) {
  try { return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

// Build initials from a name (max 2 chars).
function initials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function MesajlarPage({ user, listings = [], offers = [], messages = [], onSendMessage, onRequireAuth, onSeen, getContact }) {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState(null);
  const [text, setText] = useState("");

  useEffect(() => { onSeen?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Not authenticated ──
  if (!user) {
    return (
      <div style={{ ...shell, paddingBottom: 96 }}>
        <SEO title="Mesajlar" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 28px", gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: C.header, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Send size={26} color={C.ink} strokeWidth={2.2} />
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Mesajlar için giriş yapın</h1>
          <p style={{ fontSize: 13.5, color: C.sub, margin: 0, lineHeight: 1.5 }}>Kabul edilen tekliflerde karşı tarafla buradan mesajlaşırsınız.</p>
          <button
            onClick={() => onRequireAuth?.()}
            style={{ marginTop: 6, border: "none", cursor: "pointer", background: C.ink, color: "#fff", fontFamily: SANS, fontSize: 14, fontWeight: 700, padding: "13px 22px", borderRadius: 999 }}
          >
            Giriş yap / Kayıt ol
          </button>
        </div>
      </div>
    );
  }

  // ── Derive conversations from accepted offers ──
  const conversations = offers
    .filter((o) => o.status === "kabul")
    .map((o) => {
      const l = listings.find((x) => String(x.id) === String(o.listingId));
      if (!l) return null;
      const ownerSide = { id: l.ownerId, name: l.owner };
      const offerSide = { id: o.fromUserId, name: o.fromUser };
      if (user.id !== ownerSide.id && user.id !== offerSide.id) return null;
      const other = user.id === ownerSide.id ? offerSide : ownerSide;
      return { key: `${o.listingId}:${o.id}`, listingId: l.id, offerId: o.id, listingTitle: l.title, other };
    })
    .filter(Boolean);

  const active = conversations.find((c) => c.key === selectedKey) || null;
  const otherPhone = active && getContact ? getContact(active.other.id)?.phone : null;

  const threadMessages = active
    ? messages
        .filter((m) => String(m.listingId) === String(active.listingId) && String(m.offerId) === String(active.offerId))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [];

  // Last message preview for a conversation row.
  const lastMessageOf = (c) => {
    const ms = messages
      .filter((m) => String(m.listingId) === String(c.listingId) && String(m.offerId) === String(c.offerId))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (ms.length === 0) return { preview: "—", time: "" };
    const last = ms[ms.length - 1];
    const preview = last.image ? "📷 Görsel" : (last.text || "—");
    return { preview, time: fmtTime(last.createdAt) };
  };

  const send = () => {
    if (!text.trim() || !active) return;
    onSendMessage?.({
      id: newId(), listingId: active.listingId, offerId: active.offerId,
      fromId: user.id, fromName: user.name, toId: active.other.id, toName: active.other.name,
      text: text.trim(), createdAt: nowIso(),
    });
    setText("");
  };

  const sendImage = (e) => {
    const f = e.target.files?.[0];
    if (!f || !active) return;
    if (f.size > 1_800_000) { e.target.value = ""; return; } // ~1.8MB limit
    const reader = new FileReader();
    reader.onload = () => onSendMessage?.({
      id: newId(), listingId: active.listingId, offerId: active.offerId,
      fromId: user.id, fromName: user.name, toId: active.other.id, toName: active.other.name,
      text: "", image: reader.result, createdAt: nowIso(),
    });
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  // ── Thread view (active conversation) ──
  if (active) {
    return (
      <div style={{ ...shell, paddingBottom: 96 }}>
        <SEO title="Mesajlar" />

        {/* Header */}
        <div style={{ background: C.header, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setSelectedKey(null)}
            aria-label="Geri"
            style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <ChevronLeft size={20} color={C.ink} strokeWidth={2.4} />
          </button>

          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: C.ink, color: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, fontFamily: MONO }}>
              {initials(active.other.name)}
            </div>
            <span style={{ position: "absolute", right: -1, bottom: -1, width: 11, height: 11, borderRadius: 999, background: C.green, border: "2px solid " + C.header }} />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{active.other.name}</span>
              <BadgeCheck size={15} color={C.green} strokeWidth={2.4} style={{ flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>çevrimiçi</div>
          </div>

          {otherPhone && (
            <a
              href={`tel:${otherPhone}`}
              aria-label="Ara"
              style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
            >
              <Phone size={18} color={C.green} strokeWidth={2.2} />
            </a>
          )}
        </div>

        {/* Listing context bar */}
        <button
          onClick={() => navigate(`/ilan/${active.listingId}`)}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", border: "none", cursor: "pointer", textAlign: "left", background: C.ink, color: "#fff", padding: "11px 16px" }}
        >
          <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: "rgba(250,204,21,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Truck size={15} color={C.yellow} strokeWidth={2.2} />
          </div>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{active.listingTitle}</span>
          <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: C.yellow }}>İlanı gör ›</span>
        </button>

        {/* Messages */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, padding: "16px 16px 20px", overflowY: "auto" }}>
          {threadMessages.length === 0 ? (
            <div style={{ margin: "auto", fontSize: 13, color: C.muted }}>İlk mesajı yazın.</div>
          ) : (
            threadMessages.map((m) => {
              const mine = m.fromId === user.id;
              return (
                <div key={m.id} style={{ maxWidth: "80%", alignSelf: mine ? "flex-end" : "flex-start", display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      padding: m.image && !m.text ? 4 : "10px 13px",
                      fontSize: 14,
                      lineHeight: 1.4,
                      borderRadius: 16,
                      borderBottomRightRadius: mine ? 5 : 16,
                      borderBottomLeftRadius: mine ? 16 : 5,
                      background: mine ? C.yellow : C.card,
                      color: C.ink,
                      border: mine ? "none" : `1px solid ${C.border}`,
                      fontWeight: 500,
                    }}
                  >
                    {m.image && (
                      <img src={m.image} alt="Görsel" style={{ display: "block", maxHeight: 220, maxWidth: "100%", borderRadius: 12, objectFit: "cover", marginBottom: m.text ? 6 : 0 }} />
                    )}
                    {m.text}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10.5, color: C.faint }}>{fmtTime(m.createdAt)}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Input bar */}
        <div style={{ position: "sticky", bottom: 0, background: C.bg, padding: "10px 16px 14px", borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 5 }}>
            <label
              aria-label="Fotoğraf ekle"
              style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 11, background: C.stone, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Plus size={20} color={C.sub} strokeWidth={2.4} />
              <input type="file" accept="image/*" onChange={sendImage} style={{ display: "none" }} />
            </label>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
              placeholder="Mesaj yaz…"
              aria-label="Mesaj"
              style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: SANS, fontSize: 14, color: C.ink }}
            />
            <button
              onClick={send}
              aria-label="Gönder"
              style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: "none", cursor: "pointer", background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Send size={18} color={C.ink} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List view (conversations) ──
  const newCount = conversations.length;

  return (
    <div style={{ ...shell, paddingBottom: 96 }}>
      <SEO title="Mesajlar" description="Eşleşen ilanlar üzerinden karşı tarafla mesajlaşın." />

      {/* Header */}
      <div style={{ background: C.header, padding: "18px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>Mesajlar</h1>
          {newCount > 0 && (
            <span style={{ fontSize: 11.5, fontWeight: 800, color: C.ink, background: C.yellow, padding: "5px 11px", borderRadius: 999 }}>
              {newCount} yeni
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "11px 13px" }}>
          <Search size={17} color={C.muted} strokeWidth={2.2} />
          <span style={{ fontSize: 13.5, color: C.muted, fontWeight: 500 }}>Konuşmalarda ara</span>
        </div>
      </div>

      {/* Body */}
      {conversations.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 28px", gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: C.header, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Send size={26} color={C.ink} strokeWidth={2.2} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>Henüz mesajlaşma yok</div>
          <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.5 }}>Bir teklif kabul edildiğinde konuşma burada açılır.</div>
          <button
            onClick={() => navigate("/ilanlar")}
            style={{ marginTop: 6, border: "none", cursor: "pointer", background: C.yellow, color: C.ink, fontFamily: SANS, fontSize: 13, fontWeight: 800, padding: "11px 20px", borderRadius: 999 }}
          >
            İlanlara göz at
          </button>
        </div>
      ) : (
        <div style={{ padding: "12px 12px 4px", display: "flex", flexDirection: "column", gap: 9 }}>
          {conversations.map((c) => {
            const { preview, time } = lastMessageOf(c);
            return (
              <button
                key={c.key}
                onClick={() => setSelectedKey(c.key)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", border: `1px solid ${C.border}`, cursor: "pointer", background: C.card, borderRadius: 16, padding: 13 }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: C.ink, color: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, fontFamily: MONO }}>
                    {initials(c.other.name)}
                  </div>
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.other.name}</span>
                    {time && <span style={{ flexShrink: 0, fontSize: 10.5, color: C.faint, fontWeight: 600 }}>{time}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{c.listingTitle}</div>
                  <div style={{ fontSize: 13, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{preview}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
