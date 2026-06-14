import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { splitAmount, DEFAULT_FEE_RATE } from "../utils/payments";

// ── Cüzdan / hakediş — kabul edilen tekliflerden kazanç & harcama özeti + escrow durumu.

const fmt = (n) => "₺" + Math.round(n || 0).toLocaleString("tr-TR");
const listingOf = (listings, id) => listings.find((l) => String(l.id) === String(id));
const titleOf = (listings, id) => listingOf(listings, id)?.title || "ilan";
const isDone = (listings, id) => {
  const l = listingOf(listings, id);
  return l?.phase === "teslim" || l?.status === "kapali";
};
// Escrow durumu etiketi (ilana göre)
const payInfo = (listings, id) => {
  const s = listingOf(listings, id)?.paymentStatus || "yok";
  if (s === "serbest") return { label: "Ödendi", cls: "bg-emerald-100 text-emerald-700" };
  if (s === "bloke") return { label: "Emanette", cls: "bg-amber-100 text-amber-700" };
  if (s === "iade") return { label: "İade", cls: "bg-rose-100 text-rose-700" };
  return null;
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
  const pay = payInfo(listings, o.listingId);
  // Nakliyeci satırında komisyon sonrası net göster
  const net = sign === "+" ? splitAmount(o.price).payout : o.price;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 p-3.5 dark:border-navy-line">
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{titleOf(listings, o.listingId)}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className={`rounded-md px-1.5 py-0.5 font-bold ${done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{done ? "Tamamlandı" : "Devam ediyor"}</span>
          {pay && <span className={`rounded-md px-1.5 py-0.5 font-bold ${pay.cls}`}>{pay.label}</span>}
          <span className="text-gray-400">{sign === "+" ? o.fromUser : "—"}</span>
        </div>
      </div>
      <div className="whitespace-nowrap text-right">
        <div className={`text-base font-extrabold ${sign === "+" ? "text-emerald-600" : "text-slate-900 dark:text-slate-100"}`}>
          {sign}{fmt(net)}
        </div>
        {sign === "+" && <div className="text-[10px] text-gray-400">brüt {fmt(o.price)}</div>}
      </div>
    </div>
  );
}

export default function CuzdanPage({ user, listings = [], offers = [], onRequireAuth }) {
  const navigate = useNavigate();

  // Hook'lar her render'da aynı sırada çağrılmalı → erken return'den ÖNCE, null-safe.
  const earned = useMemo(() => (!user ? [] : offers.filter((o) => o.status === "kabul" && String(o.fromUserId) === String(user.id) && o.price)), [offers, user]);
  const spent = useMemo(() => (!user ? [] : offers.filter((o) => o.status === "kabul" && o.price && listings.some((l) => String(l.id) === String(o.listingId) && String(l.ownerId) === String(user.id)))), [offers, listings, user]);

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

  const sum = (arr) => arr.reduce((s, o) => s + (o.price || 0), 0);
  // Nakliyeci kazancı komisyon SONRASI net
  const sumNet = (arr) => arr.reduce((s, o) => s + splitAmount(o.price).payout, 0);
  const earnTotal = sumNet(earned);
  // Emanette bekleyen (bloke) vs serbest bırakılmış (ödendi)
  const stOf = (o) => listings.find((l) => String(l.id) === String(o.listingId))?.paymentStatus || "yok";
  const earnReleased = sumNet(earned.filter((o) => stOf(o) === "serbest"));
  const earnInEscrow = sumNet(earned.filter((o) => stOf(o) === "bloke"));
  const earnPending = earnTotal - earnReleased - earnInEscrow; // henüz ödeme başlamamış
  const spendTotal = sum(spent);
  const feeTotal = earned.reduce((s, o) => s + splitAmount(o.price).fee, 0);

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-4 px-4 pb-24 pt-2 text-slate-900 dark:text-slate-100">
      <SEO title="Cüzdan" description="Kazanç ve harcama özeti, hakediş durumu." />
      <h1 className="pt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">Cüzdan</h1>

      {/* Kazanç özeti */}
      <div className="rounded-[28px] bg-slate-950 p-5 text-white dark:bg-navy-card">
        <div className="text-xs text-slate-400">Net hakediş (komisyon sonrası)</div>
        <div className="mt-1 text-4xl font-black tracking-tight text-yellow-400">{fmt(earnTotal)}</div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <div><span className="text-slate-400">Ödendi </span><b className="text-emerald-400">{fmt(earnReleased)}</b></div>
          <div><span className="text-slate-400">Emanette </span><b className="text-amber-300">{fmt(earnInEscrow)}</b></div>
          <div><span className="text-slate-400">Bekleyen </span><b>{fmt(earnPending)}</b></div>
        </div>
        <div className="mt-4 rounded-xl bg-white/10 p-2.5 text-[11px] text-slate-300">
          🔒 Güvenli ödeme aktif — para emanette bloke kalır, <b>teslimde</b> serbest bırakılır. Platform komisyonu %{Math.round(DEFAULT_FEE_RATE * 100)} (toplam {fmt(feeTotal)}).
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
