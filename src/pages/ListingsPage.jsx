import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LISTINGS, IL_LIST } from "../data/listings";
import { CATS } from "../data/categories";
import SEO from "../components/SEO";

const CAT_TAG = {
  hafriyat: { label: "HAFRİYAT", clr: "var(--amber)", bg: "var(--amber-bg)" },
  silobas: { label: "SİLOBAS", clr: "var(--blue)", bg: "var(--blue-bg)" },
};

function ListingCard({ l, onClick }) {
  const tag = CAT_TAG[l.cat] || CAT_TAG.hafriyat;
  const isFixed = l.priceType === "sabit" && l.price;
  return (
    <motion.button className="app-listing" onClick={onClick}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <div className="app-listing-tagrow">
        <span className="app-tag" style={{ color: tag.clr, background: tag.bg }}>{tag.label}</span>
        <span className="app-tag" style={{ color: l.type === "is" ? "var(--accent)" : "var(--blue)", background: l.type === "is" ? "var(--accent-bg)" : "var(--blue-bg)" }}>
          {l.type === "is" ? "İŞ İLANI" : "ARAÇ"}
        </span>
        {l.status === "eslesti" && <span className="app-tag" style={{ color: "var(--green)", background: "var(--green-bg)" }}>EŞLEŞTİ</span>}
        <span className="app-listing-meta">• {l.createdText}</span>
      </div>
      <div className="app-listing-title">{l.title}</div>
      <div className="app-listing-loc">📍 {l.il}{l.ilce ? `, ${l.ilce}` : ""}{l.amount ? ` • ${l.amount} ${l.unit || ""}` : ""}</div>
      <div className="app-listing-loc" style={{ gap: 8 }}>
        <span style={{ fontWeight: 600, color: "var(--text)" }}>{l.owner}</span>
        {l.ownerVerified && <span style={{ color: "var(--green)", fontWeight: 700 }}>✓ Onaylı</span>}
        {l.ownerRating && <span style={{ color: "var(--amber)" }}>★ {l.ownerRating}</span>}
      </div>
      <div className="app-listing-foot">
        <span>
          <span className="app-price">{isFixed ? `₺${l.price.toLocaleString("tr-TR")}` : "Teklif"}</span>
          <span className="app-price-unit"> {isFixed ? (l.unit ? `/${l.unit}` : "") : "usulü"}</span>
        </span>
        <span className="app-listing-cta">Teklif ver</span>
      </div>
    </motion.button>
  );
}

export default function ListingsPage({ listings = LISTINGS }) {
  const navigate = useNavigate();
  const [type, setType] = useState("all");   // all | is | arac
  const [cat, setCat] = useState("all");      // all | hafriyat | silobas
  const [il, setIl] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return listings.filter(l =>
      l.status !== "kapali" &&
      (type === "all" || l.type === type) &&
      (cat === "all" || l.cat === cat) &&
      (il === "all" || l.il === il) &&
      (q === "" || l.title.toLowerCase().includes(q.toLowerCase()) || (l.ilce || "").toLowerCase().includes(q.toLowerCase()))
    );
  }, [listings, type, cat, il, q]);

  return (
    <div className="app-screen">
      <SEO title="İlanlar" description="Hafriyat ve silobas iş ve araç ilanları. Konuma, kategoriye ve türüne göre filtreleyin." />

      <h1 className="app-hero-title" style={{ fontSize: 26 }}>İlanlar</h1>

      {/* arama */}
      <div className="app-search" style={{ marginTop: -8 }}>
        <span style={{ fontSize: 15 }}>🔍</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="İl, malzeme veya güzergah ara…" aria-label="İlan ara" />
      </div>

      {/* segment Is/Arac */}
      <div className="app-segment">
        <button className={type === "is" || type === "all" ? "active" : ""} onClick={() => setType("is")}>İş ilanları</button>
        <button className={type === "arac" ? "active" : ""} onClick={() => setType("arac")}>Araç ilanları</button>
      </div>

      {/* kategori chip */}
      <div className="app-chips">
        <button className={`app-chip ${cat === "all" ? "app-chip-active" : ""}`} onClick={() => setCat("all")}>Tümü</button>
        {CATS.map(c => (
          <button key={c.id} className={`app-chip ${cat === c.id ? "app-chip-active" : ""}`} onClick={() => setCat(c.id)}>{c.name}</button>
        ))}
      </div>

      {/* il chip (kaydirilabilir) */}
      <div className="app-chips" style={{ flexWrap: "nowrap", overflowX: "auto", paddingBottom: 4 }}>
        <button className={`app-chip ${il === "all" ? "app-chip-active" : ""}`} onClick={() => setIl("all")} style={{ flexShrink: 0 }}>Tüm iller</button>
        {IL_LIST.map(i => (
          <button key={i} className={`app-chip ${il === i ? "app-chip-active" : ""}`} onClick={() => setIl(i)} style={{ flexShrink: 0 }}>{i}</button>
        ))}
      </div>

      <div className="app-listing-meta" style={{ marginTop: -4 }}>{filtered.length} ilan bulundu</div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">İlan bulunamadı</div>
          <div className="empty-desc">Filtreleri değiştirip tekrar dene.</div>
        </div>
      ) : (
        <div className="app-list">
          {filtered.map(l => (
            <ListingCard key={l.id} l={l} onClick={() => navigate(`/ilan/${l.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
