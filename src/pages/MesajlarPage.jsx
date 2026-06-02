import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";

function fmtTime(iso) {
  try { return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function MesajlarPage({ user, listings = [], offers = [], messages = [], onSendMessage, onRequireAuth, onSeen }) {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState(null);
  const [text, setText] = useState("");

  // Sayfa acilinca mesajlari okundu isaretle
  useEffect(() => { onSeen?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="page-content" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", paddingTop: 48 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Mesajlar icin giris yapin</h1>
        <p style={{ fontSize: 14.5, color: "var(--text-sec)", marginBottom: 24 }}>Kabul edilen tekliflerde karsi tarafla buradan mesajlasirsiniz.</p>
        <button onClick={() => onRequireAuth?.()} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "13px 24px", borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Giris yap / Kayit ol</button>
      </div>
    );
  }

  // Kabul edilen tekliflerden konusmalar tureti (kullanici taraflardan biri olmali)
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

  const active = conversations.find(c => c.key === selectedKey) || conversations[0] || null;

  const threadMessages = active
    ? messages
        .filter(m => String(m.listingId) === String(active.listingId) && String(m.offerId) === String(active.offerId))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [];

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    onSendMessage?.({
      id: Date.now(),
      listingId: active.listingId,
      offerId: active.offerId,
      fromId: user.id,
      fromName: user.name,
      toId: active.other.id,
      toName: active.other.name,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    });
    setText("");
  };

  return (
    <div className="page-content">
      <SEO title="Mesajlar" description="Eslesen ilanlar uzerinden karsi tarafla mesajlasin." />
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Mesajlar</h1>
      <p style={{ fontSize: 14, color: "var(--text-sec)", marginBottom: 20 }}>Eslesen ilanlar uzerinden karsi tarafla iletisim.</p>

      {conversations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-ter)" }}>
          Henuz mesajlasma yok. Bir teklif kabul edildiginde konusma burada acilir.
          <div style={{ marginTop: 14 }}>
            <button onClick={() => navigate("/ilanlar")} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Ilanlara goz at</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16, alignItems: "start" }} className="mesaj-grid">
          {/* Konusma listesi */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow)" }}>
            {conversations.map(c => {
              const isActive = active && c.key === active.key;
              return (
                <button key={c.key} onClick={() => setSelectedKey(c.key)}
                  style={{ width: "100%", textAlign: "left", padding: "14px 16px", border: "none", borderBottom: "1px solid var(--border-light)", cursor: "pointer",
                    background: isActive ? "var(--accent-bg)" : "transparent" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? "var(--accent)" : "var(--text)" }}>{c.other.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.listingTitle}</div>
                </button>
              );
            })}
          </div>

          {/* Aktif konusma */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", minHeight: 420 }}>
            {active && (
              <>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{active.other.name}</div>
                  <button onClick={() => navigate(`/ilan/${active.listingId}`)} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0 }}>{active.listingTitle} →</button>
                </div>

                <div style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
                  {threadMessages.length === 0 ? (
                    <div style={{ margin: "auto", color: "var(--text-ter)", fontSize: 13.5 }}>Ilk mesaji yazin.</div>
                  ) : (
                    threadMessages.map(m => {
                      const mine = m.fromId === user.id;
                      return (
                        <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                          <div style={{ background: mine ? "var(--accent)" : "var(--bg)", color: mine ? "#fff" : "var(--text)", padding: "9px 13px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.4, border: mine ? "none" : "1px solid var(--border-light)" }}>{m.text}</div>
                          <div style={{ fontSize: 10.5, color: "var(--text-ter)", marginTop: 3, textAlign: mine ? "right" : "left" }}>{fmtTime(m.createdAt)}</div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 14, borderTop: "1px solid var(--border-light)" }}>
                  <input value={text} onChange={e => setText(e.target.value)} placeholder="Mesaj yazin..."
                    style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: 14 }} />
                  <button type="submit" style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "11px 18px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Gonder</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
