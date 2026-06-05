import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LISTINGS } from "../data/listings";
import { CATS } from "../data/categories";
import SEO from "../components/SEO";

// ── "Sevkiyat Takibi" — logistics prototip (Shipment Review + Dark Detail) HamTed'e uyarlandi.
//    Acik ust (kunye + ozellikler) + koyu alt sayfa (zaman cizelgesi + nakliyeci).

const idText = (l) => "HMT-" + String(l.id).padStart(4, "0");

export default function TakipPage({ listings = LISTINGS, user, offers = [], getContact }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const l = listings.find((x) => String(x.id) === String(id));

  if (!l) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-16 text-center text-slate-900 dark:text-slate-100">
        <div className="text-4xl">📦</div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-slate-100">Takip kaydı bulunamadı</h1>
        <button onClick={() => navigate("/ilanlar")} className="rounded-full bg-yellow-400 px-5 py-2.5 text-xs font-extrabold text-slate-950">İlanlara dön</button>
      </div>
    );
  }

  const cat = CATS.find((c) => c.id === l.cat);
  const accepted = offers.find((o) => String(o.listingId) === String(l.id) && o.status === "kabul");
  const nakliyeci = accepted?.fromUser || "Atanmadı";
  const nakContact = accepted ? getContact?.(accepted.fromUserId) : null;
  const matched = l.status === "eslesti" || Boolean(accepted);
  const hasOffers = (l.offers || 0) > 0 || offers.some((o) => String(o.listingId) === String(l.id));

  const from = l.il;
  const fromSub = l.yukleme || l.ilce || "";
  const to = l.bosaltma ? l.bosaltma.split(",")[0] : (l.ilce || "Saha");
  const fiyat = accepted?.price ? `₺${accepted.price.toLocaleString("tr-TR")}` : (l.priceType === "sabit" && l.price ? `₺${l.price.toLocaleString("tr-TR")}` : "Teklife açık");
  const statusLabel = matched ? "Yolda" : hasOffers ? "Teklif aşaması" : "İlan yayında";

  // 4 adimli ilerleme (prototipteki gibi)
  const milestones = [
    { loc: from, status: "İlan oluşturuldu", time: l.createdText || "Bugün", done: true },
    { loc: from, status: hasOffers ? `${l.offers || 1} teklif alındı` : "Teklif bekleniyor", time: "Bugün", done: hasOffers },
    { loc: fromSub || from, status: matched ? `Eşleşti — ${nakliyeci}` : "Eşleşme bekleniyor", time: l.dateText || "—", done: matched },
    { loc: to, status: matched ? "Yükleme & taşıma" : "Teslim bekleniyor", time: l.dateText || "—", done: false },
  ];
  const doneCount = milestones.filter((m) => m.done).length;

  const SPECS = [
    ["Yükleme", from],
    ["Boşaltma", to],
    ["Durum", statusLabel],
    ["Miktar", l.amount ? `${l.amount} ${l.unit || ""}` : "—"],
    ["Malzeme", l.material || cat?.name || "—"],
    ["Tarih", l.dateText || "—"],
  ];

  // koyu detay grid (3. ekran)
  const DETAIL = [
    ["İş sahibi", l.owner || "—"],
    ["Nakliyeci", nakliyeci],
    ["Tutar", fiyat],
    ["Kategori", cat?.name || "—"],
  ];

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-4 px-4 pb-24 pt-2 text-slate-900 dark:text-slate-100">
      <SEO title={`Takip · ${l.title}`} description="Eşleşen işin sevkiyat takibi." />

      {/* Ust nav */}
      <div className="flex items-center justify-between pt-1">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm dark:bg-navy-card dark:text-slate-300">←</button>
        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Sevkiyat Takibi</span>
        <button onClick={() => navigate(`/ilan/${l.id}`)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm dark:bg-navy-card dark:text-slate-300">⋯</button>
      </div>

      {/* ACIK KUNYE KARTI */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm dark:bg-navy-card">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <span className="block text-[9px] font-bold uppercase text-gray-400 dark:text-navy-muted">Takip No</span>
            <span className="block text-base font-extrabold text-slate-900 dark:text-slate-100">{idText(l)}</span>
            <span className="mt-0.5 block max-w-[200px] truncate text-[11px] font-semibold text-gray-400 dark:text-navy-muted">{l.title}</span>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${matched ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>{statusLabel}</span>
        </div>

        {/* ozellik grid */}
        <div className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-3.5 pr-12">
          {SPECS.map(([k, v]) => (
            <div key={k}>
              <span className="block text-[9px] font-bold uppercase text-gray-400 dark:text-navy-muted">{k}</span>
              <span className="block text-[11px] font-extrabold text-slate-800 dark:text-slate-100">{v}</span>
            </div>
          ))}
        </div>

        {/* dekoratif sari kutu */}
        <div className="pointer-events-none absolute -right-3 top-20 flex h-24 w-24 rotate-[-8deg] items-center justify-center rounded-2xl bg-yellow-200/60 p-3 shadow-inner">
          <div className="relative flex h-full w-full flex-col justify-between rounded-lg bg-yellow-400/80">
            <div className="absolute h-1.5 w-full bg-yellow-500" />
            <div className="absolute left-1/2 h-full w-1.5 -translate-x-1/2 bg-yellow-500" />
            <div className="mb-2 mr-2 self-end rounded-[2px] bg-white/95 px-1 py-0.5 text-[5px] font-bold text-neutral-800">HAMTED</div>
          </div>
        </div>
      </motion.div>

      {/* KOYU TAKIP SAYFASI */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="flex flex-col gap-4 rounded-[32px] bg-slate-900 p-5 text-white">
        <div className="mx-auto h-1 w-10 rounded-full bg-slate-700" />

        {/* rota ozeti */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="block text-[9px] font-bold text-slate-500">Yükleme</span>
            <span className="block text-[11px] font-extrabold text-slate-100">{from}</span>
            <span className="block text-[9px] text-slate-500">{fromSub}</span>
          </div>
          <div className="text-right">
            <span className="block text-[9px] font-bold text-slate-500">Boşaltma · {l.dateText || "—"}</span>
            <span className="block text-[11px] font-extrabold text-slate-100">{to}</span>
          </div>
        </div>

        {/* ilerleme cubugu (4 nokta) */}
        <div className="flex items-center px-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-1 items-center last:flex-none">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-900 text-[7px] ${i < doneCount ? "bg-yellow-400 text-slate-950" : "bg-slate-800 text-slate-500"}`}>
                {i < doneCount ? "✓" : "•"}
              </span>
              {i < 3 && <span className={`mx-1 h-0 flex-1 border-t-2 border-dashed ${i < doneCount - 1 ? "border-yellow-400" : "border-slate-700"}`} />}
            </div>
          ))}
        </div>

        {/* milestone listesi */}
        <div className="flex flex-col gap-3.5 pt-1">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-start justify-between">
              <div>
                <span className="block text-[8px] text-slate-400">{m.loc}</span>
                <span className={`block text-[11px] font-extrabold ${m.done ? "text-slate-100" : "text-slate-400"}`}>{m.status}</span>
              </div>
              <span className="whitespace-nowrap text-[9px] font-bold text-slate-400">{m.time}</span>
            </div>
          ))}
        </div>

        {/* koyu detay grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-800 pt-4">
          {DETAIL.map(([k, v]) => (
            <div key={k}>
              <span className="block text-[8px] text-slate-500">{k}</span>
              <span className="block text-[11px] font-extrabold text-white">{v}</span>
            </div>
          ))}
        </div>

        {/* nakliyeci widget */}
        <div className="mt-1 flex items-center justify-between rounded-2xl bg-slate-800 p-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-yellow-400 bg-slate-700 text-sm font-extrabold text-yellow-400">
              {(nakliyeci || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="block text-[11px] font-extrabold text-white">{nakliyeci}</span>
              <span className="block text-[8px] text-slate-400">Nakliyeci</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {nakContact?.phone ? (
              <a href={`tel:${nakContact.phone}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400 text-sm text-slate-950">📞</a>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm text-slate-500">📞</span>
            )}
            <button onClick={() => navigate("/mesajlar")} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm text-slate-900">💬</button>
          </div>
        </div>
      </motion.div>

      {!matched && (
        <p className="px-2 text-center text-xs text-gray-400 dark:text-navy-muted">
          Bu iş henüz eşleşmedi. {user ? "Teklifler geldikçe takip burada güncellenir." : "Takip detayları eşleşme sonrası canlanır."}
        </p>
      )}
    </div>
  );
}
