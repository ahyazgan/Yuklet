import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LISTINGS, IL_LIST } from "../data/listings";
import { CATS, LISTING_TYPES } from "../data/categories";
import SEO from "../components/SEO";
import CategoryIcon from "../components/CategoryIcon";

function ListingCard({ l, onClick }) {
  const cat = CATS.find(c => c.id === l.cat);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }} transition={{ duration: 0.3 }}
      onClick={onClick}
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14, padding: 18, cursor: "pointer",
        boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CategoryIcon catId={l.cat} size={20} fallback={cat?.icon} />
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
            color: l.type === "is" ? "var(--accent)" : "var(--blue)",
            background: l.type === "is" ? "var(--accent-bg)" : "var(--blue-bg)",
            padding: "3px 8px", borderRadius: 6,
          }}>{l.type === "is" ? "Is ilani" : "Arac"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {l.status === "eslesti" && <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--green)", background: "var(--green-bg)", padding: "2px 7px", borderRadius: 6 }}>Eslesti</span>}
          <span style={{ fontSize: 11, color: "var(--text-ter)" }}>{l.createdText}</span>
        </div>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{l.title}</h3>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 12.5, color: "var(--text-sec)" }}>
        <span>📍 {l.il} / {l.ilce}</span>
        <span>•</span>
        <span>{l.amount} {l.unit}</span>
        <span>•</span>
        <span>📅 {l.dateText}</span>
      </div>

      {l.recurring && (
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--green)", background: "var(--green-bg)", border: "1px solid var(--green)", padding: "4px 10px", borderRadius: 6, alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 4 }}>
          🔁 {l.recurringText || (l.recurringFreq === "gunluk" ? "Günlük" : l.recurringFreq === "aylik" ? "Aylık" : "Düzenli iş")}
        </span>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, paddingTop: 10, borderTop: "1px solid var(--border-light)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-sec)" }}>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>{l.owner}</span>
          {l.ownerVerified && <span title="Dogrulanmis" style={{ color: "var(--blue)" }}>✓</span>}
          <span>⭐ {l.ownerRating}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
          {l.priceType === "sabit" ? `${l.price.toLocaleString("tr-TR")} ₺` : "Teklif al"}
        </div>
      </div>

      {l.offers > 0 && (
        <div style={{ fontSize: 11.5, color: "var(--text-ter)" }}>{l.offers} teklif geldi</div>
      )}
    </motion.div>
  );
}

export default function ListingsPage({ listings = LISTINGS }) {
  const navigate = useNavigate();
  const [type, setType] = useState("all");      // all | is | arac
  const [cat, setCat] = useState("all");         // all | hafriyat | silobas
  const [il, setIl] = useState("all");
  const [q, setQ] = useState("");
  const [onlyRecurring, setOnlyRecurring] = useState(false);

  const filtered = useMemo(() => {
    return listings.filter(l =>
      l.status !== "kapali" &&
      (type === "all" || l.type === type) &&
      (cat === "all" || l.cat === cat) &&
      (il === "all" || l.il === il) &&
      (!onlyRecurring || l.recurring) &&
      (q === "" || l.title.toLowerCase().includes(q.toLowerCase()) || l.ilce.toLowerCase().includes(q.toLowerCase()))
    );
  }, [listings, type, cat, il, q]);

  const chip = (active) => ({
    padding: "7px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600,
    border: "1px solid " + (active ? "var(--accent)" : "var(--border)"),
    background: active ? "var(--accent-bg)" : "var(--bg-card)",
    color: active ? "var(--accent)" : "var(--text-sec)", cursor: "pointer",
  });

  return (
    <div className="page-content">
      <SEO title="Ilanlar" description="Hafriyat ve silobas is ve arac ilanlari. Konuma, kategoriye ve turune gore filtreleyin." />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)" }}>Ilanlar</h1>
          <p style={{ fontSize: 14, color: "var(--text-sec)", marginTop: 2 }}>
            Hafriyat ve silobas isleri — {filtered.length} aktif ilan
          </p>
        </div>
        <button
          onClick={() => navigate("/ilan-ver")}
          style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >+ Ilan ver</button>
      </div>

      <input
        value={q} onChange={e => setQ(e.target.value)}
        placeholder="Ara: is, ilce, yuk tipi..."
        style={{ width: "100%", padding: "12px 16px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: 14, marginBottom: 14 }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <button style={chip(type === "all")} onClick={() => setType("all")}>Tum ilanlar</button>
        {LISTING_TYPES.map(t => (
          <button key={t.id} style={chip(type === t.id)} onClick={() => setType(t.id)}>{t.name}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <button style={chip(cat === "all")} onClick={() => setCat("all")}>Tum kategoriler</button>
        {CATS.map(c => (
          <button key={c.id} style={{ ...chip(cat === c.id), display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setCat(c.id)}>
            <CategoryIcon catId={c.id} size={16} fallback={c.icon} />
            {c.name}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <button style={chip(il === "all")} onClick={() => setIl("all")}>Tüm iller</button>
        {IL_LIST.map(i => (
          <button key={i} style={chip(il === i)} onClick={() => setIl(i)}>{i}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setOnlyRecurring(r => !r)}
          style={{ ...chip(onlyRecurring), borderColor: onlyRecurring ? "var(--green)" : undefined, color: onlyRecurring ? "var(--green)" : undefined, background: onlyRecurring ? "var(--green-bg)" : undefined }}>
          🔁 Düzenli işler
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-ter)" }}>
          Bu filtrelere uygun ilan bulunamadi.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map(l => (
            <ListingCard key={l.id} l={l} onClick={() => navigate(`/ilan/${l.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
