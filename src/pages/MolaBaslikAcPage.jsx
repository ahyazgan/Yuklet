import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Coffee } from "lucide-react";
import { useToast } from "../components/Toast";
import SEO from "../components/SEO";

// ── SAHA Mola Forum — başlık açma formu (yalnız ONAYLI nakliyeci).

const C = {
  ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA", border: "#E3DDD0", sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const ARCHIVO = "'Archivo', system-ui, sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const shell = { width: "100%", maxWidth: 460, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: C.bg };
const labelSt = { display: "block", marginBottom: 6, fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.sub, letterSpacing: 0.4, textTransform: "uppercase" };
const inputSt = { width: "100%", boxSizing: "border-box", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px 13px", fontSize: 14, color: C.ink, outline: "none", fontFamily: MONO };

export default function MolaBaslikAcPage({ user, onAddThread, onRequireAuth }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ title: "", body: "" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const blocked = !user || user.role !== "nakliyeci" || !user.verified;
  if (blocked) {
    return (
      <div style={shell}>
        <SEO title="Mola — Başlık Aç" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Coffee size={30} color={C.yellow} strokeWidth={2.2} />
          </div>
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>
            {!user ? "Giriş gerekli" : user.role !== "nakliyeci" ? "Nakliyecilere özel" : "Belge onayı gerekli"}
          </h1>
          <p style={{ fontSize: 13, color: C.sub, margin: 0, maxWidth: 290 }}>
            {!user ? "Başlık açmak için giriş yap." : user.role !== "nakliyeci" ? "Mola Yeri yalnızca nakliyeci üyeler içindir." : "Başlık açmak için önce belgelerini yükleyip onay almalısın. (Yorum yazmak için onay gerekmez.)"}
          </p>
          <button onClick={() => (!user ? onRequireAuth?.() : navigate(user.role !== "nakliyeci" ? "/" : "/profil"))}
            style={{ marginTop: 4, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 20px", fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
            {!user ? "Giriş yap" : user.role !== "nakliyeci" ? "Ana sayfa" : "Belge yükle"}
          </button>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (busy) return;
    if (!form.title.trim()) { toast("Başlık zorunludur", "error"); return; }
    setBusy(true);
    const res = await onAddThread?.({ title: form.title.trim(), body: form.body.trim() });
    setBusy(false);
    if (res && res.ok === false) { toast(res.error || "Açılamadı", "error"); return; }
    toast("Başlık açıldı", "success");
    if (res?.thread?.id != null) navigate(`/mola/forum/${res.thread.id}`);
    else navigate("/mola");
  };

  return (
    <div style={shell}>
      <SEO title="Mola — Başlık Aç" />

      <div style={{ background: C.ink, padding: "14px 18px", color: "#fff", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 14, backgroundImage: HAZARD }} />
        <button onClick={() => navigate(-1)} aria-label="Geri" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: "transparent", border: "2px solid rgba(255,255,255,0.25)", borderRadius: 6, color: "#fff", cursor: "pointer", flexShrink: 0 }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 18, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>Başlık Aç</h1>
          <div style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>Mola Forum · tartışma başlat</div>
        </div>
      </div>
      <div style={{ height: 8, backgroundImage: HAZARD }} />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, padding: "18px 16px 120px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelSt}>Başlık</label>
          <input style={inputSt} value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="Mazot zammını nasıl yönetiyorsunuz?" />
        </div>
        <div>
          <label style={labelSt}>Açıklama (ops.)</label>
          <textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={5} maxLength={1000}
            placeholder="Konuyu biraz aç: ne sormak/paylaşmak istiyorsun?"
            style={{ ...inputSt, resize: "vertical", lineHeight: 1.5, minHeight: 110 }} />
          <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 9, color: C.faint, textAlign: "right" }}>{form.body.length}/1000</div>
        </div>

        <button type="button" onClick={submit} disabled={busy}
          style={{ width: "100%", background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "15px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1, boxShadow: "3px 3px 0 #0A0A0A" }}>
          {busy ? "Açılıyor…" : "Başlığı Aç"}
        </button>
      </motion.div>
    </div>
  );
}
