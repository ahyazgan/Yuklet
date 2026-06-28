import { useState } from "react";
import Logo from "./Logo";

// ── SAHA "Yeni şifre belirle" modalı. Şifre sıfırlama bağlantısına tıklayıp
// uygulamaya dönen kullanıcıya gösterilir (App.jsx PASSWORD_RECOVERY yakalar).
// Kullanıcı yeni şifresini iki kez girer; onSubmit ile Supabase'e yazılır.
//   onSubmit({ password })  ->  { ok, error? }   ·   kapatılamaz (akış zorunlu)

const C = {
  ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  card: "#FFFFFF", sub: "#5A5852",
};
const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";
const ARCH = "'Archivo',system-ui,sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";
const FRAME = `2px solid ${C.ink}`;

export default function NewPasswordModal({ onSubmit, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (pw.length < 6) { setError("Şifre en az 6 karakter olmalı."); return; }
    if (pw !== pw2) { setError("Şifreler eşleşmiyor."); return; }
    setBusy(true);
    try {
      const res = await onSubmit({ password: pw });
      if (res && res.ok === false) { setError(res.error || "Şifre güncellenemedi."); setBusy(false); return; }
      setDone(true); setBusy(false);
    } catch (err) {
      setError(err?.message || "Bir hata oluştu."); setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4" style={{ background: "rgba(10,10,10,.55)" }}>
      <div className="relative w-full max-w-[410px]" style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: "6px 6px 0 rgba(10,10,10,.18)" }}>
        <div style={{ height: 7, backgroundImage: HAZARD }} />
        <div className="p-7">
          <div className="mb-6 text-center">
            <div className="mb-3.5 flex justify-center"><Logo size="lg" /></div>
            <h3 className="text-[20px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.02em" }}>
              {done ? "Şifre Güncellendi" : "Yeni Şifre Belirle"}
            </h3>
            <p className="mt-1.5 text-[12px]" style={{ color: C.sub, fontFamily: MONO }}>
              {done ? "Artık yeni şifrenle devam edebilirsin" : "Hesabın için yeni bir şifre gir"}
            </p>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 text-[12px] font-bold" style={{ border: `2px solid ${C.red}`, borderRadius: 6, color: C.red, background: "#FEF2F2", fontFamily: MONO }}>
              {error}
            </div>
          )}

          {done ? (
            <>
              <div className="mb-3 px-3 py-2.5 text-[12px] font-bold" style={{ border: `2px solid ${C.green}`, borderRadius: 6, color: C.green, background: "#F0FDF4", fontFamily: MONO }}>
                Şifren başarıyla değiştirildi.
              </div>
              <button
                type="button"
                onClick={onDone}
                className="w-full py-3.5 text-[14px] font-extrabold uppercase transition"
                style={{ background: C.yellow, color: C.ink, border: FRAME, borderRadius: 6, fontFamily: ARCH, letterSpacing: "-0.01em", boxShadow: "3px 3px 0 #0A0A0A" }}
              >
                Devam Et
              </button>
            </>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-2.5">
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Yeni şifre (en az 6 karakter)"
                autoComplete="new-password"
                disabled={busy}
                className="px-3 py-3 text-[14px] outline-none disabled:opacity-60"
                style={{ border: FRAME, borderRadius: 6, color: C.ink, fontFamily: MONO }}
              />
              <input
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="Yeni şifre (tekrar)"
                autoComplete="new-password"
                disabled={busy}
                className="px-3 py-3 text-[14px] outline-none disabled:opacity-60"
                style={{ border: FRAME, borderRadius: 6, color: C.ink, fontFamily: MONO }}
              />
              <button
                type="submit"
                disabled={busy}
                className="mt-0.5 py-3.5 text-[14px] font-extrabold uppercase transition disabled:opacity-60"
                style={{ background: C.yellow, color: C.ink, border: FRAME, borderRadius: 6, fontFamily: ARCH, letterSpacing: "-0.01em", boxShadow: "3px 3px 0 #0A0A0A" }}
              >
                {busy ? "Kaydediliyor…" : "Şifreyi Kaydet"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
