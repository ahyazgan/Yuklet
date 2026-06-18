import { useState } from "react";

// ── SAHA auth modal (Tailwind). Antrasit + hazard sarısı + manila, mavi yok, tek tema.

const ROLES = [
  { id: "isveren", label: "Müteahhit / Alıcı", desc: "İş ilanı açar, teklif alır" },
  { id: "nakliyeci", label: "Nakliyeci / Taşıyıcı", desc: "Araç ilanı açar, yük taşır" },
  { id: "tedarikci", label: "Tedarikçi", desc: "Malzeme satar: ocak, beton, kum" },
];

const FIELD = "w-full rounded-2xl bg-ham-stone border border-ham-border px-4 py-3 text-sm text-ham-ink placeholder:text-ham-muted outline-none focus:ring-2 focus:ring-ham-yellow";

export default function AuthModal({ onClose, onLogin, onRegister }) {
  const [mode, setMode] = useState("login"); // login | register
  const [values, setValues] = useState({ role: "isveren" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  const set = (key, val) => { setValues((v) => ({ ...v, [key]: val })); setError(""); };
  const switchMode = (m) => { setMode(m); setError(""); setInfo(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = (values.email || "").trim();
    const password = (values.password || "").trim();
    if (!email || !password) { setError("E-posta ve şifre zorunludur."); return; }

    let res;
    setBusy(true); setError(""); setInfo("");
    try {
      if (mode === "register") {
        const name = (values.name || "").trim();
        if (!name) { setError("Ad / firma zorunludur."); setBusy(false); return; }
        if (password.length < 6) { setError("Şifre en az 6 karakter olmalıdır."); setBusy(false); return; }
        res = await onRegister({ name, email, password, role: values.role || "isveren", phone: (values.phone || "").trim() });
      } else {
        res = await onLogin({ email, password });
      }
    } catch (err) {
      setError(err?.message || "Bir hata oluştu."); setBusy(false); return;
    }
    setBusy(false);

    if (res && res.ok === false) { setError(res.error || "Bir hata oluştu."); return; }
    // E-posta onayı gerekiyorsa modal'ı kapatma; kullanıcıya bildir.
    if (res && res.needsConfirm) { setInfo(res.message || "E-postanı kontrol et: onay bağlantısı gönderdik."); return; }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ham-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-[410px] overflow-auto rounded-[26px] bg-ham-card p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Kapat" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ham-stone text-ham-sub transition hover:bg-ham-border">✕</button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ham-yellow text-2xl font-black text-ham-ink">H</div>
          <h3 className="text-xl font-extrabold tracking-tight text-ham-ink">{mode === "register" ? "Kayıt Ol" : "Giriş Yap"}</h3>
          <p className="mt-1.5 text-sm text-ham-sub">
            {mode === "register" ? "İlan ve teklif vermek için ücretsiz hesap oluşturun" : "HamTed hesabınıza giriş yapın"}
          </p>
        </div>

        {/* Sekmeler */}
        <div className="mb-5 flex gap-1.5 rounded-2xl bg-ham-stone p-1">
          {[["login", "Giriş"], ["register", "Kayıt"]].map(([m, lbl]) => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${mode === m ? "bg-ham-card text-ham-ink shadow-sm" : "text-ham-sub"}`}>
              {lbl}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "register" && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ham-sub">Ad / Firma</label>
                <input className={FIELD} value={values.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="Yıldızlar İnşaat" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ham-sub">Rol</label>
                <div className="flex flex-col gap-2">
                  {ROLES.map((r) => (
                    <button type="button" key={r.id} onClick={() => set("role", r.id)}
                      className={`flex items-center justify-between gap-2 rounded-2xl border p-3 text-left transition ${values.role === r.id ? "border-ham-yellow bg-ham-yellow/10" : "border-ham-border bg-ham-card"}`}>
                      <div>
                        <div className={`text-sm font-bold ${values.role === r.id ? "text-ham-ink" : "text-ham-ink"}`}>{r.label}</div>
                        <div className="mt-0.5 text-[11px] text-ham-sub">{r.desc}</div>
                      </div>
                      <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${values.role === r.id ? "border-ham-yellow bg-ham-yellow text-ham-ink" : "border-ham-border"}`}>
                        {values.role === r.id && <span className="text-[11px] font-black leading-none">✓</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ham-sub">E-posta</label>
            <input className={FIELD} type="email" value={values.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="ornek@firma.com" />
          </div>

          {mode === "register" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ham-sub">Telefon (isteğe bağlı)</label>
              <input className={FIELD} value={values.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="05XX XXX XX XX" />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ham-sub">Şifre</label>
            <input className={FIELD} type="password" value={values.password || ""} onChange={(e) => set("password", e.target.value)} placeholder={mode === "register" ? "En az 6 karakter" : "Şifreniz"} />
          </div>

          {error && <div className="text-sm font-semibold text-ham-red">{error}</div>}
          {info && <div className="rounded-2xl bg-ham-green/10 px-4 py-3 text-sm font-semibold text-ham-green">{info}</div>}

          <button type="submit" disabled={busy} className="mt-1 w-full rounded-2xl bg-ham-yellow py-3.5 text-sm font-extrabold text-ham-ink transition hover:bg-ham-yellowDeep disabled:opacity-60">
            {busy ? "Lütfen bekleyin…" : mode === "register" ? "Hesap Oluştur" : "Giriş Yap"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-ham-sub">
          {mode === "register" ? (
            <><span>Zaten hesabınız var mı? </span><button className="font-bold text-ham-ink underline decoration-ham-yellow decoration-2 underline-offset-2" onClick={() => switchMode("login")}>Giriş Yap</button></>
          ) : (
            <><span>Hesabınız yok mu? </span><button className="font-bold text-ham-ink underline decoration-ham-yellow decoration-2 underline-offset-2" onClick={() => switchMode("register")}>Ücretsiz Kayıt Ol</button></>
          )}
        </div>
      </div>
    </div>
  );
}
