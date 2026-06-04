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

// MoveIQ tarzi kamyon gorselleri
const TRUCK_DARK = "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400";
const TRUCK_LIGHT = "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=400";

const TRACK_STEPS = ["İlan", "Teklif", "Kabul", "Yolda"];

export default function NakliyeHome({ listings = LISTINGS }) {
  const navigate = useNavigate();
  const open = listings.filter(l => l.status !== "kapali");

  // kartlar icin ilan secimi
  const trackJob = open.find(l => l.type === "is") || open[0];
  const cargo = open.find(l => l.type === "arac") || open.find(l => l !== trackJob) || open[0];
  const recent = listings.find(l => l.status === "kapali" || l.status === "eslesti")
    || open.find(l => l !== trackJob && l !== cargo) || open[0];
  const rest = open.filter(l => l !== trackJob && l !== cargo).slice(0, 3);

  // takip kartinin ilerleme adimi (teklif geldiyse 2. adim)
  const onCount = trackJob ? (trackJob.offers > 0 ? 2 : 1) : 1;
  const fillPct = ((onCount - 1) / (TRACK_STEPS.length - 1)) * 100;

  const idText = (l) => "HMT-" + String(l.id).padStart(4, "0");

  return (
    <div className="app-screen">
      <SEO description="Hafriyat ve silobas işleri doğru araçla buluşuyor. Müteahhit, tedarikçi ve nakliyeciler için Türkiye'nin yük eşleştirme platformu." />

      {/* UST BAR */}
      <div className="app-topbar">
        <div>
          <p className="app-topbar-greet">İyi çalışmalar 👋</p>
          <p className="app-topbar-name">HamTed</p>
        </div>
        <button className="app-icon-btn" onClick={() => navigate("/mesajlar")} aria-label="Bildirimler">
          🔔<span className="app-icon-dot" />
        </button>
      </div>

      {/* ARAMA */}
      <div className="app-search">
        <span style={{ fontSize: 15 }}>🔍</span>
        <input
          placeholder="İl, malzeme veya güzergah ara…"
          onKeyDown={(e) => { if (e.key === "Enter") navigate("/ilanlar"); }}
          aria-label="İlan ara"
        />
        <button className="app-search-btn" onClick={() => navigate("/ilanlar")}>Ara</button>
      </div>

      {/* LACIVERT TAKIP KARTI */}
      {trackJob && (
        <motion.div className="track-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="track-head">
            <div style={{ minWidth: 0 }}>
              <p className="track-eyebrow">Öne çıkan iş</p>
              <h3 className="track-title">{trackJob.title}</h3>
              <p className="track-id">No · {idText(trackJob)} · {trackJob.offers || 0} teklif</p>
            </div>
            <button className="track-badge" onClick={() => navigate(`/ilan/${trackJob.id}`)}>Takip et</button>
          </div>

          <div className="track-prog">
            <div className="track-prog-line" />
            <div className="track-prog-fill" style={{ width: `${fillPct}%` }} />
            {TRACK_STEPS.map((_, i) => (
              <span key={i} className={`track-dot${i < onCount ? " on" : ""}`} />
            ))}
          </div>
          <div className="track-steps">
            {TRACK_STEPS.map((s, i) => (
              <span key={s} className={`track-step${i < onCount ? " on" : ""}`}>{s}</span>
            ))}
          </div>

          <div className="track-ends">
            <div className="track-end from">
              <p className="track-end-label">Yükleme</p>
              <p className="track-end-city">{trackJob.il}</p>
              <p className="track-end-date">{trackJob.yukleme || trackJob.ilce || "—"}</p>
            </div>
            <div className="track-end to">
              <p className="track-end-label">Boşaltma</p>
              <p className="track-end-city">{trackJob.bosaltma ? trackJob.bosaltma.split(",")[0] : (trackJob.ilce || "Saha")}</p>
              <p className="track-end-date">{trackJob.dateText || "—"}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ISTATISTIK */}
      <div className="app-stats">
        <div className="app-stat"><div className="app-stat-num">2.400+</div><div className="app-stat-label">Aktif ilan</div></div>
        <div className="app-stat"><div className="app-stat-num">850+</div><div className="app-stat-label">Nakliyeci</div></div>
        <div className="app-stat"><div className="app-stat-num">12 sa</div><div className="app-stat-label">Ort. eşleşme</div></div>
      </div>

      {/* MUSAIT ARAC / KARGO KARTI */}
      {cargo && (
        <section className="app-section">
          <div className="app-section-head">
            <h2 className="app-section-title">{cargo.type === "arac" ? "Müsait araç" : "Öne çıkan yük"}</h2>
            <button className="app-section-link" onClick={() => navigate("/ilanlar")}>Tümü ›</button>
          </div>
          <button className="cargo-card" onClick={() => navigate(`/ilan/${cargo.id}`)}>
            <div className="cargo-info">
              <span className="cargo-badge">{cargo.type === "arac" ? "Müsait" : (CAT_TAG[cargo.cat]?.label || "İlan")}</span>
              <div>
                <p className="cargo-name-label">{cargo.type === "arac" ? "Araç" : "Malzeme"}</p>
                <h5 className="cargo-name">{cargo.type === "arac" ? (cargo.vehicle || cargo.title) : (cargo.material || cargo.title)}</h5>
              </div>
              <div className="cargo-meta">
                <div>
                  <p className="cargo-meta-label">{cargo.priceType === "sabit" && cargo.price ? "Fiyat" : "Durum"}</p>
                  <p className="cargo-meta-val">{cargo.priceType === "sabit" && cargo.price ? `₺${cargo.price}` : "Teklif"}</p>
                </div>
                <div>
                  <p className="cargo-meta-label">{cargo.type === "arac" ? "Kapasite" : "Miktar"}</p>
                  <p className="cargo-meta-val">{cargo.type === "arac" ? (cargo.capacity || "—") : `${cargo.amount || "—"} ${cargo.unit || ""}`}</p>
                </div>
              </div>
            </div>
            <img className="cargo-img" src={TRUCK_DARK} alt="Araç" loading="lazy" />
          </button>
        </section>
      )}

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

      {/* SON ILAN — SARI KART */}
      {recent && (
        <section className="app-section">
          <div className="app-section-head">
            <h2 className="app-section-title">Son ilanlar</h2>
            <button className="app-section-link" onClick={() => navigate("/ilanlar")}>Tümü ›</button>
          </div>
          <button className="recent-card" onClick={() => navigate(`/ilan/${recent.id}`)}>
            <div className="recent-info">
              <span className="recent-badge">{recent.status === "kapali" ? "Tamamlandı" : recent.status === "eslesti" ? "Eşleşti" : "Yayında"}</span>
              <div>
                <p className="recent-date">{recent.createdText || recent.dateText || "yeni"}</p>
                <p className="recent-id">{recent.title}</p>
              </div>
            </div>
            <img className="recent-img" src={TRUCK_LIGHT} alt="İlan" loading="lazy" />
          </button>

          {/* diger ilanlar listesi */}
          <div className="app-list" style={{ marginTop: 4 }}>
            {rest.map(l => {
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
      )}
    </div>
  );
}
