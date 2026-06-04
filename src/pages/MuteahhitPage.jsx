import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import { C } from "../utils/theme";

const BENEFITS = [
  { icon: "⚡", title: "Anlık teklif al", desc: "İlanınızı verin, dakikalar içinde belgeli nakliyecilerden fiyat teklifleri gelsin." },
  { icon: "✅", title: "Belgeli & puanlı araçlar", desc: "Yalnızca K belgeli, geçmişi doğrulanmış nakliyecilerle çalışın. Sürpriz yok." },
  { icon: "📦", title: "Her yük tipi", desc: "Hafriyat, moloz, kaya, kum, çakıl, mıcır, çimento — tüm inşaat yükleri tek platformda." },
  { icon: "📋", title: "Dijital irsaliye", desc: "Taşıma belgelerinizi dijital tutun; fatura ve irsaliyelere tek yerden erişin." },
  { icon: "📍", title: "Konum bazlı eşleştirme", desc: "Şantiyenize en yakın boş araçlar öncelikli gösterilir, boş sefer maliyeti sıfıra iner." },
  { icon: "🔁", title: "Tekrarlayan işler", desc: "Uzun süreli şantiyeler için anlaşmalı nakliyeci tanımlayın, her gün ilan açmayın." },
];

const HOW = [
  { n: "1", t: "İlanınızı verin", d: "Yükleme/boşaltma noktası, yük tipi, miktar ve tarihi girin. 2 dakika." },
  { n: "2", t: "Teklifleri karşılaştırın", d: "Nakliyeciler fiyat ve araç bilgileriyle teklif gönderir. Puanlarına bakın." },
  { n: "3", t: "Anlaşın & başlayın", d: "En uygun teklifi kabul edin. Platform iletişimi ve belge takibini kolaylaştırır." },
];

const PERSONAS = [
  { icon: "🏗️", label: "Müteahhit" },
  { icon: "🏢", label: "Yapı şirketi" },
  { icon: "🔨", label: "Alt yüklenici" },
  { icon: "🏙️", label: "Belediye / kamu" },
  { icon: "🏭", label: "Fabrika / sanayi" },
];

export default function MuteahhitPage() {
  const navigate = useNavigate();

  return (
    <div>
      <SEO title="Müteahhit & Alıcı" description="Şantiyeniz için hafriyat ve döküm yük nakliyesi artık çok kolay. Anlık teklif alın, belgeli araçlarla çalışın." />

      {/* Hero */}
      <section style={{ background: "var(--hero-bg)", borderBottom: "1px solid var(--border)" }}>
        <div className="page-content" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
            style={{ maxWidth: 680 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", background: "var(--accent-bg)", padding: "5px 12px", borderRadius: 20, letterSpacing: 0.5 }}>
              MÜTEAHHİT & ALICI
            </span>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: "var(--text)", lineHeight: 1.1, margin: "16px 0 14px", letterSpacing: -1.5 }}>
              Şantiyenize en uygun<br />
              <span style={{ color: "var(--accent)" }}>nakliyeyi dakikada</span> bulun
            </h1>
            <p style={{ fontSize: 17, color: "var(--text-sec)", lineHeight: 1.65, marginBottom: 30, maxWidth: 560 }}>
              Hafriyat, kum, çakıl, mıcır, çimento — inşaat yüklerinizi taşıyacak belgeli ve puanlı nakliyecilere anında ulaşın. Telefon trafiği yok, pazarlık yok, belirsizlik yok.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => navigate("/ilan-ver")} style={{ background: "var(--accent)", color: "var(--accent-text)", border: "none", padding: "15px 28px", borderRadius: 999, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 24px rgba(245,179,1,.35)" }}>
                İlan ver — ücretsiz
              </button>
              <button onClick={() => navigate("/ilanlar")} style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)", padding: "15px 28px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                Boş araçlara bak →
              </button>
            </div>
            {/* Persona chips */}
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
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>3 adımda nakliye ayarlayın</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 52 }}>
          {HOW.map(s => (
            <div key={s.n} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-bg)", color: "var(--accent)", fontWeight: 900, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{s.n}</div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{s.t}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-sec)", lineHeight: 1.55 }}>{s.d}</div>
            </div>
          ))}
        </div>

        {/* CTA bar */}
        <div style={{ background: "var(--accent)", borderRadius: 18, padding: "36px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, marginBottom: 60 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Hemen başlayın — ücretsiz</div>
            <div style={{ fontSize: 14, color: "#ffffff99" }}>Kayıt olun, ilk ilanınızı 2 dakikada verin.</div>
          </div>
          <button onClick={() => navigate("/ilan-ver")} style={{ background: "#fff", color: "var(--accent)", border: "none", padding: "14px 28px", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
            İlan ver →
          </button>
        </div>
      </div>
    </div>
  );
}
