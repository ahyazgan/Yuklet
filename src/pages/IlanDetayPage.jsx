import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LISTINGS } from "../data/listings";
import { CATS } from "../data/categories";
import { backhaulForJob, loadsForVehicle, vehicleClassOf } from "../utils/backhaul";
import { estimatePrice, fmtTL } from "../utils/priceEstimate";
import { useToast } from "../components/Toast";
import ReportModal from "../components/ReportModal";
import SEO from "../components/SEO";

// ── MoveIQ LIGHT ilan detay (Tailwind).

const CAT_TAG = {
  hafriyat: { label: "HAFRİYAT", cls: "text-amber-700 bg-amber-100" },
  silobas: { label: "SİLOBAS", cls: "text-sky-700 bg-sky-100" },
};
const STATUS_STYLE = {
  beklemede: { label: "Beklemede", cls: "text-amber-700 bg-amber-100" },
  kabul: { label: "Kabul edildi", cls: "text-emerald-700 bg-emerald-100" },
  ret: { label: "Reddedildi", cls: "text-red-700 bg-red-100" },
};

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-navy-line px-5 py-3 last:border-b-0">
      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-sm font-bold text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function IlanDetayPage({ listings = LISTINGS, user, onRequireAuth, offers = [], onAddOffer, onReport }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [showReport, setShowReport] = useState(false);

  const l = listings.find((x) => String(x.id) === String(id));

  if (!l) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-16 text-center text-slate-900 dark:text-slate-100">
        <div className="text-4xl">📭</div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-slate-100">İlan bulunamadı</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Bu ilan kaldırılmış veya hiç var olmamış olabilir.</p>
        <button onClick={() => navigate("/ilanlar")} className="mt-2 rounded-full bg-yellow-400 px-5 py-2.5 text-xs font-extrabold text-slate-950">Tüm ilanlar</button>
      </div>
    );
  }

  const cat = CATS.find((c) => c.id === l.cat);
  const tag = CAT_TAG[l.cat] || CAT_TAG.hafriyat;
  const listingOffers = offers.filter((o) => String(o.listingId) === String(l.id));
  const isOwner = user && l.ownerId && l.ownerId === user.id;
  const isFixed = l.priceType === "sabit" && l.price;
  const closed = l.status === "kapali" || l.status === "eslesti";
  const backhaul = l.type === "arac" ? loadsForVehicle(l, listings) : backhaulForJob(l, listings);
  const est = !isFixed && l.type === "is" && l.amount ? estimatePrice({ cat: l.cat, amount: l.amount, unit: l.unit, fromIl: l.il, toIl: l.varisIl }) : null;

  const submitOffer = () => {
    if (!user) { onRequireAuth?.(); return; }
    if (!price && !message.trim()) { toast("Fiyat veya mesaj girin", "error"); return; }
    onAddOffer?.({
      id: Date.now(), listingId: l.id, fromUser: user.name, fromUserId: user.id,
      price: price ? Number(price) : null, message: message.trim(),
      status: "beklemede", createdAt: new Date().toISOString(),
    });
    setPrice(""); setMessage("");
    toast("Teklifiniz iletildi", "success");
  };

  const inputCls = "w-full rounded-2xl bg-slate-50 dark:bg-navy-soft px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-slate-300";

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-4 px-4 pb-24 pt-2 text-slate-900 dark:text-slate-100">
      <SEO title={l.title} description={l.desc || `${cat?.name} ilanı - ${l.il} / ${l.ilce}`} />

      <button onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center self-start rounded-full bg-white dark:bg-navy-card text-slate-700 dark:text-slate-100 shadow-sm">←</button>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4">

        {/* Baslik karti */}
        <div className="rounded-3xl bg-white dark:bg-navy-card p-5 shadow-sm">
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${tag.cls}`}>{tag.label}</span>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${l.type === "is" ? "text-amber-700 bg-amber-100" : "text-sky-700 bg-sky-100"}`}>
              {l.type === "is" ? "İŞ İLANI" : "ARAÇ İLANI"}
            </span>
            {l.status === "eslesti" && <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700">✓ EŞLEŞTİ</span>}
            <span className="ml-auto text-[11px] text-gray-400 dark:text-navy-muted">{l.createdText}</span>
          </div>
          <h1 className="text-xl font-extrabold leading-snug tracking-tight text-slate-950 dark:text-slate-100">{l.title}</h1>
          <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">📍 {l.il}{l.ilce ? `, ${l.ilce}` : ""}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-100">{l.owner}</span>
            {l.ownerVerified && <span className="font-bold text-emerald-600">✓ Onaylı</span>}
            {l.ownerRating && <span className="text-amber-600">★ {l.ownerRating}</span>}
          </div>
        </div>

        {/* Fiyat + teklif */}
        <div className="rounded-3xl bg-white dark:bg-navy-card p-5 shadow-sm">
          <div className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">{isFixed ? `₺${l.price.toLocaleString("tr-TR")}` : "Teklife açık"}</div>
          <div className="mt-0.5 text-xs text-gray-400 dark:text-navy-muted">{listingOffers.length} teklif geldi</div>
          {est && (
            <div className="mb-4 mt-2 inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:bg-navy-soft dark:text-yellow-400">
              💡 Tahmini bütçe: {fmtTL(est.min)} – {fmtTL(est.max)}
            </div>
          )}
          {!est && <div className="mb-4" />}

          {isOwner ? (
            <div className="rounded-2xl bg-sky-50 p-4 text-center text-sm font-semibold text-sky-700">
              Bu sizin ilanınız.
              <button onClick={() => navigate("/ilanlarim")} className="mx-auto mt-2 block rounded-full bg-sky-600 px-4 py-2 text-xs font-bold text-white">Teklifleri yönet</button>
            </div>
          ) : closed ? (
            <div className="rounded-2xl bg-slate-50 dark:bg-navy-soft p-4 text-center text-sm font-semibold text-gray-500 dark:text-slate-400">
              {l.status === "eslesti" ? "Bu ilan eşleşti, yeni teklif alınmıyor." : "Bu ilan kapatıldı, yeni teklif alınmıyor."}
            </div>
          ) : !user ? (
            <button onClick={() => onRequireAuth?.()} className="w-full rounded-2xl bg-slate-950 dark:bg-navy-soft py-3.5 text-sm font-bold text-white dark:text-slate-100 transition hover:bg-slate-800">
              Giriş yapıp teklif ver
            </button>
          ) : (
            <div className="flex flex-col gap-2.5">
              <input className={inputCls} type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Teklif fiyatınız (₺)" />
              <textarea className={`${inputCls} min-h-[80px]`} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mesajınız (müsaitlik, araç, koşullar…)" />
              <button onClick={submitOffer} className="w-full rounded-2xl bg-yellow-400 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-yellow-500">Teklif gönder</button>
            </div>
          )}
        </div>

        {/* Aciklama */}
        {l.desc && (
          <div className="rounded-3xl bg-white dark:bg-navy-card p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-slate-950 dark:text-slate-100">Açıklama</h2>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-300">{l.desc}</p>
          </div>
        )}

        {/* Detaylar */}
        <div className="overflow-hidden rounded-3xl bg-white dark:bg-navy-card shadow-sm">
          <Row label="Kategori" value={cat?.name} />
          <Row label="Konum" value={`${l.il}${l.ilce ? " / " + l.ilce : ""}`} />
          <Row label="Yükleme" value={l.yukleme} />
          <Row label="Boşaltma" value={l.bosaltma} />
          <Row label="Varış ili" value={l.type === "is" ? l.varisIl : null} />
          <Row label="Malzeme" value={l.material} />
          <Row label="Miktar" value={l.amount ? `${l.amount} ${l.unit || ""}` : null} />
          <Row label="Araç" value={l.vehicle} />
          <Row label="Kapasite" value={l.capacity} />
          <Row label="Tarih" value={l.dateText} />
          {l.recurring && <Row label="Tekrar" value={l.recurringText} />}
        </div>

        {/* Dönüş yükü / backhaul */}
        {backhaul.length > 0 && (
          <div className="rounded-3xl bg-white dark:bg-navy-card p-5 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">{l.type === "arac" ? "Bu araca uygun yükler" : "Dönüş yükü fırsatı"}</h2>
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[9px] font-extrabold text-slate-950">YENİ</span>
            </div>
            <p className="mb-3 text-xs text-gray-500 dark:text-slate-400">
              {l.type === "arac"
                ? `${vehicleClassOf(l)} aracınıza uygun yakın işler (sefer tahmini dahil).`
                : "Bu işi alan araç dönüşte boş gitmesin — güzergaha uygun yükler:"}
            </p>
            <div className="flex flex-col gap-2.5">
              {backhaul.map((m) => (
                <button key={m.listing.id} onClick={() => navigate(`/ilan/${m.listing.id}`)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 dark:border-navy-line p-3.5 text-left transition hover:border-yellow-400/60">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-slate-100 dark:bg-navy-soft px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">{m.fromIl || "—"} → {m.toIl || "—"}</span>
                      {m.roundTrip && <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Tam tur ↺</span>}
                    </div>
                    <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{m.listing.title}</div>
                    <div className="text-[11px] text-gray-500 dark:text-slate-400">📍 {m.listing.il}{m.listing.amount ? ` · ${m.listing.amount} ${m.listing.unit || ""}` : ""}{m.trips ? ` · ~${m.trips} sefer` : ""}</div>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-yellow-400 px-3 py-1.5 text-[10px] font-extrabold text-slate-950">{m.fit}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gelen teklifler */}
        <div className="rounded-3xl bg-white dark:bg-navy-card p-5 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-slate-950 dark:text-slate-100">Gelen teklifler ({listingOffers.length})</h2>
          {listingOffers.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-navy-muted">Henüz teklif yok. İlk teklifi siz verin.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {listingOffers.map((o) => {
                const s = STATUS_STYLE[o.status] || STATUS_STYLE.beklemede;
                return (
                  <div key={o.id} className="rounded-2xl border border-gray-100 dark:border-navy-line p-4">
                    <div className="mb-1 flex items-center justify-between gap-2.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{o.fromUser}</span>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2.5">
                      <span className="text-sm text-gray-500 dark:text-slate-400">{o.message || "—"}</span>
                      {o.price != null && <span className="whitespace-nowrap text-base font-extrabold text-slate-950 dark:text-slate-100">₺{o.price.toLocaleString("tr-TR")}</span>}
                    </div>
                    <div className="mt-1.5 text-[11px] text-gray-400 dark:text-navy-muted">{fmtDate(o.createdAt)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={() => setShowReport(true)} className="self-center pt-1 text-xs font-semibold text-gray-400 transition hover:text-red-500 dark:text-slate-500">⚠ Bu ilanı şikayet et</button>
      </motion.div>

      {showReport && (
        <ReportModal
          targetLabel={`İlan: ${l.title}`}
          onClose={() => setShowReport(false)}
          onSubmit={(p) => { onReport?.({ type: "listing", targetId: l.id, listingId: l.id, fromId: user?.id || null, fromName: user?.name || "misafir", ...p }); }}
        />
      )}
    </div>
  );
}
