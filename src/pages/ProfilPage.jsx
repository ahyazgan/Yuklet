import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "../components/Toast";
import SEO from "../components/SEO";

const label = { fontSize: 13, fontWeight: 600, color: "var(--text-sec)", marginBottom: 6, display: "block" };
const field = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: 14 };

const ROLES = [
  { id: "isveren", label: "Is veren", desc: "Is ilani acar, teklif alir" },
  { id: "tedarikci", label: "Tedarikci", desc: "Arac ilani / teklif verir" },
];

export default function ProfilPage({ user, onUpdateProfile, onRequireAuth }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    role: user?.role || "isveren",
  });

  if (!user) {
    return (
      <div className="page-content" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", paddingTop: 48 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Profil icin giris yapin</h1>
        <button onClick={() => onRequireAuth?.()} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "13px 24px", borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Giris yap / Kayit ol</button>
      </div>
    );
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast("Ad / firma zorunludur", "error"); return; }
    onUpdateProfile?.({ name: form.name.trim(), phone: form.phone.trim(), role: form.role });
    toast("Profil guncellendi", "success");
  };

  return (
    <div className="page-content" style={{ maxWidth: 620, margin: "0 auto" }}>
      <SEO title="Profil" description="Hesap bilgilerinizi goruntuleyin ve guncelleyin." />
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Profilim</h1>
      <p style={{ fontSize: 14, color: "var(--text-sec)", marginBottom: 22 }}>Hesap bilgilerinizi guncelleyin.</p>

      {/* Ozet kart */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, boxShadow: "var(--shadow)", marginBottom: 18 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800 }}>
          {(user.name || "?").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{user.name}</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)" }}>{user.email}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, color: "var(--text-sec)" }}>⭐ {user.rating ?? 5.0}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: user.verified ? "var(--green)" : "var(--text-ter)" }}>{user.verified ? "✓ Dogrulanmis" : "Dogrulanmamis"}</div>
        </div>
      </div>

      <motion.form onSubmit={save} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", flexDirection: "column", gap: 16, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, boxShadow: "var(--shadow)" }}>
        <div>
          <label style={label}>Ad / Firma</label>
          <input style={field} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Yildizlar Insaat" />
        </div>

        <div>
          <label style={label}>E-posta</label>
          <input style={{ ...field, opacity: 0.6, cursor: "not-allowed" }} value={user.email} disabled />
        </div>

        <div>
          <label style={label}>Telefon</label>
          <input style={field} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="05XX XXX XX XX" />
          <div style={{ fontSize: 11.5, color: "var(--text-ter)", marginTop: 5 }}>Eslesen tarafla iletisim icin paylasilir.</div>
        </div>

        <div>
          <label style={label}>Rol</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ROLES.map(r => (
              <button type="button" key={r.id} onClick={() => set("role", r.id)}
                style={{ flex: 1, minWidth: 200, textAlign: "left", padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                  border: "1px solid " + (form.role === r.id ? "var(--accent)" : "var(--border)"),
                  background: form.role === r.id ? "var(--accent-bg)" : "var(--bg-card)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: form.role === r.id ? "var(--accent)" : "var(--text)" }}>{r.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button type="submit" style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "14px", borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Degisiklikleri kaydet
        </button>
      </motion.form>
    </div>
  );
}
