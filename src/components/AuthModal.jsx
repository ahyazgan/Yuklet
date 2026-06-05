import { useState } from "react";

// ── MoveIQ LIGHT auth modal (Tailwind).

const ROLES = [
  { id: "isveren", label: "İş veren", desc: "İş ilanı açar, teklif alır" },
  { id: "tedarikci", label: "Tedarikçi", desc: "Araç ilanı / teklif verir" },
];

const FIELD = "w-full rounded-2xl bg-slate-50 dark:bg-navy-soft px-4 py-3 text-sm text-slate-900 dark:text-slate-100 dark:placeholder:text-navy-muted outline-none focus:ring-2 focus:ring-slate-300";

export default function AuthModal({ onClose, onLogin, onRegister }) {
  const [mode, setMode] = useState("login"); // login | register
  const [values, setValues] = useState({ role: "isveren" });
  const [error, setError] = useState("");

  const set = (key, val) => { setValues((v) => ({ ...v, [key]: val })); setError(""); };
  const switchMode = (m) => { setMode(m); setError(""); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = (values.email || "").trim();
    const password = (values.password || "").trim();
    if (!email || !password) { setError("E-posta ve şifre zorunludur."); return; }

    let res;
    if (mode === "register") {
      const name = (values.name || "").trim();
      if (!name) { setError("Ad / firma zorunludur."); return; }
      if (password.length < 6) { setError("Şifre en az 6 karakter olmalıdır."); return; }
      res = onRegister({ name, email, password, role: values.role || "isveren", phone: (values.phone || "").trim() });
    } else {
      res = onLogin({ email, password });
    }

    if (res && res.ok === false) { setError(res.error || "Bir hata oluştu."); return; }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-[410px] overflow-auto rounded-[26px] bg-white dark:bg-navy-card p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Kapat" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 dark:bg-navy-soft text-gray-500 dark:text-slate-400 transition hover:bg-gray-100 dark:hover:bg-navy-soft">✕</button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-2xl font-black text-slate-950">H</div>
          <h3 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">{mode === "register" ? "Kayıt Ol" : "Giriş Yap"}</h3>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-slate-400">
            {mode === "register" ? "İlan ve teklif vermek için ücretsiz hesap oluşturun" : "HamTed hesabınıza giriş yapın"}
          </p>
        </div>

        {/* Sekmeler */}
        <div className="mb-5 flex gap-1.5 rounded-2xl bg-slate-50 dark:bg-navy-soft p-1">
          {[["login", "Giriş"], ["register", "Kayıt"]].map(([m, lbl]) => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${mode === m ? "bg-white dark:bg-navy-card text-slate-950 dark:text-slate-100 shadow-sm" : "text-gray-500 dark:text-slate-400"}`}>
              {lbl}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "register" && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-slate-400">Ad / Firma</label>
                <input className={FIELD} value={values.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="Yıldızlar İnşaat" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-slate-400">Rol</label>
                <div className="flex gap-2">
                  {ROLES.map((r) => (
                    <button type="button" key={r.id} onClick={() => set("role", r.id)}
                      className={`flex-1 rounded-2xl border p-3 text-left transition ${values.role === r.id ? "border-yellow-400 bg-yellow-50" : "border-gray-200 dark:border-navy-line bg-white dark:bg-navy-card"}`}>
                      <div className={`text-sm font-bold ${values.role === r.id ? "text-amber-700" : "text-slate-900 dark:text-slate-100"}`}>{r.label}</div>
                      <div className="mt-0.5 text-[11px] text-gray-500 dark:text-slate-400">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-slate-400">E-posta</label>
            <input className={FIELD} type="email" value={values.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="ornek@firma.com" />
          </div>

          {mode === "register" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-slate-400">Telefon (isteğe bağlı)</label>
              <input className={FIELD} value={values.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="05XX XXX XX XX" />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-slate-400">Şifre</label>
            <input className={FIELD} type="password" value={values.password || ""} onChange={(e) => set("password", e.target.value)} placeholder={mode === "register" ? "En az 6 karakter" : "Şifreniz"} />
          </div>

          {error && <div className="text-sm font-semibold text-red-600">{error}</div>}

          <button type="submit" className="mt-1 w-full rounded-2xl bg-yellow-400 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-yellow-500">
            {mode === "register" ? "Hesap Oluştur" : "Giriş Yap"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500 dark:text-slate-400">
          {mode === "register" ? (
            <><span>Zaten hesabınız var mı? </span><button className="font-bold text-amber-600" onClick={() => switchMode("login")}>Giriş Yap</button></>
          ) : (
            <><span>Hesabınız yok mu? </span><button className="font-bold text-amber-600" onClick={() => switchMode("register")}>Ücretsiz Kayıt Ol</button></>
          )}
        </div>
      </div>
    </div>
  );
}
