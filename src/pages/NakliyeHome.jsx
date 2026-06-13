import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LISTINGS } from "../data/listings";
import { CATS } from "../data/categories";
import CategoryIcon from "../components/CategoryIcon";
import SEO from "../components/SEO";

// ── "Dashboard Home" (logistics prototip) HamTed'e uyarlandi — sari MoveIQ paleti, hafriyat/silobas verisi.
// Light = varsayilan; dark: varyantlari navy paleti (DESIGN.md §2d eslemesi).

const PERSONAS = [
  { id: "muteahhit", letter: "M", title: "Müteahhit / Alıcı", desc: "İş ilanı aç, teklif topla", route: "/muteahhit", ring: "text-amber-600 bg-amber-100" },
  { id: "tedarikci", letter: "T", title: "Tedarikçi", desc: "Ocak/santral ürününü listele", route: "/tedarikci", ring: "text-emerald-600 bg-emerald-100" },
  { id: "nakliyeci", letter: "N", title: "Nakliyeci", desc: "Araç ilanı ver, yük bul", route: "/nakliyeci", ring: "text-sky-600 bg-sky-100" },
];

const STATUS_PILL = {
  aktif: "bg-amber-50 text-amber-600",
  eslesti: "bg-emerald-50 text-emerald-600",
  kapali: "bg-slate-100 text-slate-500",
};
const STATUS_TR = { aktif: "Yayında", eslesti: "Eşleşti", kapali: "Kapandı" };
const idText = (l) => "HMT-" + String(l.id).padStart(4, "0");

export default function NakliyeHome({ listings = LISTINGS }) {
  const navigate = useNavigate();
  const open = listings.filter((l) => l.status !== "kapali");

  const current = open.find((l) => l.type === "is") || open[0];
  const recent = open.filter((l) => l !== current).slice(0, 3);

  const hasOffers = current && (current.offers || 0) > 0;
  const matched = current && current.status === "eslesti";

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-5 px-4 pb-24 pt-2 text-slate-900 dark:text-slate-100">
      <SEO description="Hafriyat ve silobas işleri doğru araçla buluşuyor. Müteahhit, tedarikçi ve nakliyeciler için Türkiye'nin yük eşleştirme platformu." />

      {/* KONUM + BILDIRIM */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white text-slate-600 shadow-sm dark:border-navy-line dark:bg-navy-card dark:text-slate-300">🚚</div>
          <div>
            <span className="block text-[9px] font-semibold leading-tight text-gray-400 dark:text-navy-muted">Yük borsası</span>
            <span className="block text-xs font-bold leading-tight text-slate-800 dark:text-slate-100">Türkiye geneli</span>
          </div>
        </div>
        <button onClick={() => navigate("/mesajlar")} aria-label="Bildirimler" className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white text-slate-600 shadow-sm dark:border-navy-line dark:bg-navy-card dark:text-slate-300">
          🔔
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-yellow-400 dark:border-navy-card" />
        </button>
      </div>

      {/* ARAMA + FILTRE */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center rounded-2xl border border-gray-100 bg-white px-3.5 py-3 shadow-sm dark:border-navy-line dark:bg-navy-card">
          <span className="mr-2 text-xs text-gray-400 dark:text-navy-muted">🔍</span>
          <input
            placeholder="İl, malzeme veya güzergah ara…"
            onKeyDown={(e) => { if (e.key === "Enter") navigate("/ilanlar"); }}
            aria-label="İlan ara"
            className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none placeholder:text-gray-400 dark:text-slate-100 dark:placeholder:text-navy-muted"
          />
        </div>
        <button onClick={() => navigate("/ilanlar")} aria-label="Tüm ilanlar" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg text-white shadow-md transition active:scale-95 dark:bg-navy-soft dark:text-slate-100">☰</button>
      </div>

      {/* PROMO KARTLAR */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate("/ilan-ver")} className="relative flex h-28 flex-col justify-between overflow-hidden rounded-[20px] border border-gray-100 bg-white p-3.5 text-left shadow-sm transition hover:shadow-md dark:border-navy-line dark:bg-navy-card">
          <div className="text-[13px] font-extrabold leading-tight text-slate-900 dark:text-slate-100">Yeni<br />İlan</div>
          <span className="absolute -bottom-1 -right-1 text-4xl">🚛</span>
          <span className="text-[10px] font-bold text-amber-600">+ Oluştur</span>
        </button>
        <button onClick={() => current && navigate(`/takip/${current.id}`)} className="relative flex h-28 flex-col justify-between overflow-hidden rounded-[20px] bg-yellow-400 p-3.5 text-left shadow-sm transition hover:shadow-md">
          <div className="text-[13px] font-extrabold leading-tight text-slate-950">İlan<br />Takip</div>
          <span className="absolute -bottom-1 -right-1 text-4xl">📦</span>
          <span className="text-[10px] font-bold text-slate-800">Sevkiyatı izle</span>
        </button>
      </div>

      {/* BOS DONUS FIRSATI */}
      <button onClick={() => navigate("/ilanlar?mode=backhaul")} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950 p-4 text-left text-white shadow-sm transition hover:-translate-y-0.5 dark:bg-navy-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-lg">🔄</span>
          <div>
            <div className="text-sm font-extrabold">Boş dönme — dönüş yükü bul</div>
            <div className="text-[11px] text-slate-400">Aracının olduğu ile yakın açık yükler</div>
          </div>
        </div>
        <span className="text-xl text-yellow-400">›</span>
      </button>

      {/* AKTIF SEVKIYAT */}
      {current && (
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Aktif sevkiyat</span>
            <button onClick={() => navigate("/ilanlar")} className="text-[10px] font-bold text-gray-400 dark:text-navy-muted">Tümü</button>
          </div>

          <motion.button
            onClick={() => navigate(`/takip/${current.id}`)}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="relative w-full overflow-hidden rounded-[24px] border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:shadow-md dark:border-navy-line dark:bg-navy-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-slate-50 dark:border-navy-line dark:bg-navy-soft">
                  <CategoryIcon catId={current.cat} size={18} fallback={current.cat === "silobas" ? "🛢️" : "🚛"} />
                </div>
                <div>
                  <span className="block text-[11px] font-extrabold text-slate-900 dark:text-slate-100">No: {idText(current)}</span>
                  <span className="block max-w-[150px] truncate text-[9px] font-bold text-gray-400 dark:text-navy-muted">{current.title}</span>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${matched ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{matched ? "Yolda" : "Teklif"}</span>
            </div>

            {/* tracker cizgi */}
            <div className="relative mt-4 flex items-center justify-between px-2">
              <div className="absolute left-6 right-6 top-[5px] z-0 h-[2px] border-t-2 border-dashed border-yellow-400" />
              <span className="z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-yellow-400 text-[6px] text-slate-950 shadow-sm dark:border-navy-card">✓</span>
              <span className={`z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white text-[6px] shadow-sm dark:border-navy-card ${hasOffers ? "bg-yellow-400 text-slate-950" : "bg-slate-200 dark:bg-navy-line"}`}>{hasOffers ? "✓" : ""}</span>
              <div className="relative -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[8px] text-slate-950 shadow-sm">
                🚚
                <span className="absolute -bottom-4 whitespace-nowrap text-[7px] font-bold text-amber-600">{matched ? "Yolda" : `${current.offers || 0} teklif`}</span>
              </div>
              <span className="z-10 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-200 shadow-sm dark:border-navy-card dark:bg-navy-line" />
            </div>

            {/* rota */}
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-50 pt-2.5 dark:border-navy-line">
              <div>
                <span className="block text-[8px] font-bold uppercase text-gray-400 dark:text-navy-muted">{current.dateText || "—"}</span>
                <span className="block text-[9px] font-extrabold text-slate-700 dark:text-slate-100">{current.il}{current.ilce ? `, ${current.ilce}` : ""}</span>
              </div>
              <div className="text-right">
                <span className="block text-[8px] font-bold uppercase text-gray-400 dark:text-navy-muted">Boşaltma</span>
                <span className="block text-[9px] font-extrabold text-slate-700 dark:text-slate-100">{current.bosaltma ? current.bosaltma.split(",")[0] : "Saha"}</span>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-4 top-6 h-20 w-20 rotate-12 rounded-lg bg-yellow-400/20" />
          </motion.button>
        </section>
      )}

      {/* SON ILANLAR */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Son ilanlar</span>
          <button onClick={() => navigate("/ilanlar")} className="text-[10px] font-bold text-gray-400 dark:text-navy-muted">Tümü</button>
        </div>
        <div className="flex flex-col gap-2.5">
          {recent.map((l) => {
            const cat = CATS.find((c) => c.id === l.cat);
            return (
              <button key={l.id} onClick={() => navigate(`/ilan/${l.id}`)} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm transition hover:shadow-md dark:border-navy-line dark:bg-navy-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-navy-soft">
                    <CategoryIcon catId={l.cat} size={18} fallback={cat?.icon} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-extrabold text-slate-900 dark:text-slate-100">No: {idText(l)}</span>
                    <span className="block max-w-[180px] truncate text-[9px] font-bold text-gray-400 dark:text-navy-muted">{l.title}</span>
                  </div>
                </div>
                <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[8px] font-extrabold ${STATUS_PILL[l.status] || STATUS_PILL.aktif}`}>{STATUS_TR[l.status] || "Yayında"}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ROLLER */}
      <section className="flex flex-col gap-3">
        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Ne yapmak istiyorsun?</span>
        {PERSONAS.map((p, i) => (
          <motion.button
            key={p.id}
            onClick={() => navigate(p.route)}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}
            className="flex w-full items-center gap-3.5 rounded-2xl border border-gray-100 bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 dark:border-navy-line dark:bg-navy-card"
          >
            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-base font-extrabold ${p.ring}`}>{p.letter}</span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold text-slate-950 dark:text-slate-100">{p.title}</span>
              <span className="block text-[11px] text-gray-500 dark:text-slate-400">{p.desc}</span>
            </span>
            <span className="ml-auto text-xl text-gray-300 dark:text-slate-600">›</span>
          </motion.button>
        ))}
      </section>
    </div>
  );
}
