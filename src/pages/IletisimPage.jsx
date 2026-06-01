import { useState } from "react";
import { C } from "../utils/theme";
import { validateForm } from "../utils/validation";
import SEO from "../components/SEO";

const FIELDS = [
  { key: "name", label: "Ad Soyad *", type: "text", placeholder: "Adiniz Soyadiniz", required: true },
  { key: "email", label: "E-posta *", type: "email", placeholder: "ornek@firma.com", required: true },
  { key: "konu", label: "Konu", type: "text", placeholder: "Ilanim hakkinda...", required: false },
];

const CONTACTS = [
  ["\uD83D\uDCDE", "Telefon", "+90 (212) 555 00 00", "Pazartesi-Cuma 09:00-18:00"],
  ["\uD83D\uDCE7", "E-posta", "info@hamted.com.tr", "En gec 2 saat icinde donus"],
  ["\uD83D\uDCAC", "WhatsApp", "+90 (555) 000 00 00", "7/24 hizli destek"],
  ["\uD83D\uDCCD", "Adres", "Levent, Istanbul", "Buyukdere Cad. No:123 Kat:5"],
];

export default function IletisimPage() {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const handleChange = (key, val) => {
    setValues(v => ({ ...v, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const handleSubmit = () => {
    const allFields = [...FIELDS, { key: "mesaj", type: "text", required: true }];
    const { valid, errors: errs } = validateForm(allFields, values);
    if (!valid) { setErrors(errs); return; }
    setSent(true);
  };

  return (
    <div className="page-content">
      <SEO title="Iletisim" description="HamTed ile iletisime gecin. Ilan, teklif ve nakliye sureci hakkindaki sorulariniz icin bize ulasin." />
      <div className="page-header">
        <div className="section-badge" style={{ background: C.amberBg, borderColor: C.amber+"30", color: C.amber }}>
          Bize Ulasin
        </div>
        <h1 className="page-title">Iletisim</h1>
        <p className="page-desc">Sorulariniz veya ozel talepleriniz icin bize ulasabilirsiniz.</p>
      </div>

      <div className="contact-grid">
        <div className="contact-cards">
          {CONTACTS.map(([icon, title, value, sub]) => (
            <div key={title} className="contact-card">
              <div className="contact-icon">{icon}</div>
              <div>
                <div className="contact-label">{title}</div>
                <div className="contact-value">{value}</div>
                <div className="contact-sub">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-card">
          {sent ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div className="success-icon">{"\u2713"}</div>
              <div className="success-title">Mesajiniz gonderildi!</div>
              <div className="success-desc">En kisa surede size donus yapacagiz.</div>
            </div>
          ) : (
            <>
              <h3 className="form-card-title">Mesaj Gonderin</h3>
              {FIELDS.map(f => (
                <div key={f.key} className="form-group">
                  <label className="field-label-sm">{f.label}</label>
                  <input type={f.type}
                    placeholder={f.placeholder}
                    value={values[f.key] || ""}
                    onChange={e => handleChange(f.key, e.target.value)}
                    className={`form-input ${errors[f.key] ? "form-input-error" : ""}`} />
                  {errors[f.key] && <div className="field-error">{errors[f.key]}</div>}
                </div>
              ))}
              <div className="form-group">
                <label className="field-label-sm">Mesajiniz *</label>
                <textarea placeholder="Mesajinizi buraya yazin..." rows={4}
                  value={values.mesaj || ""}
                  onChange={e => handleChange("mesaj", e.target.value)}
                  className={`form-input form-textarea ${errors.mesaj ? "form-input-error" : ""}`} />
                {errors.mesaj && <div className="field-error">{errors.mesaj}</div>}
              </div>
              <button onClick={handleSubmit} className="btn-primary btn-full" style={{ background: C.amber, marginTop: 4, boxShadow: `0 4px 16px ${C.amber}30` }}>
                Gonder
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
