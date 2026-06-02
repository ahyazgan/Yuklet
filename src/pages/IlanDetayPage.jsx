import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LISTINGS } from "../data/listings";
import { CATS } from "../data/categories";
import CategoryIcon from "../components/CategoryIcon";
import { useToast } from "../components/Toast";
import SEO from "../components/SEO";

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}>
      <span style={{ fontSize: 13, color: "var(--text-sec)" }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

const STATUS_STYLE = {
  beklemede: { label: "Beklemede", clr: "var(--amber)", bg: "var(--amber-bg)" },
  kabul: { label: "Kabul edildi", clr: "var(--green)", bg: "var(--green-bg)" },
  ret: { label: "Reddedildi", clr: "var(--red)", bg: "var(--accent-bg)" },
};

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function IlanDetayPage({ listings = LISTINGS, user, onRequireAuth, offers = [], onAddOffer }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

  const l = listings.find(x => String(x.id) === String(id));

  if (!l) {
    return (
      <div className="page-content" style={{ textAlign: "center", padding: "80px 20px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Ilan bulunamadi</h1>
        <p style={{ color: "var(--text-sec)", marginBottom: 20 }}>Bu ilan kaldirilmis veya hic var olmamis olabilir.</p>
        <button onClick={() => navigate("/ilanlar")} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "11px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Tum ilanlar</button>
      </div>
    );
  }

  const cat = CATS.find(c => c.id === l.cat);
  const listingOffers = offers.filter(o => String(o.listingId) === String(l.id));
  const isOwner = user && l.ownerId && l.ownerId === user.id;

  const submitOffer = (e) => {
    e.preventDefault();
    if (!user) { onRequireAuth?.(); return; }
    if (!price && !message.trim()) { toast("Fiyat veya mesaj girin", "error"); return; }
    const offer = {
      id: Date.now(),
      listingId: l.id,
      fromUser: user.name,
      fromUserId: user.id,
      price: price ? Number(price) : null,
      message: message.trim(),
      status: "beklemede",
      createdAt: new Date().toISOString(),
    };
    onAddOffer?.(offer);
    setPrice(""); setMessage("");
    toast("Teklifiniz iletildi", "success");
  };

  const field = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: 14 };

  return (
    <div className="page-content">
      <SEO title={l.title} description={l.desc || `${cat?.name} ilani - ${l.il} / ${l.ilce}`} />
      <button onClick={() => navigate(-1)} style={{ background: "transparent", border: "none", color: "var(--text-sec)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>
        ← Geri
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: "grid", gap: 20, alignItems: "start" }} className="ilan-detay-grid">

        {/* Sol kolon: detaylar + gelen teklifler */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <CategoryIcon catId={l.cat} size={24} fallback={cat?.icon} />
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
                color: l.type === "is" ? "var(--accent)" : "var(--blue)",
                background: l.type === "is" ? "var(--accent-bg)" : "var(--blue-bg)",
                padding: "3px 8px", borderRadius: 6,
              }}>{l.type === "is" ? "Is ilani" : "Arac ilani"}</span>
              {l.status === "eslesti" && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", background: "var(--green-bg)", padding: "3px 8px", borderRadius: 6 }}>✓ Eslesti</span>
              )}
              <span style={{ fontSize: 11.5, color: "var(--text-ter)", marginLeft: "auto" }}>{l.createdText}</span>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", lineHeight: 1.3, marginBottom: 14 }}>{l.title}</h1>

            <p style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 18 }}>{l.desc}</p>

            <Row label="Kategori" value={cat?.name} />
            <Row label="Konum" value={`${l.il} / ${l.ilce}`} />
            <Row label="Yukleme" value={l.yukleme} />
            <Row label="Bosaltma" value={l.bosaltma} />
            <Row label="Malzeme" value={l.material} />
            <Row label="Miktar" value={`${l.amount} ${l.unit}`} />
            <Row label="Arac" value={l.vehicle} />
            <Row label="Kapasite" value={l.capacity} />
            <Row label="Tarih" value={l.dateText} />
            {l.recurring && <Row label="Tekrar" value={l.recurringText} />}
            <Row label="Fiyat" value={l.priceType === "sabit" ? `${l.price.toLocaleString("tr-TR")} ₺` : "Teklife acik"} />
          </div>

          {/* Gelen teklifler */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, boxShadow: "var(--shadow)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 14 }}>
              Gelen teklifler ({listingOffers.length})
            </h2>
            {listingOffers.length === 0 ? (
              <p style={{ fontSize: 13.5, color: "var(--text-ter)" }}>Henuz teklif yok. Ilk teklifi siz verin.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {listingOffers.map(o => {
                  const s = STATUS_STYLE[o.status] || STATUS_STYLE.beklemede;
                  return (
                    <div key={o.id} style={{ border: "1px solid var(--border-light)", borderRadius: 10, padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{o.fromUser}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: s.clr, background: s.bg, padding: "3px 8px", borderRadius: 6 }}>{s.label}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13.5, color: "var(--text-sec)" }}>{o.message || "—"}</span>
                        {o.price != null && <span style={{ fontSize: 15, fontWeight: 800, color: "var(--accent)", whiteSpace: "nowrap" }}>{o.price.toLocaleString("tr-TR")} ₺</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-ter)", marginTop: 6 }}>{fmtDate(o.createdAt)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sag kolon: ilan sahibi + teklif ver */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 11.5, color: "var(--text-ter)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Ilan sahibi</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{l.owner}</span>
              {l.ownerVerified && <span title="Dogrulanmis" style={{ color: "var(--blue)" }}>✓</span>}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-sec)" }}>⭐ {l.ownerRating} puan</div>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", marginBottom: 4 }}>
              {l.priceType === "sabit" ? `${l.price.toLocaleString("tr-TR")} ₺` : "Teklife acik"}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-ter)", marginBottom: 14 }}>{listingOffers.length} teklif geldi</div>

            {isOwner ? (
              <div style={{ background: "var(--blue-bg)", color: "var(--blue)", padding: "12px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, textAlign: "center" }}>
                Bu sizin ilaniniz.<br />
                <button onClick={() => navigate("/ilanlarim")} style={{ marginTop: 8, background: "var(--blue)", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Teklifleri yonet</button>
              </div>
            ) : !user ? (
              <button onClick={() => onRequireAuth?.()} style={{ width: "100%", background: "var(--accent)", color: "#fff", border: "none", padding: "13px", borderRadius: 10, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>
                Giris yapip teklif ver
              </button>
            ) : (
              <form onSubmit={submitOffer} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input style={field} type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="Teklif fiyatiniz (₺)" />
                <textarea style={{ ...field, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Mesajiniz (musaitlik, arac, kosullar...)" />
                <button type="submit" style={{ width: "100%", background: "var(--accent)", color: "#fff", border: "none", padding: "13px", borderRadius: 10, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>
                  Teklif gonder
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
