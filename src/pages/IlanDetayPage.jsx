import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LISTINGS } from "../data/listings";
import { CATS } from "../data/categories";
import { useToast } from "../components/Toast";
import SEO from "../components/SEO";

const CAT_TAG = {
  hafriyat: { label: "HAFRİYAT", clr: "var(--amber)", bg: "var(--amber-bg)" },
  silobas: { label: "SİLOBAS", clr: "var(--blue)", bg: "var(--blue-bg)" },
};
const STATUS_STYLE = {
  beklemede: { label: "Beklemede", clr: "var(--amber)", bg: "var(--amber-bg)" },
  kabul: { label: "Kabul edildi", clr: "var(--green)", bg: "var(--green-bg)" },
  ret: { label: "Reddedildi", clr: "var(--red)", bg: "var(--accent-bg)" },
};

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="spec-row">
      <span className="spec-label">{label}</span>
      <span className="spec-value">{value}</span>
    </div>
  );
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, boxShadow: "var(--shadow)" };

export default function IlanDetayPage({ listings = LISTINGS, user, onRequireAuth, offers = [], onAddOffer }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

  const l = listings.find(x => String(x.id) === String(id));

  if (!l) {
    return (
      <div className="app-screen" style={{ textAlign: "center", paddingTop: 60 }}>
        <div className="empty-icon">📭</div>
        <h1 className="empty-title">İlan bulunamadı</h1>
        <p className="empty-desc">Bu ilan kaldırılmış veya hiç var olmamış olabilir.</p>
        <button className="app-listing-cta" style={{ alignSelf: "center", padding: "11px 20px" }} onClick={() => navigate("/ilanlar")}>Tüm ilanlar</button>
      </div>
    );
  }

  const cat = CATS.find(c => c.id === l.cat);
  const tag = CAT_TAG[l.cat] || CAT_TAG.hafriyat;
  const listingOffers = offers.filter(o => String(o.listingId) === String(l.id));
  const isOwner = user && l.ownerId && l.ownerId === user.id;
  const isFixed = l.priceType === "sabit" && l.price;
  const closed = l.status === "kapali" || l.status === "eslesti";

  const submitOffer = () => {
    if (!user) { onRequireAuth?.(); return; }
    if (!price && !message.trim()) { toast("Fiyat veya mesaj girin", "error"); return; }
    onAddOffer?.({
      id: Date.now(), listingId: l.id, fromUser: user.name, fromUserId: user.id,
      price: price ? Number(price) : null, message: message.trim(),
      status: "beklemede", createdAt: new Date().toISOString(),
    });
    setPrice(""); setMessage("");
    toast("Teklifiniz iletildi", "success");
  };

  return (
    <div className="app-screen">
      <SEO title={l.title} description={l.desc || `${cat?.name} ilanı - ${l.il} / ${l.ilce}`} />

      <button onClick={() => navigate(-1)} style={{ alignSelf: "flex-start", background: "transparent", border: "none", color: "var(--text-sec)", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: -8 }}>
        ← Geri
      </button>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Baslik karti */}
        <div style={cardStyle}>
          <div className="app-listing-tagrow" style={{ marginBottom: 10 }}>
            <span className="app-tag" style={{ color: tag.clr, background: tag.bg }}>{tag.label}</span>
            <span className="app-tag" style={{ color: l.type === "is" ? "var(--accent)" : "var(--blue)", background: l.type === "is" ? "var(--accent-bg)" : "var(--blue-bg)" }}>
              {l.type === "is" ? "İŞ İLANI" : "ARAÇ İLANI"}
            </span>
            {l.status === "eslesti" && <span className="app-tag" style={{ color: "var(--green)", background: "var(--green-bg)" }}>✓ EŞLEŞTİ</span>}
            <span className="app-listing-meta" style={{ marginLeft: "auto" }}>{l.createdText}</span>
          </div>
          <h1 className="app-hero-title" style={{ fontSize: 22, lineHeight: 1.25 }}>{l.title}</h1>
          <div className="app-listing-loc" style={{ marginTop: 8 }}>📍 {l.il}{l.ilce ? `, ${l.ilce}` : ""}</div>
          <div className="app-listing-loc" style={{ marginTop: 6, gap: 8 }}>
            <span style={{ fontWeight: 700, color: "var(--text)" }}>{l.owner}</span>
            {l.ownerVerified && <span style={{ color: "var(--green)", fontWeight: 700 }}>✓ Onaylı</span>}
            {l.ownerRating && <span style={{ color: "var(--amber)" }}>★ {l.ownerRating}</span>}
          </div>
        </div>

        {/* Fiyat + teklif aksiyonu */}
        <div style={cardStyle}>
          <div className="app-price" style={{ fontSize: 28 }}>{isFixed ? `₺${l.price.toLocaleString("tr-TR")}` : "Teklife açık"}</div>
          <div className="app-listing-meta" style={{ marginTop: 2, marginBottom: 14 }}>{listingOffers.length} teklif geldi</div>

          {isOwner ? (
            <div style={{ background: "var(--blue-bg)", color: "var(--blue)", padding: "12px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, textAlign: "center" }}>
              Bu sizin ilanınız.
              <button onClick={() => navigate("/ilanlarim")} style={{ display: "block", margin: "8px auto 0", background: "var(--blue)", color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Teklifleri yönet</button>
            </div>
          ) : closed ? (
            <div style={{ background: "var(--bg)", color: "var(--text-sec)", padding: "12px 14px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, textAlign: "center" }}>
              {l.status === "eslesti" ? "Bu ilan eşleşti, yeni teklif alınmıyor." : "Bu ilan kapatıldı, yeni teklif alınmıyor."}
            </div>
          ) : !user ? (
            <button onClick={() => onRequireAuth?.()} className="app-search-btn" style={{ width: "100%", padding: 13, fontSize: 14.5, borderRadius: 10 }}>
              Giriş yapıp teklif ver
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input className="form-input form-input-lg" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="Teklif fiyatınız (₺)" />
              <textarea className="form-input form-textarea" style={{ minHeight: 80 }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Mesajınız (müsaitlik, araç, koşullar…)" />
              <button onClick={submitOffer} className="app-search-btn" style={{ width: "100%", padding: 13, fontSize: 14.5, borderRadius: 10 }}>Teklif gönder</button>
            </div>
          )}
        </div>

        {/* Aciklama */}
        {l.desc && (
          <div style={cardStyle}>
            <h2 className="app-section-title" style={{ fontSize: 15, marginBottom: 8 }}>Açıklama</h2>
            <p style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.7, margin: 0 }}>{l.desc}</p>
          </div>
        )}

        {/* Detaylar */}
        <div className="detail-specs">
          <Row label="Kategori" value={cat?.name} />
          <Row label="Konum" value={`${l.il}${l.ilce ? " / " + l.ilce : ""}`} />
          <Row label="Yükleme" value={l.yukleme} />
          <Row label="Boşaltma" value={l.bosaltma} />
          <Row label="Malzeme" value={l.material} />
          <Row label="Miktar" value={l.amount ? `${l.amount} ${l.unit || ""}` : null} />
          <Row label="Araç" value={l.vehicle} />
          <Row label="Kapasite" value={l.capacity} />
          <Row label="Tarih" value={l.dateText} />
          {l.recurring && <Row label="Tekrar" value={l.recurringText} />}
        </div>

        {/* Gelen teklifler */}
        <div style={cardStyle}>
          <h2 className="app-section-title" style={{ fontSize: 16, marginBottom: 12 }}>Gelen teklifler ({listingOffers.length})</h2>
          {listingOffers.length === 0 ? (
            <p style={{ fontSize: 13.5, color: "var(--text-ter)", margin: 0 }}>Henüz teklif yok. İlk teklifi siz verin.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {listingOffers.map(o => {
                const s = STATUS_STYLE[o.status] || STATUS_STYLE.beklemede;
                return (
                  <div key={o.id} style={{ border: "1px solid var(--border-light)", borderRadius: 10, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{o.fromUser}</span>
                      <span className="app-tag" style={{ color: s.clr, background: s.bg }}>{s.label}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13.5, color: "var(--text-sec)" }}>{o.message || "—"}</span>
                      {o.price != null && <span style={{ fontSize: 15, fontWeight: 800, color: "var(--accent)", whiteSpace: "nowrap" }}>₺{o.price.toLocaleString("tr-TR")}</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-ter)", marginTop: 6 }}>{fmtDate(o.createdAt)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
