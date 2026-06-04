import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "../components/Toast";
import SEO from "../components/SEO";

const ROLES = [
  { id: "isveren", label: "İş veren", desc: "İş ilanı açar, teklif alır" },
  { id: "tedarikci", label: "Tedarikçi", desc: "Araç ilanı / teklif verir" },
];

const QUICK = [
  { icon: "📋", label: "İlanlarım", desc: "Açtığın ilanlar ve gelen teklifler", to: "/ilanlarim" },
  { icon: "📊", label: "Panelim", desc: "Özet ve iş akışı", to: "/panel" },
];

export default function ProfilPage({ user, onUpdateProfile, onRequireAuth }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    role: user?.role || "isveren",
  });

  if (!user) {
    return (
      <div className="app-screen" style={{ textAlign: "center", paddingTop: 48 }}>
        <SEO title="Profil" />
        <div style={{ fontSize: 44 }}>🔒</div>
        <h1 className="app-hero-title" style={{ fontSize: 22 }}>Profil için giriş yapın</h1>
        <button onClick={() => onRequireAuth?.()} className="app-search-btn" style={{ alignSelf: "center", padding: "13px 24px", fontSize: 15, borderRadius: 11 }}>Giriş yap / Kayıt ol</button>
      </div>
    );
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast("Ad / firma zorunludur", "error"); return; }
    onUpdateProfile?.({ name: form.name.trim(), phone: form.phone.trim(), role: form.role });
    toast("Profil güncellendi", "success");
  };

  return (
    <div className="app-screen">
      <SEO title="Profil" description="Hesap bilgilerinizi görüntüleyin ve güncelleyin." />
      <h1 className="app-hero-title" style={{ fontSize: 26 }}>Profilim</h1>

      {/* Ozet kart */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, boxShadow: "var(--shadow)" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, flexShrink: 0 }}>
          {(user.name || "?").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{user.name}</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, color: "var(--amber)" }}>★ {user.rating ?? 5.0}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: user.verified ? "var(--green)" : "var(--text-ter)" }}>{user.verified ? "✓ Onaylı" : "Onaysız"}</div>
        </div>
      </div>

      {/* Hizli erisim */}
      <section className="app-section">
        <h2 className="app-section-title" style={{ fontSize: 16 }}>Hızlı erişim</h2>
        {QUICK.map(q => (
          <button key={q.to} className="app-persona" onClick={() => navigate(q.to)}>
            <span className="app-persona-icon" style={{ background: "var(--accent-bg)", fontSize: 20 }}>{q.icon}</span>
            <span>
              <span className="app-persona-title" style={{ display: "block" }}>{q.label}</span>
              <span className="app-persona-desc" style={{ display: "block" }}>{q.desc}</span>
            </span>
            <span className="app-persona-chev">›</span>
          </button>
        ))}
      </section>

      {/* Duzenleme formu */}
      <section className="app-section">
        <h2 className="app-section-title" style={{ fontSize: 16 }}>Hesap bilgileri</h2>
        <motion.form onSubmit={save} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: 14, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, boxShadow: "var(--shadow)" }}>
          <div>
            <label className="field-label">Ad / Firma</label>
            <input className="form-input form-input-lg" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Yıldızlar İnşaat" />
          </div>
          <div>
            <label className="field-label">E-posta</label>
            <input className="form-input form-input-lg" style={{ opacity: 0.6, cursor: "not-allowed" }} value={user.email} disabled />
          </div>
          <div>
            <label className="field-label">Telefon</label>
            <input className="form-input form-input-lg" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="05XX XXX XX XX" />
            <div style={{ fontSize: 11.5, color: "var(--text-ter)", marginTop: 5 }}>Eşleşen tarafla iletişim için paylaşılır.</div>
          </div>
          <div>
            <label className="field-label">Rol</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ROLES.map(r => (
                <button type="button" key={r.id} onClick={() => set("role", r.id)}
                  style={{ textAlign: "left", padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                    border: "1px solid " + (form.role === r.id ? "var(--accent)" : "var(--border)"),
                    background: form.role === r.id ? "var(--accent-bg)" : "var(--bg)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: form.role === r.id ? "var(--accent)" : "var(--text)" }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="app-search-btn" style={{ width: "100%", padding: 14, fontSize: 15, borderRadius: 11 }}>Değişiklikleri kaydet</button>
        </motion.form>
      </section>
    </div>
  );
}
