import { useState } from "react";
import { C } from "../utils/theme";

const ROLES = [
  { id: "isveren", label: "Is veren", desc: "Is ilani acar, teklif alir" },
  { id: "tedarikci", label: "Tedarikci", desc: "Arac ilani / teklif verir" },
];

export default function AuthModal({ onClose, onLogin, onRegister }) {
  const [mode, setMode] = useState("login"); // login | register
  const [values, setValues] = useState({ role: "isveren" });
  const [error, setError] = useState("");

  const set = (key, val) => { setValues(v => ({ ...v, [key]: val })); setError(""); };
  const switchMode = (m) => { setMode(m); setError(""); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = (values.email || "").trim();
    const password = (values.password || "").trim();
    if (!email || !password) { setError("E-posta ve sifre zorunludur."); return; }

    let res;
    if (mode === "register") {
      const name = (values.name || "").trim();
      if (!name) { setError("Ad / firma zorunludur."); return; }
      if (password.length < 6) { setError("Sifre en az 6 karakter olmalidir."); return; }
      res = onRegister({ name, email, password, role: values.role || "isveren", phone: (values.phone || "").trim() });
    } else {
      res = onLogin({ email, password });
    }

    if (res && res.ok === false) { setError(res.error || "Bir hata olustu."); return; }
    onClose();
  };

  const field = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: 14 };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 410, padding: 32 }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close">{"✕"}</button>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div className="login-logo">H</div>
          <h3 className="modal-title" style={{ marginBottom: 0 }}>{mode === "register" ? "Kayit Ol" : "Giris Yap"}</h3>
          <p style={{ fontSize: 13, color: C.textSec, marginTop: 6 }}>
            {mode === "register" ? "Ilan ve teklif vermek icin ucretsiz hesap olusturun" : "HamTed hesabiniza giris yapin"}
          </p>
        </div>

        {/* Sekmeler */}
        <div style={{ display: "flex", gap: 6, background: "var(--bg)", borderRadius: 10, padding: 4, marginBottom: 18 }}>
          {[["login", "Giris"], ["register", "Kayit"]].map(([m, lbl]) => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 700,
                background: mode === m ? "var(--bg-card)" : "transparent",
                color: mode === m ? "var(--accent)" : "var(--text-sec)",
                boxShadow: mode === m ? "var(--shadow)" : "none" }}>
              {lbl}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <>
              <div>
                <label className="field-label-sm">Ad / Firma</label>
                <input style={field} value={values.name || ""} onChange={e => set("name", e.target.value)} placeholder="Yildizlar Insaat" />
              </div>
              <div>
                <label className="field-label-sm">Rol</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {ROLES.map(r => (
                    <button type="button" key={r.id} onClick={() => set("role", r.id)}
                      style={{ flex: 1, textAlign: "left", padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                        border: "1px solid " + (values.role === r.id ? "var(--accent)" : "var(--border)"),
                        background: values.role === r.id ? "var(--accent-bg)" : "var(--bg-card)" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: values.role === r.id ? "var(--accent)" : "var(--text)" }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-sec)", marginTop: 2 }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="field-label-sm">E-posta</label>
            <input style={field} type="email" value={values.email || ""} onChange={e => set("email", e.target.value)} placeholder="ornek@firma.com" />
          </div>

          {mode === "register" && (
            <div>
              <label className="field-label-sm">Telefon (istege bagli)</label>
              <input style={field} value={values.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="05XX XXX XX XX" />
            </div>
          )}

          <div>
            <label className="field-label-sm">Sifre</label>
            <input style={field} type="password" value={values.password || ""} onChange={e => set("password", e.target.value)} placeholder={mode === "register" ? "En az 6 karakter" : "Sifreniz"} />
          </div>

          {error && <div style={{ color: "var(--red)", fontSize: 13, fontWeight: 600 }}>{error}</div>}

          <button type="submit" className="btn-primary btn-full btn-lg" style={{ marginTop: 4 }}>
            {mode === "register" ? "Hesap Olustur" : "Giris Yap"}
          </button>
        </form>

        <div className="login-register">
          {mode === "register" ? (
            <><span>Zaten hesabiniz var mi? </span><button className="link-btn link-btn-bold" onClick={() => switchMode("login")}>Giris Yap</button></>
          ) : (
            <><span>Hesabiniz yok mu? </span><button className="link-btn link-btn-bold" onClick={() => switchMode("register")}>Ucretsiz Kayit Ol</button></>
          )}
        </div>
      </div>
    </div>
  );
}
