import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CATS } from "../data/categories";
import { LISTINGS } from "../data/listings";
import CategoryIcon from "../components/CategoryIcon";

export default function NakliyeHome({ listings = LISTINGS }) {
  const navigate = useNavigate();
  const recent = listings.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section style={{ background: "var(--hero-bg)", borderBottom: "1px solid var(--border)" }}>
        <div className="page-content" style={{ paddingTop: 56, paddingBottom: 56, textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent)", background: "var(--accent-bg)", padding: "5px 12px", borderRadius: 20, letterSpacing: 0.3 }}>
              YUK & ARAC ESLESTIRME PLATFORMU
            </span>
            <h1 style={{ fontSize: 38, fontWeight: 800, color: "var(--text)", lineHeight: 1.15, margin: "18px auto 14px", maxWidth: 720, letterSpacing: -1 }}>
              Hafriyat ve silobas isleri <span style={{ color: "var(--accent)" }}>dogru aracla</span> bulusuyor
            </h1>
            <p style={{ fontSize: 16, color: "var(--text-sec)", maxWidth: 560, margin: "0 auto 28px", lineHeight: 1.6 }}>
              Yukunu yayinla, nakliyeci teklifini al. Bos aracin varsa is bul. Komisyonsuz, hizli ve guvenli.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/ilan-ver")} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "14px 26px", borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px #C85A2440" }}>
                + Ilan ver
              </button>
              <button onClick={() => navigate("/ilanlar")} style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)", padding: "14px 26px", borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                Ilanlara goz at
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="page-content">
        {/* Kategoriler */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>Ne tasiyorsun?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 44 }}>
          {CATS.map(c => (
            <motion.div key={c.id} whileHover={{ y: -4 }} onClick={() => navigate(`/ilanlar`)}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, cursor: "pointer", boxShadow: "var(--shadow)", display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: c.clr + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CategoryIcon catId={c.id} size={48} fallback={c.icon} />
              </div>
              <div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{c.name}</h3>
                <p style={{ fontSize: 13.5, color: "var(--text-sec)", lineHeight: 1.5 }}>{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Nasil calisir */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 44 }}>
          {[
            { n: "1", t: "Ilanini yayinla", d: "Yuku veya bos aracini birkac dakikada ekle." },
            { n: "2", t: "Teklifleri topla", d: "Ilgili nakliyeci ve is sahiplerinden teklif al." },
            { n: "3", t: "Anlas, yola cik", d: "En uygun teklifte anlas, isi baslat." },
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
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>Son ilanlar</h2>
          <button onClick={() => navigate("/ilanlar")} style={{ background: "transparent", border: "none", color: "var(--accent)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Tumunu gor →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 50 }}>
          {recent.map(l => {
            const cat = CATS.find(c => c.id === l.cat);
            return (
              <motion.div key={l.id} whileHover={{ y: -4 }} onClick={() => navigate(`/ilan/${l.id}`)}
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, cursor: "pointer", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CategoryIcon catId={l.cat} size={20} fallback={cat?.icon} />
                  <span style={{
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: l.type === "is" ? "var(--accent)" : "var(--blue)", background: l.type === "is" ? "var(--accent-bg)" : "var(--blue-bg)", padding: "3px 8px", borderRadius: 6
                  }}>
                    {l.type === "is" ? "Is ilani" : "Arac"}
                  </span>
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
