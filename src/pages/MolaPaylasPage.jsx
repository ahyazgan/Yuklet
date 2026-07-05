import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Coffee, Camera, X, Plus } from "lucide-react";
import { useToast } from "../components/Toast";
import SEO from "../components/SEO";
import { IL_LIST } from "../data/categories";
import { MOLA_CATS } from "../data/molaCats";
import { pickPhoto, cameraNative } from "../native/camera";

const MAX_PHOTOS = 5;

// ── SAHA "Mola Yeri" paylaşım formu — yalnız ONAYLI nakliyeci erişir.

const C = {
  ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA", border: "#E3DDD0",
  sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const ARCHIVO = "'Archivo', system-ui, sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const shell = { width: "100%", maxWidth: 460, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: C.bg };
const labelSt = { display: "block", marginBottom: 6, fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.sub, letterSpacing: 0.4, textTransform: "uppercase" };
const inputSt = { width: "100%", boxSizing: "border-box", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px 13px", fontSize: 14, color: C.ink, outline: "none", fontFamily: MONO };

export default function MolaPaylasPage({ user, onAddPost, onRequireAuth }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ category: "dorse", title: "", body: "", price: "", il: "", phone: "", showPhone: false });
  const [photos, setPhotos] = useState([]);   // dataURL dizisi (yükleme submit'te)
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Native: kamera/galeri aç. Web: <input type=file> label ile açılır (onWebFile).
  const addPhotoNative = async () => {
    if (photos.length >= MAX_PHOTOS) { toast(`En fazla ${MAX_PHOTOS} fotoğraf`, "error"); return; }
    const r = await pickPhoto({ quality: 60 });
    if (r?.denied) { toast("Kamera/galeri izni kapalı. Ayarlar’dan izin ver.", "error"); return; }
    if (r?.dataUrl) setPhotos((p) => [...p, r.dataUrl].slice(0, MAX_PHOTOS));
  };
  const onWebFile = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { toast(`En fazla ${MAX_PHOTOS} fotoğraf`, "error"); return; }
    files.slice(0, room).forEach((f) => {
      if (f.size > 4_000_000) { toast(`"${f.name}" çok büyük (~4MB sınırı)`, "error"); return; }
      const reader = new FileReader();
      reader.onload = () => setPhotos((p) => (p.length >= MAX_PHOTOS ? p : [...p, reader.result]));
      reader.readAsDataURL(f);
    });
  };
  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  // ── Gate: giriş / rol (belge onayı GEREKMİYOR — paylaşım tüm nakliyecilere serbest) ──
  const blocked = !user || user.role !== "nakliyeci";
  if (blocked) {
    return (
      <div style={shell}>
        <SEO title="Mola — Paylaş" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Coffee size={30} color={C.yellow} strokeWidth={2.2} />
          </div>
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>
            {!user ? "Giriş gerekli" : user.role !== "nakliyeci" ? "Nakliyecilere özel" : "Belge onayı gerekli"}
          </h1>
          <p style={{ fontSize: 13, color: C.sub, margin: 0, maxWidth: 290 }}>
            {!user ? "Paylaşım yapmak için giriş yap." : user.role !== "nakliyeci" ? "Mola Yeri yalnızca nakliyeci üyeler içindir." : "Paylaşım yapmak için önce belgelerini yükleyip onay almalısın."}
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
    const priceNum = form.price.trim() === "" ? null : Number(String(form.price).replace(/[^\d]/g, ""));
    if (form.price.trim() !== "" && (priceNum == null || Number.isNaN(priceNum))) { toast("Fiyat geçersiz", "error"); return; }
    setBusy(true);
    const res = await onAddPost?.({
      category: form.category,
      title: form.title.trim(),
      body: form.body.trim(),
      price: priceNum,
      il: form.il,
      phone: form.showPhone ? form.phone.trim() : "",
      photos,   // dataURL dizisi — App.jsx SB modunda Storage'a yükler
    });
    setBusy(false);
    if (res && res.ok === false) { toast(res.error || "Paylaşılamadı", "error"); return; }
    toast("Gönderi paylaşıldı", "success");
    navigate("/mola");
  };

  return (
    <div style={shell}>
      <SEO title="Mola — Paylaş" />

      {/* Header */}
      <div style={{ background: C.ink, padding: "14px 18px", color: "#fff", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 14, backgroundImage: HAZARD }} />
        <button onClick={() => navigate(-1)} aria-label="Geri" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: "transparent", border: "2px solid rgba(255,255,255,0.25)", borderRadius: 6, color: "#fff", cursor: "pointer", flexShrink: 0 }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 18, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>Yeni Gönderi</h1>
          <div style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>Mola Yeri · nakliyeci panosu</div>
        </div>
      </div>
      <div style={{ height: 8, backgroundImage: HAZARD }} />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, padding: "18px 16px 120px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Kategori */}
        <div>
          <label style={labelSt}>Kategori</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MOLA_CATS.map((c) => {
              const active = form.category === c.id;
              const Icon = c.Icon;
              return (
                <button type="button" key={c.id} onClick={() => set("category", c.id)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `2px solid ${C.ink}`, background: active ? C.yellow : C.card, borderRadius: 6, padding: "9px 12px", cursor: "pointer", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink, boxShadow: active ? "2px 2px 0 #0A0A0A" : "none", textTransform: "uppercase" }}>
                  <Icon size={13} strokeWidth={2.4} /> {c.short}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fotoğraflar (çoklu galeri, max 5) */}
        <div>
          <label style={labelSt}>Fotoğraflar (en fazla {MAX_PHOTOS})</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {photos.map((src, i) => (
              <div key={i} style={{ position: "relative", width: 78, height: 78, borderRadius: 6, border: `2px solid ${C.ink}`, overflow: "hidden", flexShrink: 0 }}>
                <img src={src} alt={`Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <button type="button" onClick={() => removePhoto(i)} aria-label="Fotoğrafı kaldır"
                  style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: 4, background: C.red, border: `1.5px solid ${C.ink}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                  <X size={12} strokeWidth={3} />
                </button>
                {i === 0 && (
                  <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.ink, color: C.yellow, fontFamily: MONO, fontSize: 8, fontWeight: 700, textAlign: "center", padding: "1px 0", textTransform: "uppercase" }}>Kapak</span>
                )}
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              cameraNative() ? (
                <button type="button" onClick={addPhotoNative}
                  style={{ width: 78, height: 78, borderRadius: 6, border: `2px dashed ${C.ink}`, background: C.stone, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", flexShrink: 0 }}>
                  <Camera size={22} strokeWidth={2.2} color={C.ink} />
                  <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>Ekle</span>
                </button>
              ) : (
                <label style={{ width: 78, height: 78, borderRadius: 6, border: `2px dashed ${C.ink}`, background: C.stone, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", flexShrink: 0 }}>
                  <Plus size={22} strokeWidth={2.4} color={C.ink} />
                  <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>Ekle</span>
                  <input type="file" accept="image/*" multiple onChange={onWebFile} style={{ display: "none" }} />
                </label>
              )
            )}
          </div>
          <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 9, color: C.faint }}>İlk fotoğraf kapak olur. İlanına göz atmak isteyenler için önemli.</div>
        </div>

        {/* Başlık */}
        <div>
          <label style={labelSt}>Başlık</label>
          <input style={inputSt} value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={80} placeholder="Satılık 2.el silobas dorse" />
        </div>

        {/* Açıklama */}
        <div>
          <label style={labelSt}>Açıklama</label>
          <textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={4} maxLength={600}
            placeholder="Detayları yaz: model, yıl, durum, şartlar…"
            style={{ ...inputSt, resize: "vertical", lineHeight: 1.5, minHeight: 90 }} />
          <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 9, color: C.faint, textAlign: "right" }}>{form.body.length}/600</div>
        </div>

        {/* Fiyat + İl */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label style={labelSt}>Fiyat (ops.)</label>
            <input style={inputSt} value={form.price} onChange={(e) => set("price", e.target.value)} inputMode="numeric" placeholder="₺ — boş bırakılabilir" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label style={labelSt}>İl</label>
            <select value={form.il} onChange={(e) => set("il", e.target.value)} style={{ ...inputSt, fontWeight: 700, fontSize: 13 }}>
              <option value="">Seçiniz…</option>
              {IL_LIST.map((il) => <option key={il} value={il}>{il}</option>)}
            </select>
          </div>
        </div>

        {/* Telefon göster (ops.) */}
        <div style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 13 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.ink }}>Telefonumu göster</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, marginTop: 2 }}>Açarsan gönderide "Ara" butonu çıkar</div>
            </div>
            <button type="button" role="switch" aria-checked={form.showPhone} aria-label="Telefonumu göster"
              onClick={() => set("showPhone", !form.showPhone)}
              style={{ flexShrink: 0, width: 46, height: 26, borderRadius: 6, border: `2px solid ${C.ink}`, background: form.showPhone ? C.green : C.stone, position: "relative", cursor: "pointer", padding: 0 }}>
              <span style={{ position: "absolute", top: 1, left: form.showPhone ? 21 : 1, width: 20, height: 20, borderRadius: 4, background: "#fff", border: `2px solid ${C.ink}`, transition: "left 0.15s" }} />
            </button>
          </div>
          {form.showPhone && (
            <input style={{ ...inputSt, marginTop: 11 }} value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" placeholder="05XX XXX XX XX" />
          )}
        </div>

        <button type="button" onClick={submit} disabled={busy}
          style={{ width: "100%", background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "15px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1, boxShadow: "3px 3px 0 #0A0A0A" }}>
          {busy ? "Paylaşılıyor…" : "Paylaş"}
        </button>
      </motion.div>
    </div>
  );
}
