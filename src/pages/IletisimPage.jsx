import { useState } from "react";
import { validateForm } from "../utils/validation";
import SEO from "../components/SEO";

// ── MoveIQ LIGHT (Tailwind) — Iletisim.

const FIELDS = [
  { key: "name", label: "Ad Soyad *", type: "text", placeholder: "Adınız Soyadınız", required: true },
  { key: "email", label: "E-posta *", type: "email", placeholder: "ornek@firma.com", required: true },
  { key: "konu", label: "Konu", type: "text", placeholder: "İlanım hakkında...", required: false },
];

const CONTACTS = [
  ["📞", "Telefon", "+90 (212) 555 00 00", "Pazartesi-Cuma 09:00-18:00"],
  ["📧", "E-posta", "info@hamted.com.tr", "En geç 2 saat içinde dönüş"],
  ["💬", "WhatsApp", "+90 (555) 000 00 00", "7/24 hızlı destek"],
  ["📍", "Adres", "Levent, İstanbul", "Büyükdere Cad. No:123 Kat:5"],
];

const FIELD = "w-full rounded-2xl bg-slate-50 dark:bg-navy-soft px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-gray-400 dark:placeholder:text-navy-muted";

export default function IletisimPage() {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const handleChange = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const handleSubmit = () => {
    const allFields = [...FIELDS, { key: "mesaj", type: "text", required: true }];
    const { valid, errors: errs } = validateForm(allFields, values);
    if (!valid) { setErrors(errs); return; }
    setSent(true);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 text-slate-900 dark:text-slate-100">
      <SEO title="İletişim" description="HamTed ile iletişime geçin. İlan, teklif ve nakliye süreci hakkındaki sorularınız için bize ulaşın." />
      <div className="mb-9 text-center">
        <span className="inline-block rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-700">Bize Ulaşın</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-100">İletişim</h1>
        <p className="mt-2 text-base text-gray-500 dark:text-slate-400">Sorularınız veya özel talepleriniz için bize ulaşabilirsiniz.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          {CONTACTS.map(([icon, title, value, sub]) => (
            <div key={title} className="flex items-start gap-3.5 rounded-3xl bg-white dark:bg-navy-card p-5 shadow-sm">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl">{icon}</div>
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-slate-400">{title}</div>
                <div className="text-base font-bold text-slate-950 dark:text-slate-100">{value}</div>
                <div className="text-xs text-gray-400 dark:text-navy-muted">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-white dark:bg-navy-card p-6 shadow-sm">
          {sent ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">✓</div>
              <div className="text-lg font-bold text-slate-950 dark:text-slate-100">Mesajınız gönderildi!</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">En kısa sürede size dönüş yapacağız.</div>
            </div>
          ) : (
            <>
              <h3 className="mb-4 text-lg font-bold text-slate-950 dark:text-slate-100">Mesaj Gönderin</h3>
              <div className="flex flex-col gap-3.5">
                {FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-slate-400">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={values[f.key] || ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      className={`${FIELD} ${errors[f.key] ? "ring-2 ring-red-300" : ""}`} />
                    {errors[f.key] && <div className="mt-1 text-xs font-medium text-red-600">{errors[f.key]}</div>}
                  </div>
                ))}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-slate-400">Mesajınız *</label>
                  <textarea placeholder="Mesajınızı buraya yazın..." rows={4} value={values.mesaj || ""}
                    onChange={(e) => handleChange("mesaj", e.target.value)}
                    className={`${FIELD} resize-y ${errors.mesaj ? "ring-2 ring-red-300" : ""}`} />
                  {errors.mesaj && <div className="mt-1 text-xs font-medium text-red-600">{errors.mesaj}</div>}
                </div>
                <button onClick={handleSubmit} className="mt-1 w-full rounded-2xl bg-yellow-400 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-yellow-500">Gönder</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
