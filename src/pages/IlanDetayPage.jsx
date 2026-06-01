import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LISTINGS } from "../data/listings";
import { CATS } from "../data/categories";
import CategoryIcon from "../components/CategoryIcon";

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}>
      <span style={{ fontSize: 13, color: "var(--text-sec)" }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function IlanDetayPage({ listings = LISTINGS, user, onRequireAuth }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
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

  return (
    <div className="page-content">
      <button onClick={() => navigate(-1)} style={{ background: "transparent", border: "none", color: "var(--text-sec)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>
        ← Geri
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 20, alignItems: "start" }} className="ilan-detay-grid">

        {/* Sol kolon: detaylar */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <CategoryIcon catId={l.cat} size={24} fallback={cat?.icon} />
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
              color: l.type === "is" ? "var(--accent)" : "var(--blue)",
              background: l.type === "is" ? "var(--accent-bg)" : "var(--blue-bg)",
              padding: "3px 8px", borderRadius: 6,
            }}>{l.type === "is" ? "Is ilani" : "Arac ilani"}</span>
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

        {/* Sag kolon: ilan sahibi + teklif */}
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
            <div style={{ fontSize: 12.5, color: "var(--text-ter)", marginBottom: 14 }}>{l.offers} teklif geldi</div>
            {sent ? (
              <div style={{ background: "var(--green-bg)", color: "var(--green)", padding: "12px 14px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, textAlign: "center" }}>
                ✓ Teklifiniz iletildi
              </div>
            ) : (
              <button onClick={() => user ? setSent(true) : onRequireAuth?.()} style={{ width: "100%", background: "var(--accent)", color: "#fff", border: "none", padding: "13px", borderRadius: 10, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>
                {user ? (l.type === "is" ? "Teklif ver" : "Iletisime gec") : "Giris yapip teklif ver"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
