// HamTed — "İlan Ver" — SAHA marka dili (çok adımlı akış).
// Visual: industrial/site, manila/concrete palette, Space Mono numerics,
// black-framed cards, hazard accent. Flow: Adım 1/2 (kategori + yük) →
// Adım 2/2 (güzergah + detay) → Yayınlandı.
// ALL original functionality preserved: edit mode, validation, price
// estimate, map location picker, recurring job, every form field.

import { useState, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CATS, LISTING_TYPES, VEHICLE_TYPES, MATERIALS, UNITS } from "../data/categories";
import { IL_LIST } from "../data/listings";
import CategoryIcon from "../components/CategoryIcon";
import { estimatePrice, fmtTL, haversineKm } from "../utils/priceEstimate";
import { newId } from "../utils/id";
import SEO from "../components/SEO";
import {
  ChevronLeft, ArrowRight, Truck, Package, Check, CheckCircle2,
  MapPin, Plus, Share2, Pencil,
} from "lucide-react";

const LocationPicker = lazy(() => import("../components/LocationPicker"));

// ── SAHA tokens ──
const C = {
  ink: "#0A0A0A", header: "#EAE3D6", yellow: "#FACC15", yellowDeep: "#E0B400",
  green: "#16803C", bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA",
  border: "#E3DDD0", line: "#F0ECE3", sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono', ui-monospace, monospace";
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";
const shell = {
  margin: "0 auto", width: "100%", maxWidth: 460, minHeight: "100vh",
  background: C.bg, color: C.ink, fontFamily: SANS,
};

// ── shared field styles ──
const fieldBox = {
  width: "100%", background: C.card, border: `1px solid ${C.border}`,
  borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.ink,
  outline: "none", fontFamily: SANS, boxSizing: "border-box",
};
const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
  textTransform: "uppercase", color: C.sub, marginBottom: 6,
};

function Field({ label, hint, children }) {
  return (
    <div>
      {label && (
        <label style={labelStyle}>
          {label}
          {hint && <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0, color: C.muted }}> — {hint}</span>}
        </label>
      )}
      {children}
    </div>
  );
}

// AppBar: back + title + step + progress bar
function AppBar({ title, step, total, onBack }) {
  const pct = total > 0 ? Math.min(100, Math.round((step / total) * 100)) : 0;
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 20, background: C.header, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
        <button onClick={onBack} aria-label="Geri"
          style={{ width: 38, height: 38, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.ink, cursor: "pointer" }}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ flex: 1, margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</h1>
        {step != null && (
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.sub }}>{step}/{total}</span>
        )}
      </div>
      {step != null && (
        <div style={{ height: 4, background: C.border }}>
          <div style={{ height: "100%", width: `${pct}%`, background: C.yellow, transition: "width 0.3s ease" }} />
        </div>
      )}
    </div>
  );
}

// generic block card
function Block({ children, style }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, ...style }}>
      {children}
    </div>
  );
}

export default function IlanVerPage({ onPublish, onUpdate, listings = [], user, onRequireAuth }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const editListing = editing ? listings.find((l) => String(l.id) === String(id)) : null;

  const [type, setType] = useState(editListing?.type || "is");
  const [cat, setCat] = useState(editListing?.cat || "hafriyat");
  const [form, setForm] = useState(() => editListing ? {
    title: editListing.title || "", il: editListing.il || "Istanbul", ilce: editListing.ilce || "",
    varisIl: editListing.varisIl || editListing.il || "Istanbul",
    yukleme: editListing.yukleme || "", bosaltma: editListing.bosaltma || "",
    material: editListing.material || "", amount: editListing.amount != null ? String(editListing.amount) : "", unit: editListing.unit || "ton",
    vehicle: editListing.vehicle || "", capacity: editListing.capacity || "",
    dateText: editListing.dateText || "", priceType: editListing.priceType || "teklif",
    price: editListing.price != null ? String(editListing.price) : "", desc: editListing.desc || "",
    owner: editListing.owner || user?.name || "",
    recurring: editListing.recurring || false,
    recurringFreq: editListing.recurringFreq || "haftalik",
    recurringDuration: editListing.recurringDuration || "",
    dailyTrips: editListing.dailyTrips != null ? String(editListing.dailyTrips) : "",
  } : {
    title: "", il: "Istanbul", ilce: "", varisIl: "Istanbul", yukleme: "", bosaltma: "",
    material: "", amount: "", unit: "ton", vehicle: "", capacity: "",
    dateText: "", priceType: "teklif", price: "", desc: "", owner: user?.name || "",
    recurring: false, recurringFreq: "haftalik", recurringDuration: "", dailyTrips: "",
  });
  const [error, setError] = useState("");
  const [pickup, setPickup] = useState(editListing?.pickup || null);
  const [dropoff, setDropoff] = useState(editListing?.dropoff || null);
  const [showMap, setShowMap] = useState(false);
  // step: 1 = kategori+yük, 2 = güzergah+detay, 3 = yayınlandı
  const [step, setStep] = useState(1);
  const [published, setPublished] = useState(null);
  const realKm = haversineKm(pickup, dropoff);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.title.trim() || !form.ilce.trim() || !form.owner.trim()) {
      setError("Başlık, ilçe ve ad/firma alanları zorunludur.");
      return;
    }
    const data = {
      type, cat,
      title: form.title.trim(),
      il: form.il, ilce: form.ilce.trim(),
      yukleme: form.yukleme.trim(), bosaltma: form.bosaltma.trim(),
      varisIl: type === "is" ? form.varisIl : undefined,
      pickup: type === "is" ? pickup : undefined, dropoff: type === "is" ? dropoff : undefined, km: type === "is" ? realKm : undefined,
      material: form.material, amount: Number(form.amount) || 0, unit: form.unit,
      vehicle: type === "arac" ? form.vehicle : undefined,
      capacity: type === "arac" ? form.capacity.trim() : undefined,
      dateText: form.dateText.trim() || "Belirtilmedi",
      priceType: form.priceType, price: form.priceType === "sabit" ? Number(form.price) || 0 : null,
      desc: form.desc.trim(),
      recurring: form.recurring,
      recurringFreq: form.recurring ? form.recurringFreq : undefined,
      recurringDuration: form.recurring ? form.recurringDuration.trim() : undefined,
      dailyTrips: form.recurring && form.dailyTrips ? Number(form.dailyTrips) : undefined,
      recurringText: form.recurring
        ? [form.dailyTrips ? `Günde ${form.dailyTrips} sefer` : "", form.recurringDuration ? `• ${form.recurringDuration}` : ""].filter(Boolean).join(" ")
        : "",
    };

    if (editing) {
      onUpdate?.(editListing.id, data);
      navigate(`/ilan/${editListing.id}`);
      return;
    }

    const listing = {
      id: newId(),
      ...data,
      date: "", recurring: false, recurringText: "",
      owner: user?.name || form.owner.trim(),
      ownerId: user?.id,
      ownerVerified: user?.verified || false,
      ownerRating: user?.rating || 5.0,
      status: "aktif", offers: 0, createdText: "az önce",
    };
    onPublish?.(listing);
    setPublished(listing);
    setStep(3);
  };

  const goStep2 = () => { setError(""); setStep(2); };

  const materials = MATERIALS[cat] || [];
  const vehicles = VEHICLE_TYPES[cat] || [];
  const est = type === "is" && Number(form.amount) > 0
    ? estimatePrice({ cat, amount: Number(form.amount), unit: form.unit, fromIl: form.il, toIl: form.varisIl, kmOverride: realKm })
    : null;

  // ── gate: not logged in ──
  if (!user) {
    return (
      <div style={{ ...shell, paddingBottom: 96 }}>
        <SEO title="İlan ver" description="Taşınacak yükünüzü veya boş aracınızı yayınlayın." />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "64px 24px 0", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 14 }}>
            <Package size={26} color={C.ink} />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>İlan vermek için giriş yapın</h1>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: C.sub }}>İlan yayınlamak ücretsizdir. Devam etmek için hesabınıza giriş yapın veya hızlıca kayıt olun.</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 6 }}>
            <button onClick={onRequireAuth} style={{ background: C.ink, color: "#fff", fontSize: 14, fontWeight: 700, border: "none", borderRadius: 999, padding: "12px 20px", cursor: "pointer" }}>Giriş yap / Kayıt ol</button>
            <button onClick={() => navigate("/ilanlar")} style={{ background: C.card, color: C.ink, fontSize: 14, fontWeight: 700, border: `1px solid ${C.border}`, borderRadius: 999, padding: "12px 20px", cursor: "pointer" }}>İlanlara dön</button>
          </div>
        </div>
      </div>
    );
  }

  // ── gate: edit target not found ──
  if (editing && !editListing) {
    return (
      <div style={{ ...shell, paddingBottom: 96 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "72px 24px 0", textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>İlan bulunamadı</h1>
          <button onClick={() => navigate("/ilanlarim")} style={{ background: C.yellow, color: C.ink, fontSize: 13, fontWeight: 800, border: `2px solid ${C.ink}`, borderRadius: 999, padding: "10px 20px", cursor: "pointer" }}>İlanlarım</button>
        </div>
      </div>
    );
  }
  // ── gate: not owner ──
  if (editing && editListing.ownerId !== user.id) {
    return (
      <div style={{ ...shell, paddingBottom: 96 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "72px 24px 0", textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Bu ilanı düzenleme yetkiniz yok</h1>
          <button onClick={() => navigate("/ilanlar")} style={{ background: C.yellow, color: C.ink, fontSize: 13, fontWeight: 800, border: `2px solid ${C.ink}`, borderRadius: 999, padding: "10px 20px", cursor: "pointer" }}>İlanlara dön</button>
        </div>
      </div>
    );
  }

  // ── DONE screen ──
  if (step === 3 && published) {
    const fmtPrice = published.priceType === "sabit" && published.price
      ? "₺" + published.price.toLocaleString("tr-TR") : "Teklife açık";
    const shareListing = async () => {
      const url = `${window.location.origin}/ilan/${published.id}`;
      try {
        if (navigator.share) await navigator.share({ title: published.title, url });
        else if (navigator.clipboard) await navigator.clipboard.writeText(url);
      } catch { /* user cancelled share */ }
    };
    return (
      <div style={{ ...shell, paddingBottom: 96 }}>
        <SEO title="İlan yayınlandı" description="İlanınız yayında." />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "56px 20px 0", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", background: C.green, borderRadius: "50%" }}>
            <Check size={38} color="#fff" strokeWidth={3} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>İlanın yayında!</h1>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: C.sub }}>Nakliyeci ve iş sahipleri artık ilanına teklif verebilir.</p>
          </div>

          {/* summary card */}
          <div style={{ width: "100%", textAlign: "left", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ background: C.ink, color: C.yellow, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", padding: "8px 14px", display: "flex", justifyContent: "space-between" }}>
              <span>HMT-{String(published.id).padStart(4, "0")}</span>
              <span style={{ color: "#fff", display: "inline-flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> AKTİF</span>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" }}>{published.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, fontFamily: MONO, fontSize: 12, color: C.sub }}>
                <MapPin size={13} /> {published.il}{published.ilce ? ` / ${published.ilce}` : ""}
                {published.amount ? ` · ${published.amount} ${(published.unit || "").toUpperCase()}` : ""}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, background: cat === "hafriyat" ? "#FEF3C7" : "#DBEAFE", border: `1.5px solid ${C.ink}`, padding: "2px 8px", borderRadius: 4 }}>
                  {cat === "hafriyat" ? "HAFRİYAT" : "SİLOBAS"}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700 }}>{fmtPrice}</span>
              </div>
            </div>
          </div>

          {/* share / edit */}
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <button onClick={shareListing} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.card, color: C.ink, fontSize: 14, fontWeight: 700, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 0", cursor: "pointer" }}>
              <Share2 size={16} /> Paylaş
            </button>
            <button onClick={() => navigate(`/ilan-duzenle/${published.id}`)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.card, color: C.ink, fontSize: 14, fontWeight: 700, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 0", cursor: "pointer" }}>
              <Pencil size={16} /> Düzenle
            </button>
          </div>

          <button onClick={() => navigate(`/ilan/${published.id}`)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.yellow, color: C.ink, fontSize: 15, fontWeight: 800, border: `2px solid ${C.ink}`, borderRadius: 12, padding: "14px 0", cursor: "pointer" }}>
            İlanı gör <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // type/category selection card
  const optionCard = (active) => ({
    flex: "1 1 0", minWidth: 0, textAlign: "left", cursor: "pointer", position: "relative",
    background: active ? "#FFFBEB" : C.card,
    border: `2px solid ${active ? C.ink : C.border}`,
    borderRadius: 14, padding: 14, transition: "all 0.15s ease",
  });

  const title = editing ? "İlanı düzenle" : "İlan ver";
  const onBack = () => { if (step === 2) { setStep(1); setError(""); } else navigate(-1); };

  return (
    <div style={{ ...shell, paddingBottom: 110 }}>
      <SEO title={title} description="Taşınacak yükünüzü veya boş aracınızı yayınlayın; nakliyeci ve iş sahiplerinden teklif alın." />
      <AppBar title={title} step={step} total={2} onBack={onBack} />

      {/* ──────────────── STEP 1: kategori + yük ──────────────── */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16 }}>

          {/* ilan türü (iş / araç) */}
          <Block>
            <span style={labelStyle}>İlan türü</span>
            <div style={{ display: "flex", gap: 10 }}>
              {LISTING_TYPES.map((lt) => {
                const active = type === lt.id;
                const Icon = lt.id === "arac" ? Truck : Package;
                return (
                  <button type="button" key={lt.id} onClick={() => setType(lt.id)} style={optionCard(active)}>
                    {active && <Check size={16} color={C.ink} strokeWidth={3} style={{ position: "absolute", top: 10, right: 10 }} />}
                    <Icon size={22} color={C.ink} />
                    <div style={{ fontSize: 14, fontWeight: 800, marginTop: 8 }}>{lt.name}</div>
                    <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{lt.desc}</div>
                  </button>
                );
              })}
            </div>
          </Block>

          {/* taşıma türü / kategori */}
          <Block>
            <span style={labelStyle}>Taşıma türü</span>
            <div style={{ display: "flex", gap: 10 }}>
              {CATS.map((c) => {
                const active = cat === c.id;
                return (
                  <button type="button" key={c.id} onClick={() => { setCat(c.id); set("material", ""); set("vehicle", ""); }} style={optionCard(active)}>
                    {active && <Check size={16} color={C.ink} strokeWidth={3} style={{ position: "absolute", top: 10, right: 10 }} />}
                    <CategoryIcon catId={c.id} size={26} fallback={c.icon} />
                    <div style={{ fontSize: 14, fontWeight: 800, marginTop: 8 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{c.desc}</div>
                  </button>
                );
              })}
            </div>
          </Block>

          {/* malzeme (chip seçici) */}
          <Block>
            <span style={labelStyle}>Malzeme</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {materials.length === 0 && <span style={{ fontSize: 13, color: C.muted }}>Bu kategoride malzeme listesi yok.</span>}
              {materials.map((m) => {
                const active = form.material === m;
                return (
                  <button type="button" key={m} onClick={() => set("material", active ? "" : m)}
                    style={{
                      fontSize: 13, fontWeight: 700, padding: "7px 13px", borderRadius: 999, cursor: "pointer",
                      background: active ? C.yellow : C.stone,
                      border: `1.5px solid ${active ? C.ink : C.border}`,
                      color: C.ink, transition: "all 0.12s ease",
                    }}>
                    {m}
                  </button>
                );
              })}
            </div>
          </Block>

          {/* tahmini miktar + birim toggle */}
          <Block>
            <span style={labelStyle}>{type === "arac" ? "Taşıyabileceği miktar" : "Tahmini miktar"}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="number" min="0" inputMode="numeric" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0"
                style={{ ...fieldBox, flex: 1, fontFamily: MONO, fontSize: 28, fontWeight: 700, padding: "10px 14px", border: `2px solid ${C.ink}` }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {UNITS.slice(0, 4).map((u) => {
                  const active = form.unit === u;
                  return (
                    <button type="button" key={u} onClick={() => set("unit", u)}
                      style={{
                        fontFamily: MONO, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8, cursor: "pointer", minWidth: 60,
                        background: active ? C.ink : C.card, color: active ? C.yellow : C.sub,
                        border: `1.5px solid ${active ? C.ink : C.border}`, textTransform: "uppercase",
                      }}>
                      {u}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* extra units beyond first 4 (select fallback so no unit is lost) */}
            {UNITS.length > 4 && (
              <select value={UNITS.slice(0, 4).includes(form.unit) ? "" : form.unit} onChange={(e) => e.target.value && set("unit", e.target.value)}
                style={{ ...fieldBox, marginTop: 10, fontFamily: MONO }}>
                <option value="">Diğer birim…</option>
                {UNITS.slice(4).map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            )}
          </Block>

          <button type="button" onClick={goStep2}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.yellow, color: C.ink, fontSize: 15, fontWeight: 800, border: `2px solid ${C.ink}`, borderRadius: 12, padding: "14px 0", cursor: "pointer" }}>
            Devam et <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* ──────────────── STEP 2: güzergah + detay ──────────────── */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16 }}>

          {/* başlık + konum */}
          <Block style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Başlık *">
              <input style={fieldBox} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Örn: Şantiye hafriyat taşıma" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="İl">
                <select style={fieldBox} value={form.il} onChange={(e) => set("il", e.target.value)}>
                  {IL_LIST.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="İlçe *">
                <input style={fieldBox} value={form.ilce} onChange={(e) => set("ilce", e.target.value)} placeholder="Örn: Ümraniye" />
              </Field>
            </div>
          </Block>

          {/* güzergah (sadece iş) */}
          {type === "is" && (
            <Block style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <span style={{ ...labelStyle, marginBottom: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={13} /> Güzergah
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Yükleme noktası">
                  <input style={fieldBox} value={form.yukleme} onChange={(e) => set("yukleme", e.target.value)} placeholder="Örn: Dudullu OSB" />
                </Field>
                <Field label="Boşaltma noktası">
                  <input style={fieldBox} value={form.bosaltma} onChange={(e) => set("bosaltma", e.target.value)} placeholder="Örn: Döküm sahası" />
                </Field>
              </div>
              <Field label="Varış ili" hint="dönüş yükü eşleştirmesi için">
                <select style={fieldBox} value={form.varisIl} onChange={(e) => set("varisIl", e.target.value)}>
                  {IL_LIST.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>

              {/* harita konum seçici + gerçek km */}
              <div>
                <button type="button" onClick={() => setShowMap((s) => !s)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.stone, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 700, color: C.ink }}>
                    <MapPin size={16} /> Haritada konum seç
                    {realKm != null && <span style={{ fontFamily: MONO, fontWeight: 700, color: C.yellowDeep }}>· {realKm} km</span>}
                  </span>
                  <span style={{ color: C.muted }}>{showMap ? "▴" : "▾"}</span>
                </button>
                {showMap && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 11, color: C.sub }}>
                      Önce <b style={{ color: C.green }}>yükleme</b>, sonra <b style={{ color: "#DC2626" }}>boşaltma</b> noktasına tıkla. Gerçek mesafe fiyat tahminine yansır.
                    </p>
                    <Suspense fallback={<div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", background: C.stone, borderRadius: 12, fontSize: 12, color: C.muted }}>Harita yükleniyor…</div>}>
                      <LocationPicker pickup={pickup} dropoff={dropoff} onChange={({ pickup: p, dropoff: d }) => { setPickup(p); setDropoff(d); }} />
                    </Suspense>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: C.sub }}>{pickup && dropoff ? `Mesafe ~${realKm} km` : pickup ? "Şimdi boşaltma noktasını işaretle" : "Yükleme noktasını işaretle"}</span>
                      {(pickup || dropoff) && <button type="button" onClick={() => { setPickup(null); setDropoff(null); }} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 700, color: C.yellowDeep, cursor: "pointer" }}>Temizle</button>}
                    </div>
                  </div>
                )}
              </div>
            </Block>
          )}

          {/* araç tipi + kapasite (sadece araç) */}
          {type === "arac" && (
            <Block>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Araç tipi">
                  <select style={fieldBox} value={form.vehicle} onChange={(e) => set("vehicle", e.target.value)}>
                    <option value="">Seçin</option>
                    {vehicles.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Kapasite">
                  <input style={fieldBox} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="Örn: 18 ton" />
                </Field>
              </div>
            </Block>
          )}

          {/* başlangıç + fiyatlandırma */}
          <Block style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Başlangıç / Tarih">
                <input style={fieldBox} value={form.dateText} onChange={(e) => set("dateText", e.target.value)} placeholder="Örn: 8-12 Haziran" />
              </Field>
              <Field label="Fiyatlandırma">
                <select style={fieldBox} value={form.priceType} onChange={(e) => set("priceType", e.target.value)}>
                  <option value="teklif">Teklife açık</option>
                  <option value="sabit">Sabit fiyat</option>
                </select>
              </Field>
            </div>
            {form.priceType === "sabit" && (
              <Field label="Sabit fiyat (₺)">
                <input style={{ ...fieldBox, fontFamily: MONO }} type="number" min="0" inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="₺" />
              </Field>
            )}

            {/* fiyat tahmini rozeti */}
            {est && (
              <div style={{ background: "#FFFBEB", border: `1.5px solid ${C.yellow}`, borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.yellowDeep, letterSpacing: "0.02em" }}>TAHMİNİ PİYASA ARALIĞI</span>
                  <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700 }}>{fmtTL(est.min)} – {fmtTL(est.max)}</span>
                </div>
                <div style={{ marginTop: 5, fontSize: 11, color: C.sub }}>
                  {est.distLabel} · ~{est.km} km · {est.trips > 1 ? `~${est.trips} sefer (sefer başı ~${fmtTL(est.perTrip)})` : "tek sefer"} · sadece tahmindir
                </div>
              </div>
            )}
          </Block>

          {/* düzenli iş */}
          <Block style={{ borderColor: form.recurring ? C.green : C.border, background: form.recurring ? "#F0FBF3" : C.card }}>
            <button type="button" onClick={() => set("recurring", !form.recurring)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
              <span style={{ width: 22, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: `2px solid ${form.recurring ? C.green : C.border}`, background: form.recurring ? C.green : C.card }}>
                {form.recurring && <Check size={14} color="#fff" strokeWidth={3} />}
              </span>
              <span>
                <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: form.recurring ? C.green : C.ink }}>Düzenli iş</span>
                <span style={{ display: "block", fontSize: 12, color: C.sub }}>Bu iş birden fazla gün / sürekli tekrarlanıyor</span>
              </span>
            </button>
            {form.recurring && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
                <Field label="Sıklık">
                  <select style={fieldBox} value={form.recurringFreq} onChange={(e) => set("recurringFreq", e.target.value)}>
                    <option value="gunluk">Günlük</option>
                    <option value="haftalik">Haftalık</option>
                    <option value="aylik">Aylık</option>
                  </select>
                </Field>
                <Field label="Süre">
                  <input style={fieldBox} value={form.recurringDuration} onChange={(e) => set("recurringDuration", e.target.value)} placeholder="3 hafta" />
                </Field>
                <Field label="Günde sefer">
                  <input style={{ ...fieldBox, fontFamily: MONO }} type="number" min="1" value={form.dailyTrips} onChange={(e) => set("dailyTrips", e.target.value)} placeholder="5" />
                </Field>
              </div>
            )}
          </Block>

          {/* açıklama + foto + ad/firma */}
          <Block style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Açıklama">
              <textarea style={{ ...fieldBox, minHeight: 92, resize: "vertical" }} value={form.desc} onChange={(e) => set("desc", e.target.value)} placeholder="İş/araç detayları, mesafe, özel koşullar..." />
            </Field>
            {/* foto ekle (görsel placeholder) */}
            <Field label="Fotoğraf">
              <button type="button"
                style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, background: C.stone, border: `1.5px dashed ${C.muted}`, borderRadius: 12, padding: "20px 0", cursor: "pointer", color: C.sub }}>
                <Plus size={22} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>Fotoğraf ekle</span>
                <span style={{ fontSize: 10, color: C.muted }}>Yakında</span>
              </button>
            </Field>
            <Field label="Ad / Firma *">
              <input style={fieldBox} value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Örn: Yıldızlar İnşaat" />
            </Field>
          </Block>

          {/* %0 komisyon bilgi kutusu */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.ink, borderRadius: 14, padding: "14px 16px" }}>
            <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.yellow }}>%0</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Komisyon yok</div>
              <div style={{ fontSize: 11, color: "#9A988E", marginTop: 1 }}>İlan vermek ve teklif almak ücretsizdir.</div>
            </div>
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#B91C1C" }}>{error}</div>
          )}

          <button type="button" onClick={submit}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.yellow, color: C.ink, fontSize: 15, fontWeight: 800, border: `2px solid ${C.ink}`, borderRadius: 12, padding: "14px 0", cursor: "pointer" }}>
            {editing ? "Değişiklikleri kaydet" : "İlanı yayınla"}
          </button>
        </div>
      )}
    </div>
  );
}
