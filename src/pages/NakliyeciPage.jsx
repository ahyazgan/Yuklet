import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import CategoryIcon from "../components/CategoryIcon";

const BENEFITS = [
  { icon: "📭", title: "Boş sefer yok", desc: "Bölgenizdeki yükleri önceden görün. Boş dönüş yerine iş alın, kilometre başı kazancınızı artırın." },
  { icon: "⚡", title: "Anında iş eşleştirme", desc: "İş ilanları anlık güncellenir. Sabah ilan veren müteahhit, öğleden önce araç bulabilir — siz o araçsınız." },
  { icon: "📄", title: "Dijital irsaliye", desc: "Kağıt takip yok. Taşıma belgelerinizi telefonda görün, saklayın, gönderin." },
  { icon: "⭐", title: "Puan & güven", desc: "İyi iş çıkardıkça puanınız artar. Yüksek puanlı nakliyeciler daha fazla iş, daha iyi fiyat alır." },
  { icon: "💵", title: "Teklif verin, fiyat siz belirleyin", desc: "Platform fiyat dikte etmez. Kendi fiyatınızı teklif edin, iş sahibiyle doğrudan anlaşın." },
  { icon: "🔁", title: "Düzenli iş anlaşmaları", desc: "Uzun süreli şantiyelerde anlaşmalı nakliyeci olun. Sabit iş, sabit gelir." },
];

const HOW = [
  { n: "1", t: "Araç ilanınızı açın", d: "Araç tipinizi, kapasiteyi, bölgenizi ve müsaitliğinizi belirtin. 2 dakika." },
  { n: "2", t: "İş ilanlarına teklif verin", d: "Size uygun yükleri filtreleyin. Fiyat teklifinizi ve mesajınızı gönderin." },
  { n: "3", t: "Anlaşın, yola çıkın", d: "Teklif kabul edilince iş sahibiyle iletişime geçin, belgeleri dijital yönetin." },
];

const VEHICLES = [
  { icon: "🚛", label: "Damperli kamyon", sub: "5–25 ton" },
  { icon: "🚚", label: "Kırk ayak / 4 dingil", sub: "30 ton+" },
  { icon: "🛢️", label: "Silobas", sub: "Çimento / tahıl / kimyasal" },
  { icon: "⛟", label: "Tanker", sub: "Sıvı / kimyasal" },
  { icon: "🚜", label: "Mini damper", sub: "Traktör römork" },
  { icon: "📦", label: "Dökme yük dorsesi", sub: "Açık / kapalı kasa" },
];

export default function NakliyeciPage() {
  const navigate = useNavigate();

  return (
    <div>
      <SEO title="Nakliyeci & Taşıyıcı" description="Boş sefer yapmayın. Hafriyat ve döküm yük işlerini bulun, anında teklif verin, daha fazla kazanın." />

      {/* Hero */}
      <section style={{ background: "var(--hero-bg)", borderBottom: "1px solid var(--border)" }}>
        <div className="page-content" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
            style={{ maxWidth: 680 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", background: "var(--green-bg)", padding: "5px 12px", borderRadius: 20, letterSpacing: 0.5 }}>
              NAKLİYECİ & TAŞIYICI
            </span>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: "var(--text)", lineHeight: 1.1, margin: "16px 0 14px", letterSpacing: -1.5 }}>
              Boş sefer yapmayın,<br />
              <span style={{ color: "var(--green)" }}>her kilometre</span> kazandırsın
            </h1>
            <p style={{ fontSize: 17, color: "var(--text-sec)", lineHeight: 1.65, marginBottom: 30, maxWidth: 560 }}>
              Bölgenizdeki hafriyat ve döküm yük işlerini anlık görün. Teklif verin, iş sahibiyle doğrudan anlaşın. Boş dönüş yok, kayıp kilometre yok.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => navigate("/ilan-ver")} style={{ background: "var(--green)", color: "#fff", border: "none", padding: "15px 28px", borderRadius: 999, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 24px #2E7D4240" }}>
                Araç ilanı ver — ücretsiz
              </button>
              <button onClick={() => navigate("/ilanlar")} style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)", padding: "15px 28px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                İş ilanlarına bak →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="page-content">
        {/* Araç tipleri */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: "48px 0 20px" }}>Hangi araçla çalışıyorsunuz?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 52 }}>
          {VEHICLES.map(v => (
            <motion.div key={v.label} whileHover={{ y: -3, borderColor: "var(--green)" }}
              onClick={() => navigate("/ilan-ver")}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 16px", cursor: "pointer", boxShadow: "var(--shadow)", display: "flex", alignItems: "center", gap: 12, transition: "border-color .2s" }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{v.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{v.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{v.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* İki kategori */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>Ne taşıyabilirsiniz?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 52 }}>
          {[
            { catId: "hafriyat", title: "Hafriyat", color: "var(--accent)", bg: "var(--accent-bg)", desc: "Toprak, moloz, kaya, kırıntı, asfalt frezeleme — inşaat sahasından döküm sahasına." },
            { catId: "silobas", title: "Silobas & Döküme", color: "var(--blue)", bg: "var(--blue-bg)", desc: "Çimento, kum, çakıl, mıcır, tahıl, kimyasal granül — silobas ve tanker araçlar için." },
          ].map(c => (
            <div key={c.catId} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <CategoryIcon catId={c.catId} size={36} fallback={c.catId === "hafriyat" ? "🚛" : "🛢️"} />
                <span style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.title}</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6 }}>{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Faydalar */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>Size ne kazandırır?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 52 }}>
          {BENEFITS.map(b => (
            <motion.div key={b.title} whileHover={{ y: -3 }}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{b.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{b.title}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-sec)", lineHeight: 1.55 }}>{b.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Nasıl çalışır */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>3 adımda iş bulun</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 52 }}>
          {HOW.map(s => (
            <div key={s.n} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--green-bg)", color: "var(--green)", fontWeight: 900, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{s.n}</div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{s.t}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-sec)", lineHeight: 1.55 }}>{s.d}</div>
            </div>
          ))}
        </div>

        {/* CTA bar */}
        <div style={{ background: "var(--green)", borderRadius: 18, padding: "36px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, marginBottom: 60 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Araç ilanınızı bugün açın</div>
            <div style={{ fontSize: 14, color: "#ffffff99" }}>Kayıt ve ilan ücretsiz. Anlaştığınızda komisyon yok.</div>
          </div>
          <button onClick={() => navigate("/ilan-ver")} style={{ background: "#fff", color: "var(--green)", border: "none", padding: "14px 28px", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
            Araç ilanı ver →
          </button>
        </div>
      </div>
    </div>
  );
}
