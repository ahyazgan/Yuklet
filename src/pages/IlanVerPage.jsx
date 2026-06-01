import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CATS, LISTING_TYPES, VEHICLE_TYPES, MATERIALS, UNITS } from "../data/categories";
import { IL_LIST } from "../data/listings";
import CategoryIcon from "../components/CategoryIcon";

const label = { fontSize: 13, fontWeight: 600, color: "var(--text-sec)", marginBottom: 6, display: "block" };
const field = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: 14 };

export default function IlanVerPage({ onPublish, user, onRequireAuth }) {
  const navigate = useNavigate();
  const [type, setType] = useState("is");
  const [cat, setCat] = useState("hafriyat");
  const [form, setForm] = useState({
    title: "", il: "Istanbul", ilce: "", yukleme: "", bosaltma: "",
    material: "", amount: "", unit: "ton", vehicle: "", capacity: "",
    dateText: "", priceType: "teklif", price: "", desc: "", owner: user?.name || "",
  });
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.ilce.trim() || !form.owner.trim()) {
      setError("Baslik, ilce ve ad/firma alanlari zorunludur.");
      return;
    }
    const listing = {
      id: Date.now(),
      type, cat,
      title: form.title.trim(),
      il: form.il, ilce: form.ilce.trim(),
      yukleme: form.yukleme.trim(), bosaltma: form.bosaltma.trim(),
      material: form.material, amount: Number(form.amount) || 0, unit: form.unit,
      vehicle: type === "arac" ? form.vehicle : undefined,
      capacity: type === "arac" ? form.capacity.trim() : undefined,
      date: "", dateText: form.dateText.trim() || "Belirtilmedi",
      recurring: false, recurringText: "",
      priceType: form.priceType, price: form.priceType === "sabit" ? Number(form.price) || 0 : null,
      desc: form.desc.trim(),
      owner: form.owner.trim(), ownerVerified: false, ownerRating: 5.0,
      status: "aktif", offers: 0, createdText: "az once",
    };
    onPublish?.(listing);
    navigate(`/ilan/${listing.id}`);
  };

  const materials = MATERIALS[cat] || [];
  const vehicles = VEHICLE_TYPES[cat] || [];

  if (!user) {
    return (
      <div className="page-content" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", paddingTop: 40 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Ilan vermek icin giris yapin</h1>
        <p style={{ fontSize: 14.5, color: "var(--text-sec)", marginBottom: 24, lineHeight: 1.6 }}>
          Ilan yayinlamak ucretsizdir. Devam etmek icin hesabiniza giris yapin veya hizlica kayit olun.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onRequireAuth} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "13px 24px", borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Giris yap / Kayit ol</button>
          <button onClick={() => navigate("/ilanlar")} style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)", padding: "13px 24px", borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Ilanlara don</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ maxWidth: 720, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{ background: "transparent", border: "none", color: "var(--text-sec)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>← Geri</button>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Ilan ver</h1>
      <p style={{ fontSize: 14, color: "var(--text-sec)", marginBottom: 22 }}>Tasinacak yukunuzu veya bos aracinizi yayinlayin.</p>

      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", flexDirection: "column", gap: 16, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, boxShadow: "var(--shadow)" }}>

        {/* Ilan turu */}
        <div>
          <span style={label}>Ilan turu</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {LISTING_TYPES.map(lt => (
              <button type="button" key={lt.id} onClick={() => setType(lt.id)}
                style={{ flex: 1, minWidth: 160, textAlign: "left", padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                  border: "1px solid " + (type === lt.id ? "var(--accent)" : "var(--border)"),
                  background: type === lt.id ? "var(--accent-bg)" : "var(--bg-card)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: type === lt.id ? "var(--accent)" : "var(--text)" }}>{lt.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2 }}>{lt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Kategori */}
        <div>
          <span style={label}>Kategori</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATS.map(c => (
              <button type="button" key={c.id} onClick={() => { setCat(c.id); set("material", ""); set("vehicle", ""); }}
                style={{ flex: 1, minWidth: 160, textAlign: "left", padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                  border: "1px solid " + (cat === c.id ? "var(--accent)" : "var(--border)"),
                  background: cat === c.id ? "var(--accent-bg)" : "var(--bg-card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: cat === c.id ? "var(--accent)" : "var(--text)" }}>
                  <CategoryIcon catId={c.id} size={24} fallback={c.icon} />
                  <span>{c.name}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 4 }}>{c.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={label}>Baslik *</label>
          <input style={field} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Orn: Santiye hafriyat tasima" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={label}>Il</label>
            <select style={field} value={form.il} onChange={e => set("il", e.target.value)}>
              {IL_LIST.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Ilce *</label>
            <input style={field} value={form.ilce} onChange={e => set("ilce", e.target.value)} placeholder="Orn: Umraniye" />
          </div>
        </div>

        {type === "is" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>Yukleme noktasi</label>
              <input style={field} value={form.yukleme} onChange={e => set("yukleme", e.target.value)} placeholder="Orn: Dudullu OSB" />
            </div>
            <div>
              <label style={label}>Bosaltma noktasi</label>
              <input style={field} value={form.bosaltma} onChange={e => set("bosaltma", e.target.value)} placeholder="Orn: Dokum sahasi" />
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={label}>Malzeme</label>
            <select style={field} value={form.material} onChange={e => set("material", e.target.value)}>
              <option value="">Secin</option>
              {materials.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Miktar</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...field, flex: 1 }} type="number" min="0" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0" />
              <select style={{ ...field, width: 110 }} value={form.unit} onChange={e => set("unit", e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        {type === "arac" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>Arac tipi</label>
              <select style={field} value={form.vehicle} onChange={e => set("vehicle", e.target.value)}>
                <option value="">Secin</option>
                {vehicles.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Kapasite</label>
              <input style={field} value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="Orn: 18 ton" />
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={label}>Tarih</label>
            <input style={field} value={form.dateText} onChange={e => set("dateText", e.target.value)} placeholder="Orn: 8-12 Haziran" />
          </div>
          <div>
            <label style={label}>Fiyatlandirma</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select style={{ ...field, flex: 1 }} value={form.priceType} onChange={e => set("priceType", e.target.value)}>
                <option value="teklif">Teklife acik</option>
                <option value="sabit">Sabit fiyat</option>
              </select>
              {form.priceType === "sabit" && (
                <input style={{ ...field, width: 130 }} type="number" min="0" value={form.price} onChange={e => set("price", e.target.value)} placeholder="₺" />
              )}
            </div>
          </div>
        </div>

        <div>
          <label style={label}>Aciklama</label>
          <textarea style={{ ...field, minHeight: 90, resize: "vertical", fontFamily: "inherit" }} value={form.desc} onChange={e => set("desc", e.target.value)} placeholder="Is/arac detaylari, mesafe, ozel kosullar..." />
        </div>

        <div>
          <label style={label}>Ad / Firma *</label>
          <input style={field} value={form.owner} onChange={e => set("owner", e.target.value)} placeholder="Orn: Yildizlar Insaat" />
        </div>

        {error && <div style={{ color: "var(--red)", fontSize: 13, fontWeight: 600 }}>{error}</div>}

        <button type="submit" style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "14px", borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Ilani yayinla
        </button>
      </motion.form>
    </div>
  );
}
