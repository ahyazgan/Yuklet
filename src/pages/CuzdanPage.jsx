import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";

// ── Cüzdan / hakediş — kabul edilen tekliflerden kazanç & harcama özeti.
//    (Gerçek ödeme/escrow dış servis gerektirir; bu ekran muhasebe/özet katmanı.)

const fmt = (n) => "₺" + Math.round(n || 0).toLocaleString("tr-TR");
const titleOf = (listings, id) => listings.find((l) => String(l.id) === String(id))?.title || "ilan";
const isDone = (listings, id) => {
  const l = listings.find((x) => String(x.id) === String(id));
  return l?.phase === "teslim" || l?.status === "kapali";
};

function Stat({ label, value, sub, accent = "text-slate-950 dark:text-slate-100" }) {
  return (
    <div className="flex-1 rounded-3xl bg-white p-4 shadow-sm dark:bg-navy-card">
      <div className="text-[11px] font-medium text-gray-500 dark:text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold tracking-tight ${accent}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-gray-400 dark:text-slate-500">{sub}</div>}
    </div>
  );
}

function Row({ listings, o, sign }) {
  const done = isDone(listings, o.listingId);
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 p-3.5 dark:border-navy-line">
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{titleOf(listings, o.listingId)}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
          <span className={`rounded-md px-1.5 py-0.5 font-bold ${done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{done ? "Tamamlandı" : "Devam ediyor"}</span>
          <span className="text-gray-400">{sign === "+" ? o.fromUser : "—"}</span>
        </div>
      </div>
      <div className={`whitespace-nowrap text-base font-extrabold ${sign === "+" ? "text-emerald-600" : "text-slate-900 dark:text-slate-100"}`}>
        {sign}{fmt(o.price)}
      </div>
    </div>
  );
}

export default function CuzdanPage({ user, listings = [], offers = [], onRequireAuth }) {
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-12 text-center text-slate-900 dark:text-slate-100">
        <SEO title="Cüzdan" />
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-slate-100">Cüzdan için giriş yapın</h1>
        <button onClick={() => onRequireAuth?.()} className="mt-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white dark:bg-navy-soft">Giriş yap / Kayıt ol</button>
      </div>
    );
  }

  const earned = useMemo(() => offers.filter((o) => o.status === "kabul" && String(o.fromUserId) === String(user.id) && o.price), [offers, user.id]);
  const spent = useMemo(() => offers.filter((o) => o.status === "kabul" && o.price && listings.some((l) => String(l.id) === String(o.listingId) && String(l.ownerId) === String(user.id))), [offers, listings, user.id]);

  const sum = (arr) => arr.reduce((s, o) => s + (o.price || 0), 0);
  const earnTotal = sum(earned);
  const earnPending = sum(earned.filter((o) => !isDone(listings, o.listingId)));
  const earnDone = earnTotal - earnPending;
  const spendTotal = sum(spent);

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-4 px-4 pb-24 pt-2 text-slate-900 dark:text-slate-100">
      <SEO title="Cüzdan" description="Kazanç ve harcama özeti, hakediş durumu." />
      <h1 className="pt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">Cüzdan</h1>

      {/* Kazanç özeti */}
      <div className="rounded-[28px] bg-slate-950 p-5 text-white dark:bg-navy-card">
        <div className="text-xs text-slate-400">Toplam hakediş (kabul edilen işler)</div>
        <div className="mt-1 text-4xl font-black tracking-tight text-yellow-400">{fmt(earnTotal)}</div>
        <div className="mt-3 flex gap-4 text-xs">
          <div><span className="text-slate-400">Bekleyen </span><b>{fmt(earnPending)}</b></div>
          <div><span className="text-slate-400">Tamamlanan </span><b className="text-emerald-400">{fmt(earnDone)}</b></div>
        </div>
        <div className="mt-4 rounded-xl bg-white/10 p-2.5 text-[11px] text-slate-300">
          💡 Güvenli ödeme (escrow) yakında — iş tamamlanınca hakediş otomatik serbest kalacak.
        </div>
      </div>

      <div className="flex gap-2.5">
        <Stat label="Kabul edilen iş" value={earned.length} sub="Teklifin kabul edildi" />
        <Stat label="Harcama" value={fmt(spendTotal)} sub={`${spent.length} kabul`} accent="text-slate-950 dark:text-slate-100" />
      </div>

      {/* Kazançlarım */}
      {earned.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">Kazançlarım</h2>
          {earned.map((o) => <Row key={o.id} listings={listings} o={o} sign="+" />)}
        </section>
      )}

      {/* Harcamalarım */}
      {spent.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">Harcamalarım</h2>
          {spent.map((o) => <Row key={o.id} listings={listings} o={o} sign="−" />)}
        </section>
      )}

      {earned.length === 0 && spent.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-white py-14 text-center shadow-sm dark:bg-navy-card">
          <div className="text-4xl">💸</div>
          <div className="text-base font-bold text-slate-950 dark:text-slate-100">Henüz hareket yok</div>
          <div className="text-sm text-gray-500 dark:text-slate-400">Teklif kabul edildikçe hakediş burada görünür.</div>
          <button onClick={() => navigate("/ilanlar")} className="mt-2 rounded-full bg-yellow-400 px-5 py-2.5 text-xs font-extrabold text-slate-950">İlanlara göz at</button>
        </div>
      )}
    </div>
  );
}
