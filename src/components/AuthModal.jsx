import { useState } from "react";
import { C } from "../utils/theme";
import { validateForm } from "../utils/validation";

const LOGIN_FIELDS = [
  { key: "email", label: "E-posta", type: "email", placeholder: "ornek@firma.com", required: true },
  { key: "password", label: "Sifre", type: "password", placeholder: "Sifreniz", required: true },
];

const REGISTER_FIELDS = [
  { key: "name", label: "Ad / Firma", type: "text", placeholder: "Yildizlar Insaat", required: true },
  { key: "email", label: "E-posta", type: "email", placeholder: "ornek@firma.com", required: true },
  { key: "password", label: "Sifre", type: "password", placeholder: "En az 6 karakter", required: true },
];

export default function AuthModal({ onClose, onAuth }) {
  const [mode, setMode] = useState("login"); // login | register
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  const fields = mode === "register" ? REGISTER_FIELDS : LOGIN_FIELDS;

  const handleChange = (key, val) => {
    setValues(v => ({ ...v, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const switchMode = (m) => { setMode(m); setErrors({}); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { valid, errors: errs } = validateForm(fields, values);
    if (!valid) { setErrors(errs); return; }
    const name = mode === "register"
      ? values.name.trim()
      : (values.email.split("@")[0] || "Kullanici");
    onAuth({ name, email: values.email.trim() });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 400, padding: 36 }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close">{"✕"}</button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="login-logo">H</div>
          <h3 className="modal-title" style={{ marginBottom: 0 }}>{mode === "register" ? "Kayit Ol" : "Giris Yap"}</h3>
          <p style={{ fontSize: 13, color: C.textSec, marginTop: 6 }}>
            {mode === "register" ? "Ilan vermek icin ucretsiz hesap olusturun" : "HamTed hesabiniza giris yapin"}
          </p>
        </div>

        {/* Sekmeler */}
        <div style={{ display: "flex", gap: 6, background: "var(--bg)", borderRadius: 10, padding: 4, marginBottom: 20 }}>
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

        <form onSubmit={handleSubmit}>
          {fields.map(f => (
            <div key={f.key} className="form-group">
              <label className="field-label-sm">{f.label}</label>
              <input type={f.type}
                placeholder={f.placeholder}
                value={values[f.key] || ""}
                onChange={e => handleChange(f.key, e.target.value)}
                className={`form-input form-input-lg ${errors[f.key] ? "form-input-error" : ""}`} />
              {errors[f.key] && <div className="field-error">{errors[f.key]}</div>}
            </div>
          ))}

          <button type="submit" className="btn-primary btn-full btn-lg">
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
