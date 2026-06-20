import { useState } from "react";

// ── SAHA Giriş modal. 2px ink çerçeve · hazard şeridi · Archivo uppercase · Space Mono.
// Fonksiyonellik korunur: onLogin/onRegister/onClose, login↔register toggle, 3 rol, validasyon.

/* SAHA paleti (kesin değerler — _DESIGN_SYSTEM.md) */
const C = {
  ink: "#0A0A0A", yellow: "#FACC15", yellowDeep: "#E0B400", green: "#16803C",
  red: "#DC2626", bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA",
  sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";
const ARCH = "'Archivo',system-ui,sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";
const FRAME = `2px solid ${C.ink}`;

const ROLES = [
  { id: "isveren", label: "Müteahhit / Alıcı", desc: "İş ilanı açar, teklif alır" },
  { id: "nakliyeci", label: "Nakliyeci / Taşıyıcı", desc: "Araç ilanı açar, yük taşır" },
  { id: "tedarikci", label: "Tedarikçi", desc: "Malzeme satar: ocak, beton, kum" },
];

// Mono uppercase label
function Label({ children }) {
  return (
    <label
      className="mb-1.5 block text-[10px] font-bold uppercase"
      style={{ color: C.sub, fontFamily: MONO, letterSpacing: "0.04em" }}
    >
      {children}
    </label>
  );
}

// 2px ink çerçeve input
const FIELD = {
  width: "100%", borderRadius: 6, background: C.card, border: FRAME,
  padding: "11px 13px", fontSize: 14, color: C.ink, outline: "none",
  fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
};

export default function AuthModal({ onClose, onLogin, onRegister }) {
  const [mode, setMode] = useState("login"); // login | register
  const [values, setValues] = useState({ role: "isveren" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  const set = (key, val) => { setValues((v) => ({ ...v, [key]: val })); setError(""); };
  const switchMode = (m) => { setMode(m); setError(""); setInfo(""); };

  const handleSubmit = async () => {
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

  // Enter ile gönder (form yok — kural gereği)
  const onKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,10,.55)" }}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-[410px] overflow-auto"
        style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: "6px 6px 0 rgba(10,10,10,.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* üst hazard şeridi */}
        <div style={{ height: 7, backgroundImage: HAZARD }} />

        <div className="p-7">
          {/* kapat */}
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-3.5 top-[26px] flex h-8 w-8 items-center justify-center"
            style={{ background: C.card, border: FRAME, borderRadius: 5, color: C.ink }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>

          {/* logo + başlık */}
          <div className="mb-5 text-center">
            <div
              className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center"
              style={{ background: C.ink, borderRadius: 6, color: C.yellow, fontFamily: ARCH, fontWeight: 900, fontSize: 26 }}
            >H</div>
            <h3 className="text-[20px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.02em" }}>
              {mode === "register" ? "Kayıt Ol" : "Giriş Yap"}
            </h3>
            <p className="mt-1.5 text-[12px]" style={{ color: C.sub, fontFamily: MONO }}>
              {mode === "register" ? "Ücretsiz hesap oluştur" : "HamTed hesabına giriş yap"}
            </p>
          </div>

          {/* segment toggle */}
          <div className="mb-5 flex" style={{ border: FRAME, borderRadius: 6, overflow: "hidden" }}>
            {[["login", "Giriş"], ["register", "Kayıt"]].map(([m, lbl], i) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className="flex-1 py-2.5 text-[13px] font-bold uppercase transition"
                style={{
                  fontFamily: ARCH, letterSpacing: "-0.01em",
                  background: mode === m ? C.yellow : C.card,
                  color: C.ink,
                  borderLeft: i === 1 ? FRAME : "none",
                }}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3.5" onKeyDown={onKey}>
            {mode === "register" && (
              <>
                <div>
                  <Label>Ad / Firma</Label>
                  <input style={FIELD} value={values.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="Yıldızlar İnşaat" />
                </div>
                <div>
                  <Label>Rol Seç</Label>
                  <div className="flex flex-col gap-2">
                    {ROLES.map((r) => {
                      const on = values.role === r.id;
                      return (
                        <button
                          type="button"
                          key={r.id}
                          onClick={() => set("role", r.id)}
                          className="flex items-center justify-between gap-2 p-3 text-left transition"
                          style={{ border: FRAME, borderRadius: 6, background: on ? C.yellow : C.card }}
                        >
                          <div>
                            <div className="text-[13px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>{r.label}</div>
                            <div className="mt-0.5 text-[10px]" style={{ color: on ? "#3d3a2a" : C.sub, fontFamily: MONO }}>{r.desc}</div>
                          </div>
                          <span
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center"
                            style={{ border: FRAME, borderRadius: 4, background: on ? C.ink : C.card, color: C.yellow }}
                          >
                            {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div>
              <Label>E-posta</Label>
              <input style={FIELD} type="email" value={values.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="ornek@firma.com" />
            </div>

            {mode === "register" && (
              <div>
                <Label>Telefon (isteğe bağlı)</Label>
                <input style={FIELD} value={values.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="05XX XXX XX XX" />
              </div>
            )}

            <div>
              <Label>Şifre</Label>
              <input style={FIELD} type="password" value={values.password || ""} onChange={(e) => set("password", e.target.value)} placeholder={mode === "register" ? "En az 6 karakter" : "Şifreniz"} />
            </div>

            {error && (
              <div className="px-3 py-2.5 text-[12px] font-bold" style={{ border: `2px solid ${C.red}`, borderRadius: 6, color: C.red, background: "#FEF2F2", fontFamily: MONO }}>
                {error}
              </div>
            )}
            {info && (
              <div className="px-3 py-2.5 text-[12px] font-bold" style={{ border: `2px solid ${C.green}`, borderRadius: 6, color: C.green, background: "#F0FDF4", fontFamily: MONO }}>
                {info}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy}
              className="mt-1 w-full py-3 text-[14px] font-extrabold uppercase transition disabled:opacity-60"
              style={{ background: C.yellow, color: C.ink, border: FRAME, borderRadius: 6, fontFamily: ARCH, letterSpacing: "-0.01em", boxShadow: "3px 3px 0 #0A0A0A" }}
            >
              {busy ? "Lütfen bekleyin…" : mode === "register" ? "Hesap Oluştur" : "Giriş Yap"}
            </button>
          </div>

          {/* alt link */}
          <div className="mt-4 text-center text-[12px]" style={{ color: C.sub, fontFamily: MONO }}>
            {mode === "register" ? (
              <><span>Hesabın var mı? </span><button className="font-bold underline decoration-2 underline-offset-2" style={{ color: C.ink, textDecorationColor: C.yellow }} onClick={() => switchMode("login")}>Giriş Yap</button></>
            ) : (
              <><span>Hesabın yok mu? </span><button className="font-bold underline decoration-2 underline-offset-2" style={{ color: C.ink, textDecorationColor: C.yellow }} onClick={() => switchMode("register")}>Ücretsiz Kayıt Ol</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
