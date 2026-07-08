import { useState } from "react";
import { Phone, X } from "lucide-react";
import { isValidPhone, normalizePhone } from "../lib/smsProvider";

// ── Telefon zorunlu kapısı ──────────────────────────────────────────
// Kullanıcının geçerli cep numarası yoksa ilan verme / teklif verme / iş
// kabul öncesi açılır. Akıştan çıkmadan numarayı girip kaydeder; onSave
// patch'i App.updateProfile'a gider ({ok} döndürür). Kaydedilince kapanır,
// kullanıcı aksiyonu tekrar dener (artık kapı geçer).

const C = { ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", rose: "#DC2626", card: "#FFFFFF", sub: "#5A5852", muted: "#9A968D" };
const ARCH = "'Archivo', sans-serif";
const MONO = "'Space Mono', ui-monospace, monospace";

export default function PhoneGateModal({ initialPhone = "", reason, onSave, onClose }) {
  const [phone, setPhone] = useState(initialPhone || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (saving) return;
    if (!isValidPhone(phone)) { setErr("Geçerli bir cep numarası gir (05XX XXX XX XX)."); return; }
    setErr(""); setSaving(true);
    const res = await onSave?.("0" + normalizePhone(phone)); // 05XXXXXXXXX olarak kaydet
    setSaving(false);
    if (res && res.ok === false) { setErr(res.error || "Kaydedilemedi. Tekrar dene."); return; }
    onClose?.();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 270, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(10,10,10,.7)" }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 420, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 22, boxShadow: "6px 6px 0 rgba(10,10,10,.3)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h2 style={{ fontFamily: ARCH, fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink, margin: 0, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Phone size={18} strokeWidth={2.5} /> Telefon gerekli
          </h2>
          <button onClick={onClose} aria-label="Kapat" style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}><X size={20} /></button>
        </div>
        <p style={{ fontFamily: MONO, fontSize: 12, color: C.sub, lineHeight: 1.5, margin: "0 0 14px" }}>
          {reason || "Devam etmek için geçerli bir cep numarası gerekir. Numaran yalnızca eşleştiğin tarafla iletişim için paylaşılır."}
        </p>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoFocus
          placeholder="05XX XXX XX XX"
          style={{ width: "100%", boxSizing: "border-box", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 14px", fontFamily: MONO, fontSize: 15, fontWeight: 700, color: C.ink, outline: "none" }}
        />
        {err && <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.rose, margin: "8px 0 0" }}>{err}</p>}
        <button onClick={submit} disabled={saving}
          style={{ width: "100%", marginTop: 14, background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "14px 0", fontFamily: ARCH, fontSize: 14, fontWeight: 800, textTransform: "uppercase", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Kaydediliyor…" : "Kaydet ve Devam Et"}
        </button>
      </div>
    </div>
  );
}
