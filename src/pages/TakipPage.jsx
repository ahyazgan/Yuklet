import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LISTINGS } from "../data/listings";
import { CATS } from "../data/categories";
import { StarsDisplay, StarsInput } from "../components/Stars";
import SEO from "../components/SEO";

// ── "Sevkiyat Takibi" — logistics prototip (Shipment Review + Dark Detail) HamTed'e uyarlandi.
//    Acik ust (kunye + ozellikler) + koyu alt sayfa (zaman cizelgesi + nakliyeci).

const idText = (l) => "HMT-" + String(l.id).padStart(4, "0");

const PHASES = [["eslesti", "Eşleşti"], ["yuklendi", "Yüklendi"], ["yolda", "Yolda"], ["teslim", "Teslim"]];

export default function TakipPage({ listings = LISTINGS, user, offers = [], getContact, reviews = [], onAddReview, getUserRating, onUpdateListing }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rateVal, setRateVal] = useState(0);
  const [rateComment, setRateComment] = useState("");
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

  // ── Karşılıklı değerlendirme (eşleşince) ──
  const isOwner = user && String(user.id) === String(l.ownerId);
  const isNakliyeci = accepted && user && String(user.id) === String(accepted.fromUserId);
  const counterpart = matched
    ? (isOwner ? { id: accepted?.fromUserId, name: nakliyeci, role: "Nakliyeci" }
      : isNakliyeci ? { id: l.ownerId, name: l.owner, role: "İş sahibi" } : null)
    : null;
  const myReview = counterpart && reviews.find(
    (r) => String(r.fromId) === String(user.id) && String(r.toId) === String(counterpart.id) && String(r.listingId) === String(l.id)
  );
  const counterpartRating = counterpart ? getUserRating?.(counterpart.id) : null;

  // ── İş durumu akışı ──
  const canManage = matched && (isOwner || isNakliyeci);
  const phase = l.phase || (matched ? "eslesti" : null);
  const phaseIdx = PHASES.findIndex((p) => p[0] === phase);
  const nextPhase = phaseIdx >= 0 && phaseIdx < PHASES.length - 1 ? PHASES[phaseIdx + 1] : null;
  const estTrips = l.amount && (l.unit === "ton" || l.unit === "m³") ? Math.ceil(l.amount / 18) : null;
  const advancePhase = () => {
    if (!nextPhase) return;
    onUpdateListing?.(l.id, { phase: nextPhase[0], ...(nextPhase[0] === "teslim" ? { status: "kapali" } : {}) });
  };

  const submitReview = () => {
    if (!counterpart || !rateVal) return;
    onAddReview?.({
      id: Date.now(), listingId: l.id, offerId: accepted?.id,
      fromId: user.id, fromName: user.name, toId: counterpart.id, toName: counterpart.name,
      rating: rateVal, comment: rateComment.trim(), createdAt: new Date().toISOString(),
    });
    setRateVal(0); setRateComment("");
  };

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

      {/* IS DURUMU AKISI */}
      {phase && (
        <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-navy-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">İş durumu</h2>
            {estTrips && <span className="text-xs text-gray-500 dark:text-slate-400">{l.tripsDone || 0}/{estTrips} sefer</span>}
          </div>
          <div className="flex items-center">
            {PHASES.map(([k], i) => (
              <div key={k} className="flex flex-1 items-center last:flex-none">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${i <= phaseIdx ? "bg-yellow-400 text-slate-950" : "bg-gray-100 text-gray-400 dark:bg-navy-soft dark:text-slate-500"}`}>{i < phaseIdx ? "✓" : i + 1}</span>
                {i < PHASES.length - 1 && <span className={`mx-1 h-0.5 flex-1 ${i < phaseIdx ? "bg-yellow-400" : "bg-gray-200 dark:bg-navy-line"}`} />}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between">
            {PHASES.map(([k, lbl], i) => (
              <span key={k} className={`flex-1 text-center text-[9.5px] font-semibold ${i <= phaseIdx ? "text-amber-600" : "text-gray-400 dark:text-slate-500"}`}>{lbl}</span>
            ))}
          </div>
          {canManage && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {nextPhase && (
                <button onClick={advancePhase} className="rounded-full bg-slate-950 px-5 py-2.5 text-xs font-bold text-white dark:bg-navy-soft dark:text-slate-100">
                  {nextPhase[1]} olarak işaretle →
                </button>
              )}
              {estTrips && phaseIdx >= 1 && (l.tripsDone || 0) < estTrips && (
                <button onClick={() => onUpdateListing?.(l.id, { tripsDone: (l.tripsDone || 0) + 1 })} className="rounded-full border border-gray-200 px-4 py-2.5 text-xs font-bold text-slate-700 dark:border-navy-line dark:text-slate-200">+1 sefer</button>
              )}
              {phase === "teslim" && <span className="text-xs font-bold text-emerald-600">✓ Teslim edildi — iş tamamlandı</span>}
            </div>
          )}
          {!canManage && phase === "teslim" && <p className="mt-3 text-xs font-semibold text-emerald-600">✓ Bu iş tamamlandı.</p>}
        </div>
      )}

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

      {/* Sözleşme / irsaliye */}
      {matched && accepted && (
        <button onClick={() => navigate(`/sozlesme/${accepted.id}`)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 dark:border-navy-line dark:bg-navy-card dark:text-slate-100">
          📄 Taşıma sözleşmesi / irsaliye
        </button>
      )}

      {/* Karşılıklı değerlendirme */}
      {counterpart && (
        <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-navy-card">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">{counterpart.role} değerlendirmesi</h2>
            {counterpartRating && <StarsDisplay value={counterpartRating.avg} count={counterpartRating.count} className="text-xs" />}
          </div>
          {myReview ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <StarsDisplay value={myReview.rating} className="text-sm" /> Değerlendirdin, teşekkürler ✓
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs text-gray-500 dark:text-slate-400"><b className="text-slate-700 dark:text-slate-200">{counterpart.name}</b> ile çalışman nasıldı? Puan ver, topluluk güvenini büyüt.</p>
              <StarsInput value={rateVal} onChange={setRateVal} />
              <textarea value={rateComment} onChange={(e) => setRateComment(e.target.value)} placeholder="Kısa yorum (opsiyonel)"
                className="mt-3 min-h-[64px] w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 dark:bg-navy-soft dark:text-slate-100" />
              <button onClick={submitReview} disabled={!rateVal} className="mt-3 w-full rounded-2xl bg-yellow-400 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-yellow-500 disabled:opacity-50">Değerlendir</button>
            </>
          )}
        </div>
      )}

      {!matched && (
        <p className="px-2 text-center text-xs text-gray-400 dark:text-navy-muted">
          Bu iş henüz eşleşmedi. {user ? "Teklifler geldikçe takip burada güncellenir." : "Takip detayları eşleşme sonrası canlanır."}
        </p>
      )}
    </div>
  );
}
