import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";

function fmtTime(iso) {
  try { return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function MesajlarPage({ user, listings = [], offers = [], messages = [], onSendMessage, onRequireAuth, onSeen, getContact }) {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState(null);
  const [text, setText] = useState("");

  useEffect(() => { onSeen?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="app-screen" style={{ textAlign: "center", paddingTop: 48 }}>
        <SEO title="Mesajlar" />
        <div style={{ fontSize: 44 }}>🔒</div>
        <h1 className="app-hero-title" style={{ fontSize: 22 }}>Mesajlar için giriş yapın</h1>
        <p style={{ fontSize: 14, color: "var(--text-sec)" }}>Kabul edilen tekliflerde karşı tarafla buradan mesajlaşırsınız.</p>
        <button onClick={() => onRequireAuth?.()} className="app-search-btn" style={{ alignSelf: "center", padding: "13px 24px", fontSize: 15, borderRadius: 11 }}>Giriş yap / Kayıt ol</button>
      </div>
    );
  }

  const conversations = offers
    .filter(o => o.status === "kabul")
    .map(o => {
      const l = listings.find(x => String(x.id) === String(o.listingId));
      if (!l) return null;
      const ownerSide = { id: l.ownerId, name: l.owner };
      const offerSide = { id: o.fromUserId, name: o.fromUser };
      if (user.id !== ownerSide.id && user.id !== offerSide.id) return null;
      const other = user.id === ownerSide.id ? offerSide : ownerSide;
      return { key: `${o.listingId}:${o.id}`, listingId: l.id, offerId: o.id, listingTitle: l.title, other };
    })
    .filter(Boolean);

  const active = conversations.find(c => c.key === selectedKey) || null;
  const otherPhone = active && getContact ? getContact(active.other.id)?.phone : null;

  const threadMessages = active
    ? messages
        .filter(m => String(m.listingId) === String(active.listingId) && String(m.offerId) === String(active.offerId))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [];

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    onSendMessage?.({
      id: Date.now(), listingId: active.listingId, offerId: active.offerId,
      fromId: user.id, fromName: user.name, toId: active.other.id, toName: active.other.name,
      text: text.trim(), createdAt: new Date().toISOString(),
    });
    setText("");
  };

  // ── Aktif sohbet (tam ekran) ──
  if (active) {
    return (
      <div className="app-screen" style={{ gap: 0 }}>
        <SEO title="Mesajlar" />
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
          <button onClick={() => setSelectedKey(null)} style={{ background: "transparent", border: "none", color: "var(--text)", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{active.other.name}</div>
            <button onClick={() => navigate(`/ilan/${active.listingId}`)} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>{active.listingTitle} ›</button>
          </div>
          {otherPhone && <a href={`tel:${otherPhone}`} style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", textDecoration: "none" }}>📞</a>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 0", minHeight: "45vh" }}>
          {threadMessages.length === 0 ? (
            <div style={{ margin: "auto", color: "var(--text-ter)", fontSize: 13.5 }}>İlk mesajı yazın.</div>
          ) : (
            threadMessages.map(m => {
              const mine = m.fromId === user.id;
              return (
                <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                  <div style={{ background: mine ? "var(--accent)" : "var(--bg-card)", color: mine ? "#fff" : "var(--text)", padding: "10px 14px", borderRadius: 14, borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4, fontSize: 13.5, lineHeight: 1.45, border: mine ? "none" : "1px solid var(--border)" }}>{m.text}</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-ter)", marginTop: 3, textAlign: mine ? "right" : "left" }}>{fmtTime(m.createdAt)}</div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={send} className="app-search" style={{ position: "sticky", bottom: 8, paddingLeft: 16 }}>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Mesaj yazın…" aria-label="Mesaj" />
          <button type="submit" className="app-search-btn">Gönder</button>
        </form>
      </div>
    );
  }

  // ── Konusma listesi ──
  return (
    <div className="app-screen">
      <SEO title="Mesajlar" description="Eşleşen ilanlar üzerinden karşı tarafla mesajlaşın." />
      <h1 className="app-hero-title" style={{ fontSize: 26 }}>Mesajlar</h1>

      {conversations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <div className="empty-title">Henüz mesajlaşma yok</div>
          <div className="empty-desc">Bir teklif kabul edildiğinde konuşma burada açılır.</div>
          <button onClick={() => navigate("/ilanlar")} className="app-search-btn" style={{ marginTop: 14, padding: "11px 20px" }}>İlanlara göz at</button>
        </div>
      ) : (
        <div className="app-list">
          {conversations.map(c => (
            <button key={c.key} className="app-persona" onClick={() => setSelectedKey(c.key)}>
              <span className="app-persona-icon" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                {c.other.name?.[0]?.toUpperCase() || "?"}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="app-persona-title" style={{ display: "block" }}>{c.other.name}</span>
                <span className="app-persona-desc" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.listingTitle}</span>
              </span>
              <span className="app-persona-chev">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
