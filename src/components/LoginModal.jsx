import { useState } from "react";
import { C } from "../utils/theme";
import { validateForm } from "../utils/validation";
import { loadUsers, saveCurrentUser } from "../utils/storage";
import { useToast } from "./Toast";

const FIELDS = [
  { key: "email", label: "E-posta", type: "email", placeholder: "ornek@firma.com", required: true },
  { key: "password", label: "Sifre", type: "password", placeholder: "Sifreniz", required: true },
];

export default function LoginModal({ onClose }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [remember, setRemember] = useState(false);
  const toast = useToast();

  const handleChange = (key, val) => {
    setValues(v => ({ ...v, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { valid, errors: errs } = validateForm(FIELDS, values);
    if (!valid) { setErrors(errs); return; }

    const email = values.email.trim().toLowerCase();
    const user = loadUsers().find(u => u.email.toLowerCase() === email);
    if (!user || user.password !== values.password) {
      setErrors({ password: "E-posta veya sifre hatali" });
      return;
    }

    saveCurrentUser({ email: user.email, yetkili: user.yetkili, firma: user.firma, remember });
    toast(`Hos geldiniz, ${user.yetkili || user.email}`, "success");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 400, padding: 36 }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close">{"\u2715"}</button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div className="login-logo">H</div>
          <h3 className="modal-title" style={{ marginBottom: 0 }}>Giris Yap</h3>
          <p style={{ fontSize: 13, color: C.textSec, marginTop: 6 }}>HamTed hesabiniza giris yapin</p>
        </div>

        <form onSubmit={handleSubmit}>
          {FIELDS.map(f => (
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

          <div className="login-options">
            <label className="remember-label">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: C.accent }} /> Beni hatirla
            </label>
            <button type="button" className="link-btn">Sifremi unuttum</button>
          </div>

          <button type="submit" className="btn-primary btn-full btn-lg">Giris Yap</button>
        </form>

        <div className="login-register">
          <span>Hesabiniz yok mu? </span>
          <button className="link-btn link-btn-bold">Ucretsiz Kayit Ol</button>
        </div>
      </div>
    </div>
  );
}
