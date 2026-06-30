import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Truck, Plus, Pencil, Trash2, User, Phone, X, Check, BadgeCheck } from "lucide-react";
import { useToast } from "../components/Toast";
import SEO from "../components/SEO";
import Logo from "../components/Logo";
import { CATS, VEHICLE_TYPES } from "../data/categories";

// ── SAHA filo yönetimi — nakliyeci birden çok araç + şoför kaydı tutar.
//    Kurumsal nakliyeciler için: araç + plaka + şoför + kapasite tek yerde.

const C = {
  ink: "#0A0A0A", header: "#EAE3D6", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA", border: "#E3DDD0", line: "#F0ECE3",
  sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono', ui-monospace, monospace";
const ARCH = "'Archivo', system-ui, sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const shell = { width: "100%", maxWidth: 460, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: C.bg };
const cardSt = { background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 16, boxShadow: "6px 6px 0 rgba(10,10,10,.12)" };
const labelSt = { display: "block", marginBottom: 6, fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.sub, letterSpacing: 0.4, textTransform: "uppercase" };
const inputSt = { width: "100%", boxSizing: "border-box", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px 13px", fontSize: 14, color: C.ink, outline: "none", fontFamily: MONO };

const EMPTY = { plate: "", cat: "hafriyat", vehicle: "", capacity: "", driverName: "", driverPhone: "", note: "" };

export default function FleetPage({ user, fleet = [], onAddVehicle, onUpdateVehicle, onRemoveVehicle, onRequireAuth }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [editId, setEditId] = useState(null);     // düzenlenen aracın id'si
  const [adding, setAdding] = useState(false);     // yeni araç formu açık mı
  const [form, setForm] = useState(EMPTY);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);         // CRUD sırasında çift tıklamayı engelle

  // ── Giriş yoksa ──
  if (!user) {
    return (
      <div style={shell}>
        <SEO title="Filom" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <Logo size="lg" />
          <h1 style={{ fontFamily: ARCH, fontSize: 20, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Filo için giriş yapın</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: 0, maxWidth: 280 }}>Araçlarını ve şoförlerini yönetmek için giriş yap.</p>
          <button onClick={() => onRequireAuth?.()}
            style={{ marginTop: 4, background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 22px", fontFamily: ARCH, fontSize: 14, fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
            Giriş yap / Kayıt ol
          </button>
        </div>
      </div>
    );
  }

  // fleet App'ten zaten owner-filtreli (myFleet) gelir.
  const mine = fleet;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v, ...(k === "cat" ? { vehicle: "" } : {}) }));

  const startAdd = () => { setForm(EMPTY); setEditId(null); setAdding(true); };
  const startEdit = (v) => {
    setForm({ plate: v.plate || "", cat: v.cat || "hafriyat", vehicle: v.vehicle || "", capacity: v.capacity || "", driverName: v.driverName || "", driverPhone: v.driverPhone || "", note: v.note || "" });
    setEditId(v.id); setAdding(false);
  };
  const cancelForm = () => { setAdding(false); setEditId(null); setForm(EMPTY); };

  const submit = async () => {
    if (busy) return;
    if (!form.plate.trim()) { toast("Plaka zorunludur", "error"); return; }
    if (!form.vehicle) { toast("Araç tipi seçin", "error"); return; }
    const plate = form.plate.trim().toUpperCase();
    setBusy(true);
    const res = editId
      ? await onUpdateVehicle?.(editId, { ...form, plate })
      : await onAddVehicle?.({ ...form, plate, active: true });
    setBusy(false);
    if (res && res.ok === false) { toast(res.error || "İşlem başarısız", "error"); return; }
    toast(editId ? "Araç güncellendi" : "Araç eklendi", "success");
    cancelForm();
  };

  const remove = async (id) => {
    setConfirmDel(null);
    const res = await onRemoveVehicle?.(id);
    if (res && res.ok === false) { toast(res.error || "Araç silinemedi", "error"); return; }
    toast("Araç silindi", "info");
  };
  const toggleActive = async (v) => {
    const res = await onUpdateVehicle?.(v.id, { active: !v.active });
    if (res && res.ok === false) toast(res.error || "İşlem başarısız", "error");
  };

  const vehicleOptions = VEHICLE_TYPES[form.cat] || [];
  const formOpen = adding || editId != null;

  return (
    <div style={shell}>
      <SEO title="Filom" description="Araç ve şoför filonu yönet." />

      {/* Header */}
      <div style={{ background: C.ink, padding: "14px 18px", color: "#fff", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 14, backgroundImage: HAZARD }} />
        <button onClick={() => navigate(-1)} aria-label="Geri" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: "transparent", border: "2px solid rgba(255,255,255,0.25)", borderRadius: 6, color: "#fff", cursor: "pointer", flexShrink: 0 }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: ARCH, fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Filom</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{mine.length} araç · {mine.filter((v) => v.active).length} aktif</div>
        </div>
      </div>
      <div style={{ height: 8, backgroundImage: HAZARD }} />

      <div style={{ flex: 1, padding: "16px 16px 110px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Yeni araç ekle butonu */}
        {!formOpen && (
          <button onClick={startAdd}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "14px", fontFamily: ARCH, fontSize: 14, fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
            <Plus size={18} strokeWidth={2.6} /> Araç ekle
          </button>
        )}

        {/* Ekle / düzenle formu */}
        {formOpen && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={cardSt}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ fontFamily: ARCH, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>{editId ? "Aracı düzenle" : "Yeni araç"}</h2>
              <button onClick={cancelForm} aria-label="Kapat" style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Plaka</label>
              <input style={{ ...inputSt, fontWeight: 700, letterSpacing: 1 }} value={form.plate} onChange={(e) => set("plate", e.target.value)} placeholder="34 ABC 123" />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Kategori</label>
              <div style={{ display: "flex", gap: 8 }}>
                {CATS.map((c) => {
                  const active = form.cat === c.id;
                  return (
                    <button type="button" key={c.id} onClick={() => set("cat", c.id)}
                      style={{ flex: 1, border: `2px solid ${C.ink}`, background: active ? C.yellow : C.card, borderRadius: 6, padding: "10px", cursor: "pointer", fontFamily: ARCH, fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: C.ink, boxShadow: active ? "3px 3px 0 #0A0A0A" : "none" }}>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Araç tipi</label>
              <select style={{ ...inputSt, appearance: "none" }} value={form.vehicle} onChange={(e) => set("vehicle", e.target.value)}>
                <option value="">Seçin…</option>
                {vehicleOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Kapasite (ops.)</label>
              <input style={inputSt} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="20 ton" />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Şoför adı (ops.)</label>
              <input style={inputSt} value={form.driverName} onChange={(e) => set("driverName", e.target.value)} placeholder="Ahmet Yılmaz" />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Şoför telefonu (ops.)</label>
              <input style={inputSt} value={form.driverPhone} onChange={(e) => set("driverPhone", e.target.value)} placeholder="05XX XXX XX XX" inputMode="tel" />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelSt}>Not (ops.)</label>
              <input style={inputSt} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Damper arızası vb." />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={cancelForm} style={{ flex: 1, background: C.stone, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px", fontFamily: ARCH, fontSize: 13, fontWeight: 800, textTransform: "uppercase", cursor: "pointer" }}>Vazgeç</button>
              <button onClick={submit} disabled={busy} style={{ flex: 1, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px", fontFamily: ARCH, fontSize: 13, fontWeight: 800, textTransform: "uppercase", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1, boxShadow: "3px 3px 0 #0A0A0A" }}>{busy ? "…" : editId ? "Kaydet" : "Ekle"}</button>
            </div>
          </motion.section>
        )}

        {/* Filo listesi */}
        {mine.length === 0 && !formOpen ? (
          <div style={{ ...cardSt, textAlign: "center", padding: "32px 20px" }}>
            <div style={{ width: 56, height: 56, margin: "0 auto 14px", borderRadius: 8, background: C.stone, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Truck size={28} strokeWidth={2} color={C.muted} />
            </div>
            <h3 style={{ fontFamily: ARCH, fontSize: 15, fontWeight: 800, textTransform: "uppercase", color: C.ink, margin: 0 }}>Filon boş</h3>
            <p style={{ fontFamily: MONO, fontSize: 11.5, color: C.sub, margin: "8px 0 0", lineHeight: 1.5 }}>
              Araçlarını ekle; ilan verirken hızlıca seç, şoför bilgilerini tek yerde tut.
            </p>
          </div>
        ) : (
          mine.map((v) => {
            const cat = CATS.find((c) => c.id === v.cat);
            return (
              <div key={v.id} style={{ ...cardSt, padding: 0, overflow: "hidden", opacity: v.active ? 1 : 0.6 }}>
                {/* Plaka bandı */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: `2px solid ${C.line}` }}>
                  <span style={{ width: 40, height: 40, borderRadius: 6, background: C.yellow, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Truck size={20} strokeWidth={2.4} color={C.ink} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, letterSpacing: 1, color: C.ink }}>{v.plate}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat?.name} · {v.vehicle}</div>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, border: "2px solid", borderColor: v.active ? C.green : C.border, background: v.active ? "#E6F4EA" : C.stone, color: v.active ? C.green : C.muted, textTransform: "uppercase", flexShrink: 0 }}>
                    {v.active ? "Aktif" : "Pasif"}
                  </span>
                </div>

                {/* Detaylar */}
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {v.capacity && (
                    <div style={{ fontFamily: MONO, fontSize: 11, color: C.sub }}>Kapasite: <b style={{ color: C.ink }}>{v.capacity}</b></div>
                  )}
                  {(v.driverName || v.driverPhone) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      {v.driverName && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 11, color: C.ink }}><User size={13} strokeWidth={2.4} color={C.muted} /> {v.driverName}</span>}
                      {v.driverPhone && <a href={`tel:${v.driverPhone}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 11, color: C.green, fontWeight: 700, textDecoration: "none" }}><Phone size={13} strokeWidth={2.4} /> {v.driverPhone}</a>}
                    </div>
                  )}
                  {v.note && <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.muted, fontStyle: "italic" }}>{v.note}</div>}
                </div>

                {/* Aksiyonlar */}
                {confirmDel === v.id ? (
                  <div style={{ display: "flex", gap: 8, padding: "0 14px 14px" }}>
                    <button onClick={() => setConfirmDel(null)} style={{ flex: 1, background: C.card, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px", fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>Vazgeç</button>
                    <button onClick={() => remove(v.id)} style={{ flex: 1, background: C.red, color: "#fff", border: `2px solid ${C.red}`, borderRadius: 6, padding: "10px", fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>Sil</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, padding: "0 14px 14px" }}>
                    <button onClick={() => toggleActive(v)} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, background: C.stone, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px", fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>
                      {v.active ? <X size={13} /> : <Check size={13} />} {v.active ? "Pasifleştir" : "Aktifleştir"}
                    </button>
                    <button onClick={() => startEdit(v)} aria-label="Düzenle" style={{ width: 42, display: "flex", alignItems: "center", justifyContent: "center", background: C.card, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px", cursor: "pointer" }}><Pencil size={15} strokeWidth={2.4} /></button>
                    <button onClick={() => setConfirmDel(v.id)} aria-label="Sil" style={{ width: 42, display: "flex", alignItems: "center", justifyContent: "center", background: C.card, color: C.red, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px", cursor: "pointer" }}><Trash2 size={15} strokeWidth={2.4} /></button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {mine.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 10, color: C.faint, lineHeight: 1.5, padding: "0 2px" }}>
            <BadgeCheck size={13} strokeWidth={2.2} color={C.muted} style={{ flexShrink: 0 }} />
            Araç ilanı verirken filondan seçerek plaka ve kapasiteyi hızlıca doldurabilirsin.
          </div>
        )}
      </div>
    </div>
  );
}
