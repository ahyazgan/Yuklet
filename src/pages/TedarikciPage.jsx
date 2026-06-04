import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";

const BENEFITS = [
  { icon: "📈", title: "Daha geniş müşteri erişimi", desc: "Yüzlerce müteahhit ve yapı şirketine ulaşın. Sabit müşteri ağınızın ötesine geçin." },
  { icon: "🚚", title: "Nakliye çözümü dahil", desc: "Ürününüzü satan siz, taşıyanı platform bulsun. Müşterinize kapıya teslim hizmeti." },
  { icon: "📋", title: "Dijital fatura & sipariş", desc: "Kağıt irsaliye yok. Tüm siparişlerinizi, faturalarınızı ve ödeme durumlarınızı tek panelde." },
  { icon: "⭐", title: "Marka güvencesi", desc: "Doğrulanmış tedarikçi rozeti ve müşteri puanlarıyla ocağınızın dijital itibarını oluşturun." },
  { icon: "📦", title: "Ürün kataloğu", desc: "Çimento, kum, mıcır, çakıl — tüm ürünlerinizi fiyatla yayınlayın, güncellemesi saniyeler." },
  { icon: "💰", title: "Toplu alım indirimi", desc: "Büyük hacimli siparişler için özel fiyat tanımlayın, kurumsal müşteri çekin." },
];

const HOW = [
  { n: "1", t: "Tedarikçi hesabı açın", d: "Ocak / tesisinizi tanımlayın. Belgelerinizi yükleyin, doğrulanmış rozet alın." },
  { n: "2", t: "Ürün & fiyat girin", d: "Neyi, hangi fiyattan, ne kadar stokla sattığınızı belirtin. Nakliyeli veya teslim." },
  { n: "3", t: "Siparişleri yönetin", d: "Alıcılar teklif verir veya doğrudan sipariş açar. Panelinizdeki akışla yönetin." },
];

const PERSONAS = [
  { icon: "⛏️", label: "Kırma ocağı" },
  { icon: "🏭", label: "Beton santrali" },
  { icon: "🏖️", label: "Doğal kum ocağı" },
  { icon: "🪨", label: "Taş ocağı" },
  { icon: "🏗️", label: "Çimento deposu" },
  { icon: "🌾", label: "Tahıl deposu" },
];

export default function TedarikciPage() {
  const navigate = useNavigate();

  return (
    <div>
      <SEO title="Tedarikçi" description="Kırma ocağı, kum ocağı, beton santrali — ürünlerinizi dijitale taşıyın, daha geniş müşteri kitlesine ulaşın." />

      {/* Hero */}
      <section style={{ background: "var(--hero-bg)", borderBottom: "1px solid var(--border)" }}>
        <div className="page-content" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
            style={{ maxWidth: 680 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", background: "var(--blue-bg)", padding: "5px 12px", borderRadius: 20, letterSpacing: 0.5 }}>
              TEDARİKÇİ & OCAK SAHİBİ
            </span>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: "var(--text)", lineHeight: 1.1, margin: "16px 0 14px", letterSpacing: -1.5 }}>
              Ocağınızı dijitale taşıyın,<br />
              <span style={{ color: "var(--blue)" }}>müşteri tabanınızı</span> büyütün
            </h1>
            <p style={{ fontSize: 17, color: "var(--text-sec)", lineHeight: 1.65, marginBottom: 30, maxWidth: 560 }}>
              Kum, çakıl, mıcır, kırma taş, çimento — ürünlerinizi platforma ekleyin. Yüzlerce müteahhit size ulaşsın. Nakliye sorununu platform çözsün.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => navigate("/ilan-ver")} style={{ background: "var(--blue)", color: "#fff", border: "none", padding: "15px 28px", borderRadius: 999, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 24px #2E6FA340" }}>
                Tedarikçi olarak ilanı ver
              </button>
              <button onClick={() => navigate("/hakkimizda")} style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)", padding: "15px 28px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                Daha fazla bilgi →
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
              {PERSONAS.map(p => (
                <span key={p.label} style={{ fontSize: 13, fontWeight: 600, color: "var(--text-sec)", background: "var(--bg-card)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 20 }}>
                  {p.icon} {p.label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="page-content">
        {/* Faydalar */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: "48px 0 20px" }}>Size ne kazandırır?</h2>
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
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>Nasıl başlarsınız?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 52 }}>
          {HOW.map(s => (
            <div key={s.n} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--blue-bg)", color: "var(--blue)", fontWeight: 900, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{s.n}</div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{s.t}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-sec)", lineHeight: 1.55 }}>{s.d}</div>
            </div>
          ))}
        </div>

        {/* CTA bar */}
        <div style={{ background: "var(--blue)", borderRadius: 18, padding: "36px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, marginBottom: 60 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Ürün ilanı vermek ücretsiz</div>
            <div style={{ fontSize: 14, color: "#ffffff99" }}>Hesap oluşturun, ürünlerinizi dakikada ekleyin.</div>
          </div>
          <button onClick={() => navigate("/ilan-ver")} style={{ background: "#fff", color: "var(--blue)", border: "none", padding: "14px 28px", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
            Hemen başla →
          </button>
        </div>
      </div>
    </div>
  );
}
