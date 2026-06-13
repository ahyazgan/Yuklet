import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CATS, LISTING_TYPES, VEHICLE_TYPES, MATERIALS, UNITS } from "../data/categories";
import { IL_LIST } from "../data/listings";
import CategoryIcon from "../components/CategoryIcon";
import SEO from "../components/SEO";

// ── MoveIQ LIGHT "Create Shipment" tasarimi (Tailwind).

const LBL = "mb-1.5 block text-xs font-semibold text-gray-500 dark:text-slate-400";
const FIELD = "w-full rounded-2xl bg-slate-50 dark:bg-navy-soft px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-slate-300";

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
  } : {
    title: "", il: "Istanbul", ilce: "", varisIl: "Istanbul", yukleme: "", bosaltma: "",
    material: "", amount: "", unit: "ton", vehicle: "", capacity: "",
    dateText: "", priceType: "teklif", price: "", desc: "", owner: user?.name || "",
    recurring: false, recurringFreq: "haftalik", recurringDuration: "", dailyTrips: "",
  });
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
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
      id: Date.now(),
      ...data,
      date: "", recurring: false, recurringText: "",
      owner: user?.name || form.owner.trim(),
      ownerId: user?.id,
      ownerVerified: user?.verified || false,
      ownerRating: user?.rating || 5.0,
      status: "aktif", offers: 0, createdText: "az önce",
    };
    onPublish?.(listing);
    navigate(`/ilan/${listing.id}`);
  };

  const materials = MATERIALS[cat] || [];
  const vehicles = VEHICLE_TYPES[cat] || [];

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-12 text-center text-slate-900 dark:text-slate-100">
        <div className="text-5xl">🔒</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">İlan vermek için giriş yapın</h1>
        <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">İlan yayınlamak ücretsizdir. Devam etmek için hesabınıza giriş yapın veya hızlıca kayıt olun.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          <button onClick={onRequireAuth} className="rounded-full bg-slate-950 dark:bg-navy-soft px-5 py-3 text-sm font-bold text-white dark:text-slate-100">Giriş yap / Kayıt ol</button>
          <button onClick={() => navigate("/ilanlar")} className="rounded-full bg-white dark:bg-navy-card px-5 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 shadow-sm">İlanlara dön</button>
        </div>
      </div>
    );
  }

  if (editing && !editListing) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-16 text-center text-slate-900 dark:text-slate-100">
        <h1 className="text-xl font-bold text-slate-950 dark:text-slate-100">İlan bulunamadı</h1>
        <button onClick={() => navigate("/ilanlarim")} className="rounded-full bg-yellow-400 px-5 py-2.5 text-xs font-extrabold text-slate-950">İlanlarım</button>
      </div>
    );
  }
  if (editing && editListing.ownerId !== user.id) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-16 text-center text-slate-900 dark:text-slate-100">
        <h1 className="text-xl font-bold text-slate-950 dark:text-slate-100">Bu ilanı düzenleme yetkiniz yok</h1>
        <button onClick={() => navigate("/ilanlar")} className="rounded-full bg-yellow-400 px-5 py-2.5 text-xs font-extrabold text-slate-950">İlanlara dön</button>
      </div>
    );
  }

  const selectCard = (active) =>
    `flex-1 min-w-[150px] rounded-2xl border p-3.5 text-left transition ${active ? "border-yellow-400 bg-yellow-50" : "border-gray-200 dark:border-navy-line bg-white dark:bg-navy-card"}`;

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-4 px-4 pb-24 pt-2 text-slate-900 dark:text-slate-100">
      <SEO title={editing ? "İlanı düzenle" : "İlan ver"} description="Taşınacak yükünüzü veya boş aracınızı yayınlayın; nakliyeci ve iş sahiplerinden teklif alın." />

      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-navy-card text-slate-700 dark:text-slate-100 shadow-sm">←</button>
        <h1 className="text-lg font-bold text-slate-950 dark:text-slate-100">{editing ? "İlanı düzenle" : "İlan ver"}</h1>
      </div>

      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">

        {/* Ilan turu */}
        <div className="rounded-3xl bg-white dark:bg-navy-card p-5 shadow-sm">
          <span className={LBL}>İlan türü</span>
          <div className="flex flex-wrap gap-2">
            {LISTING_TYPES.map((lt) => (
              <button type="button" key={lt.id} onClick={() => setType(lt.id)} className={selectCard(type === lt.id)}>
                <div className={`text-sm font-bold ${type === lt.id ? "text-amber-700" : "text-slate-900 dark:text-slate-100"}`}>{lt.name}</div>
                <div className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{lt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Kategori */}
        <div className="rounded-3xl bg-white dark:bg-navy-card p-5 shadow-sm">
          <span className={LBL}>Kategori</span>
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button type="button" key={c.id} onClick={() => { setCat(c.id); set("material", ""); set("vehicle", ""); }} className={selectCard(cat === c.id)}>
                <div className={`flex items-center gap-2 text-sm font-bold ${cat === c.id ? "text-amber-700" : "text-slate-900 dark:text-slate-100"}`}>
                  <CategoryIcon catId={c.id} size={24} fallback={c.icon} />
                  <span>{c.name}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Detay alanlari */}
        <div className="flex flex-col gap-4 rounded-3xl bg-white dark:bg-navy-card p-5 shadow-sm">
          <div>
            <label className={LBL}>Başlık *</label>
            <input className={FIELD} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Örn: Şantiye hafriyat taşıma" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>İl</label>
              <select className={FIELD} value={form.il} onChange={(e) => set("il", e.target.value)}>
                {IL_LIST.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>İlçe *</label>
              <input className={FIELD} value={form.ilce} onChange={(e) => set("ilce", e.target.value)} placeholder="Örn: Ümraniye" />
            </div>
          </div>

          {type === "is" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LBL}>Yükleme noktası</label>
                  <input className={FIELD} value={form.yukleme} onChange={(e) => set("yukleme", e.target.value)} placeholder="Örn: Dudullu OSB" />
                </div>
                <div>
                  <label className={LBL}>Boşaltma noktası</label>
                  <input className={FIELD} value={form.bosaltma} onChange={(e) => set("bosaltma", e.target.value)} placeholder="Örn: Döküm sahası" />
                </div>
              </div>
              <div>
                <label className={LBL}>Varış ili <span className="font-normal normal-case text-gray-400">— dönüş yükü eşleştirmesi için</span></label>
                <select className={FIELD} value={form.varisIl} onChange={(e) => set("varisIl", e.target.value)}>
                  {IL_LIST.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Malzeme</label>
              <select className={FIELD} value={form.material} onChange={(e) => set("material", e.target.value)}>
                <option value="">Seçin</option>
                {materials.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>Miktar</label>
              <div className="flex gap-2">
                <input className={`${FIELD} flex-1`} type="number" min="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0" />
                <select className={`${FIELD} w-24`} value={form.unit} onChange={(e) => set("unit", e.target.value)}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {type === "arac" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LBL}>Araç tipi</label>
                <select className={FIELD} value={form.vehicle} onChange={(e) => set("vehicle", e.target.value)}>
                  <option value="">Seçin</option>
                  {vehicles.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={LBL}>Kapasite</label>
                <input className={FIELD} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="Örn: 18 ton" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Tarih</label>
              <input className={FIELD} value={form.dateText} onChange={(e) => set("dateText", e.target.value)} placeholder="Örn: 8-12 Haziran" />
            </div>
            <div>
              <label className={LBL}>Fiyatlandırma</label>
              <div className="flex gap-2">
                <select className={`${FIELD} flex-1`} value={form.priceType} onChange={(e) => set("priceType", e.target.value)}>
                  <option value="teklif">Teklife açık</option>
                  <option value="sabit">Sabit fiyat</option>
                </select>
                {form.priceType === "sabit" && (
                  <input className={`${FIELD} w-28`} type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="₺" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Duzenli is */}
        <div className={`rounded-3xl border p-5 transition ${form.recurring ? "border-emerald-300 bg-emerald-50" : "border-transparent bg-white dark:bg-navy-card shadow-sm"}`}>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={form.recurring} onChange={(e) => set("recurring", e.target.checked)} className="h-[18px] w-[18px] cursor-pointer accent-emerald-600" />
            <div>
              <div className={`text-sm font-bold ${form.recurring ? "text-emerald-700" : "text-slate-900 dark:text-slate-100"}`}>🔁 Düzenli iş</div>
              <div className="text-xs text-gray-500 dark:text-slate-400">Bu iş birden fazla gün / sürekli tekrarlanıyor</div>
            </div>
          </label>
          {form.recurring && (
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div>
                <label className={LBL}>Sıklık</label>
                <select className={FIELD} value={form.recurringFreq} onChange={(e) => set("recurringFreq", e.target.value)}>
                  <option value="gunluk">Günlük</option>
                  <option value="haftalik">Haftalık</option>
                  <option value="aylik">Aylık</option>
                </select>
              </div>
              <div>
                <label className={LBL}>Süre</label>
                <input className={FIELD} value={form.recurringDuration} onChange={(e) => set("recurringDuration", e.target.value)} placeholder="3 hafta" />
              </div>
              <div>
                <label className={LBL}>Günde sefer</label>
                <input className={FIELD} type="number" min="1" value={form.dailyTrips} onChange={(e) => set("dailyTrips", e.target.value)} placeholder="5" />
              </div>
            </div>
          )}
        </div>

        {/* Aciklama + firma */}
        <div className="flex flex-col gap-4 rounded-3xl bg-white dark:bg-navy-card p-5 shadow-sm">
          <div>
            <label className={LBL}>Açıklama</label>
            <textarea className={`${FIELD} min-h-[90px] resize-y`} value={form.desc} onChange={(e) => set("desc", e.target.value)} placeholder="İş/araç detayları, mesafe, özel koşullar..." />
          </div>
          <div>
            <label className={LBL}>Ad / Firma *</label>
            <input className={FIELD} value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Örn: Yıldızlar İnşaat" />
          </div>
        </div>

        {error && <div className="text-sm font-semibold text-red-600">{error}</div>}

        <button type="submit" className="w-full rounded-2xl bg-yellow-400 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-yellow-500">
          {editing ? "Değişiklikleri kaydet" : "İlanı yayınla"}
        </button>
      </motion.form>
    </div>
  );
}
