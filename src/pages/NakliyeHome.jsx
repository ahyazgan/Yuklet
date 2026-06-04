import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LISTINGS } from "../data/listings";
import SEO from "../components/SEO";

const PERSONAS = [
  { id: "muteahhit", letter: "M", title: "Müteahhit / Alıcı", desc: "İş ilanı aç, teklif topla", route: "/muteahhit", clr: "var(--accent)", bg: "var(--accent-bg)" },
  { id: "tedarikci", letter: "T", title: "Tedarikçi", desc: "Ocak/santral ürününü listele", route: "/tedarikci", clr: "var(--green)", bg: "var(--green-bg)" },
  { id: "nakliyeci", letter: "N", title: "Nakliyeci", desc: "Araç ilanı ver, yük bul", route: "/nakliyeci", clr: "var(--blue)", bg: "var(--blue-bg)" },
];

const CAT_TAG = {
  hafriyat: { label: "HAFRİYAT", clr: "var(--amber)", bg: "var(--amber-bg)" },
  silobas: { label: "SİLOBAS", clr: "var(--blue)", bg: "var(--blue-bg)" },
};

export default function NakliyeHome({ listings = LISTINGS }) {
  const navigate = useNavigate();
  const featured = listings.filter(l => l.status !== "kapali").slice(0, 4);

  return (
    <div className="app-screen">
      <SEO description="Hafriyat ve silobas işleri doğru araçla buluşuyor. Müteahhit, tedarikçi ve nakliyeciler için Türkiye'nin yük eşleştirme platformu." />

      {/* HERO */}
      <motion.section className="app-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <span className="app-hero-badge">🚛 Türkiye'nin yük borsası</span>
        <h1 className="app-hero-title">Yükünü taşıt,<br />aracını doldur.</h1>
        <p className="app-hero-desc">
          Hafriyat ve silobas yükleri için müteahhit, tedarikçi ve nakliyecileri tek yerde buluşturuyoruz.
        </p>
        <div className="app-search">
          <span style={{ fontSize: 15 }}>🔍</span>
          <input
            placeholder="İl, malzeme veya güzergah ara…"
            onKeyDown={(e) => { if (e.key === "Enter") navigate("/ilanlar"); }}
            aria-label="İlan ara"
          />
          <button className="app-search-btn" onClick={() => navigate("/ilanlar")}>Ara</button>
        </div>
      </motion.section>

      {/* STATS */}
      <div className="app-stats">
        <div className="app-stat"><div className="app-stat-num">2.400+</div><div className="app-stat-label">Aktif ilan</div></div>
        <div className="app-stat"><div className="app-stat-num">850+</div><div className="app-stat-label">Nakliyeci</div></div>
        <div className="app-stat"><div className="app-stat-num">12 sa</div><div className="app-stat-label">Ort. eşleşme</div></div>
      </div>

      {/* PERSONALAR */}
      <section className="app-section">
        <h2 className="app-section-title">Ne yapmak istiyorsun?</h2>
        {PERSONAS.map((p, i) => (
          <motion.button key={p.id} className="app-persona" onClick={() => navigate(p.route)}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}>
            <span className="app-persona-icon" style={{ background: p.bg, color: p.clr }}>{p.letter}</span>
            <span>
              <span className="app-persona-title" style={{ display: "block" }}>{p.title}</span>
              <span className="app-persona-desc" style={{ display: "block" }}>{p.desc}</span>
            </span>
            <span className="app-persona-chev">›</span>
          </motion.button>
        ))}
      </section>

      {/* ONE CIKAN ILANLAR */}
      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-section-title">Öne çıkan ilanlar</h2>
          <button className="app-section-link" onClick={() => navigate("/ilanlar")}>Tümü ›</button>
        </div>
        <div className="app-list">
          {featured.map(l => {
            const tag = CAT_TAG[l.cat] || CAT_TAG.hafriyat;
            const isFixed = l.priceType === "sabit" && l.price;
            return (
              <button key={l.id} className="app-listing" onClick={() => navigate(`/ilan/${l.id}`)}>
                <div className="app-listing-tagrow">
                  <span className="app-tag" style={{ color: tag.clr, background: tag.bg }}>{tag.label}</span>
                  <span className="app-listing-meta">• {l.createdText || "yeni"}</span>
                </div>
                <div className="app-listing-title">{l.title}</div>
                <div className="app-listing-loc">📍 {l.il}{l.ilce ? `, ${l.ilce}` : ""}{l.amount ? ` • ${l.amount} ${l.unit || ""}` : ""}</div>
                <div className="app-listing-foot">
                  <span>
                    <span className="app-price">{isFixed ? `₺${l.price}` : "Teklif"}</span>
                    <span className="app-price-unit"> {isFixed ? (l.unit ? `/${l.unit}` : "") : "usulü"}</span>
                  </span>
                  <span className="app-listing-cta">Teklif ver</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
