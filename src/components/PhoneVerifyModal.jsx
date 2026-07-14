import { useState } from "react";
import { Check, Phone, ShieldCheck } from "lucide-react";
import { sendSmsCode, verifySmsCode, normalizePhone, isValidPhone } from "../lib/smsProvider";

// ── SAHA telefon doğrulama modalı. İki adım: numara → SMS kodu.
//    Güven platformunun temeli: ilan/teklif öncesi cep numarası doğrulanır.
//    smsProvider MOCK modunda kodu ekranda gösterir (gerçek SMS yerine).

const INK = "#0A0A0A";
const YELLOW = "#FACC15";
const GREEN = "#16803C";
const STONE = "#F4F1EA";
const SUB = "#5A5852";
const RED = "#DC2626";

const ARCHIVO = { fontFamily: "'Archivo',sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" };
const MONO = { fontFamily: "'Space Mono',monospace" };
const FRAME = { border: `2px solid ${INK}`, borderRadius: 6 };

export default function PhoneVerifyModal({ initialPhone = "", reason, onVerified, onClose }) {
  const [step, setStep] = useState("phone"); // phone | code | done
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [mockCode, setMockCode] = useState(""); // demo modunda gösterilecek kod
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const sendCode = async () => {
    setErr("");
    if (!isValidPhone(phone)) { setErr("Geçerli bir cep numarası gir (5XX XXX XX XX)."); return; }
    setBusy(true);
    try {
      const res = await sendSmsCode(phone);
      if (!res.ok) { setErr(res.error || "Kod gönderilemedi."); return; }
      if (res.mock && res.code) setMockCode(res.code);
      setStep("code");
    } catch (e) {
      setErr(e?.message || "Kod gönderilemedi.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setErr("");
    if (!/^\d{6}$/.test(code.trim())) { setErr("6 haneli kodu gir."); return; }
    setBusy(true);
    try {
      const res = await verifySmsCode(phone, code.trim());
      if (!res.ok) { setErr(res.error || "Kod hatalı."); return; }
      setStep("done");
      onVerified?.("0" + normalizePhone(phone));
    } catch (e) {
      setErr(e?.message || "Doğrulama başarısız.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4" style={{ background: "rgba(10,10,10,.7)" }} onClick={onClose}>
      <div className="w-full max-w-[420px] bg-white p-6" style={{ ...FRAME, boxShadow: "6px 6px 0 rgba(10,10,10,.3)" }} onClick={(e) => e.stopPropagation()}>

        {step === "done" ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center" style={{ background: GREEN, ...FRAME, color: "#fff" }}>
              <Check size={28} strokeWidth={3} />
            </div>
            <div style={{ ...ARCHIVO, fontSize: 18, color: INK }}>Numara Doğrulandı</div>
            <p className="mt-2 text-sm" style={{ color: SUB }}>Artık ilan açabilir ve iş kabul edebilirsin.</p>
            <button onClick={onClose} className="mt-5 px-6 py-2.5" style={{ ...ARCHIVO, fontSize: 13, background: INK, color: YELLOW, ...FRAME }}>
              Devam et
            </button>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center gap-2">
              <ShieldCheck size={20} strokeWidth={2.4} color={INK} />
              <h2 style={{ ...ARCHIVO, fontSize: 18, color: INK }}>Telefon Doğrulama</h2>
            </div>
            <p className="mb-4 mt-1 text-sm" style={{ ...MONO, color: SUB, lineHeight: 1.5 }}>
              {reason || "Güvenli eşleşme için cep numaranı doğrula. Hayalet hesapları engeller, teklif ve ilanları güvenilir tutar."}
            </p>

            {step === "phone" ? (
              <>
                <label className="mb-1.5 block" style={{ ...ARCHIVO, fontSize: 11, color: SUB }}>Cep Numarası</label>
                <div className="relative">
                  <Phone size={16} strokeWidth={2.4} color={SUB} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendCode()}
                    inputMode="tel"
                    placeholder="05XX XXX XX XX"
                    autoFocus
                    className="w-full bg-white py-3 text-sm outline-none"
                    style={{ ...FRAME, ...MONO, color: INK, paddingLeft: 36, paddingRight: 12 }}
                  />
                </div>
                {err && <p className="mt-2 text-xs" style={{ ...MONO, color: RED }}>{err}</p>}
                <div className="mt-5 flex gap-2.5">
                  <button onClick={onClose} className="flex-1 py-3" style={{ ...ARCHIVO, fontSize: 13, background: STONE, color: INK, ...FRAME }}>Vazgeç</button>
                  <button onClick={sendCode} disabled={busy} className="flex-1 py-3" style={{ ...ARCHIVO, fontSize: 13, background: YELLOW, color: INK, ...FRAME, opacity: busy ? 0.6 : 1 }}>
                    {busy ? "Gönderiliyor…" : "Kod Gönder"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="mb-1.5 block" style={{ ...ARCHIVO, fontSize: 11, color: SUB }}>
                  {"0" + normalizePhone(phone)} numarasına gelen 6 haneli kod
                </label>
                {mockCode && (
                  <div className="mb-2 px-3 py-2 text-center" style={{ ...MONO, fontSize: 12, color: INK, background: "#FEF7CD", border: `2px dashed ${INK}`, borderRadius: 6 }}>
                    Demo kodu: <b style={{ letterSpacing: 2 }}>{mockCode}</b>
                  </div>
                )}
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && confirm()}
                  inputMode="numeric"
                  placeholder="______"
                  autoFocus
                  className="w-full bg-white py-3 text-center text-lg outline-none"
                  style={{ ...FRAME, ...MONO, color: INK, letterSpacing: 8, fontWeight: 700 }}
                />
                {err && <p className="mt-2 text-xs" style={{ ...MONO, color: RED }}>{err}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <button onClick={() => { setStep("phone"); setCode(""); setErr(""); }} style={{ ...MONO, fontSize: 11, color: SUB, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                    Numarayı değiştir
                  </button>
                  <button onClick={sendCode} disabled={busy} style={{ ...MONO, fontSize: 11, color: INK, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", opacity: busy ? 0.6 : 1 }}>
                    Tekrar gönder
                  </button>
                </div>
                <button onClick={confirm} disabled={busy} className="mt-4 w-full py-3" style={{ ...ARCHIVO, fontSize: 13, background: YELLOW, color: INK, ...FRAME, opacity: busy ? 0.6 : 1 }}>
                  {busy ? "Doğrulanıyor…" : "Doğrula"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
