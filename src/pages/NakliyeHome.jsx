import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CATS } from "../data/categories";
import { LISTINGS } from "../data/listings";
import CategoryIcon from "../components/CategoryIcon";
import SEO from "../components/SEO";

const PERSONAS = [
  {
    id: "muteahhit",
    icon: "🏗️",
    title: "Müteahhit & Alıcı",
    desc: "İş ilanı açın, anlık teklif alın. Şantiyenize belgeli ve puanlı nakliyeciler dakikalar içinde ulaşsın.",
    cta: "Yük bul →",
    ctaRoute: "/muteahhit",
    clr: "var(--accent)",
    bg: "var(--accent-bg)",
    border: "var(--accent-border)",
    chips: ["Müteahhit", "Yapı şirketi", "Alt yüklenici"],
  },
  {
    id: "tedarikci",
    icon: "⛏️",
    title: "Tedarikçi & Ocak",
    desc: "Ürünlerinizi platforma ekleyin. Yüzlerce müteahhite ulaşın, sipariş ve fatura yönetimini dijitale taşıyın.",
    cta: "Ürün ilanı ver →",
    ctaRoute: "/tedarikci",
    clr: "var(--blue)",
    bg: "var(--blue-bg)",
    border: "var(--blue-bg)",
    chips: ["Kırma ocağı", "Beton santrali", "Kum ocağı"],
  },
  {
    id: "nakliyeci",
    icon: "🚚",
    title: "Nakliyeci & Taşıyıcı",
    desc: "Boş sefer yapmayın. Bölgenizdeki yükleri görün, teklif verin, her kilometre kazandırsın.",
    cta: "İş bul →",
    ctaRoute: "/nakliyeci",
    clr: "var(--green)",
    bg: "var(--green-bg)",
    border: "var(--green-bg)",
    chips: ["Damperli araç", "Silobas", "Hafriyat"],
  },
];

export default function NakliyeHome({ listings = LISTINGS }) {
  const navigate = useNavigate();
  const recent = listings.filter(l => l.status !== "kapali").slice(0, 3);

  return (
    <div>
      <SEO description="Hafriyat ve silobas işleri doğru araçla buluşuyor. Müteahhit, tedarikçi ve nakliyeciler için Türkiye'nin yük eşleştirme platformu." />

      {/* Hero */}
      <section style={{ background: "var(--hero-bg)", borderBottom: "1px solid var(--border)" }}>
        <div className="page-content" style={{ paddingTop: 60, paddingBottom: 60, textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent)", background: "var(--accent-bg)", padding: "5px 12px", borderRadius: 20, letterSpacing: 0.3 }}>
              YÜK & ARAÇ EŞLEŞTİRME PLATFORMU
            </span>
            <h1 style={{ fontSize: 40, fontWeight: 900, color: "var(--text)", lineHeight: 1.12, margin: "18px auto 14px", maxWidth: 740, letterSpacing: -1.5 }}>
              Hafriyat ve döküm yük işleri<br />
              <span style={{ color: "var(--accent)" }}>doğru araçla</span> buluşuyor
            </h1>
            <p style={{ fontSize: 16.5, color: "var(--text-sec)", maxWidth: 540, margin: "0 auto 32px", lineHeight: 1.65 }}>
              Müteahhit, tedarikçi ve nakliyeci — üç tarafı tek platformda eşleştiriyoruz. Komisyonsuz, hızlı ve güvenli.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/ilan-ver")} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "15px 28px", borderRadius: 12, fontSize: 15.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px #C85A2440" }}>
                + İlan ver
              </button>
              <button onClick={() => navigate("/ilanlar")} style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)", padding: "15px 28px", borderRadius: 12, fontSize: 15.5, fontWeight: 700, cursor: "pointer" }}>
                İlanlara göz at
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="page-content">

        {/* 3 Persona CTA */}
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", margin: "48px 0 18px" }}>
          Siz hangi taraftasınız?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 52 }}>
          {PERSONAS.map((p, i) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.07 }}
              whileHover={{ y: -5, boxShadow: "var(--shadow-hover)" }}
              style={{ background: "var(--bg-card)", border: `1px solid ${p.border}`, borderRadius: 18, padding: 26, cursor: "pointer", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: 12, transition: "all .25s" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 36, width: 60, height: 60, borderRadius: 14, background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{p.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", lineHeight: 1.2 }}>{p.title}</h3>
              </div>
              <p style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6, flex: 1 }}>{p.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {p.chips.map(c => (
                  <span key={c} style={{ fontSize: 11.5, fontWeight: 600, color: p.clr, background: p.bg, padding: "3px 8px", borderRadius: 6 }}>{c}</span>
                ))}
              </div>
              <button onClick={() => navigate(p.ctaRoute)}
                style={{ alignSelf: "flex-start", background: p.bg, color: p.clr, border: `1px solid ${p.border}`, padding: "9px 18px", borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
                {p.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Yük kategorileri */}
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>Ne taşıyorsun?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 48 }}>
          {CATS.map(c => (
            <motion.div key={c.id} whileHover={{ y: -4 }} onClick={() => navigate("/ilanlar")}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, cursor: "pointer", boxShadow: "var(--shadow)", display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ fontSize: 36, width: 64, height: 64, borderRadius: 14, background: c.clr + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CategoryIcon catId={c.id} size={44} fallback={c.icon} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{c.name}</h3>
                <p style={{ fontSize: 13.5, color: "var(--text-sec)", lineHeight: 1.5 }}>{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Nasıl çalışır */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 48 }}>
          {[
            { n: "1", t: "İlanını yayınla", d: "Yükünü veya boş aracını birkaç dakikada ekle." },
            { n: "2", t: "Teklifleri topla", d: "İlgili nakliyeci ve iş sahiplerinden teklif al." },
            { n: "3", t: "Anlaş, yola çık", d: "En uygun teklifte anlaş, işi başlat." },
          ].map(s => (
            <div key={s.n} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent-bg)", color: "var(--accent)", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>{s.n}</div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{s.t}</h4>
              <p style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.5 }}>{s.d}</p>
            </div>
          ))}
        </div>

        {/* Son ilanlar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)" }}>Son ilanlar</h2>
          <button onClick={() => navigate("/ilanlar")} style={{ background: "transparent", border: "none", color: "var(--accent)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Tümünü gör →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 60 }}>
          {recent.map(l => {
            const cat = CATS.find(c => c.id === l.cat);
            return (
              <motion.div key={l.id} whileHover={{ y: -4 }} onClick={() => navigate(`/ilan/${l.id}`)}
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, cursor: "pointer", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CategoryIcon catId={l.cat} size={20} fallback={cat?.icon} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: l.type === "is" ? "var(--accent)" : "var(--blue)", background: l.type === "is" ? "var(--accent-bg)" : "var(--blue-bg)", padding: "3px 8px", borderRadius: 6 }}>
                    {l.type === "is" ? "İş ilanı" : "Araç"}
                  </span>
                  {l.status === "eslesti" && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", background: "var(--green-bg)", padding: "2px 7px", borderRadius: 6 }}>Eşleşti</span>}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{l.title}</h3>
                <div style={{ fontSize: 12.5, color: "var(--text-sec)" }}>📍 {l.il} / {l.ilce} • {l.amount} {l.unit}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
