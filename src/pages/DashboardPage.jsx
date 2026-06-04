import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CATS } from "../data/categories";
import CategoryIcon from "../components/CategoryIcon";
import SEO from "../components/SEO";

// ── MoveIQ LIGHT "Dashboard" tasarimi (Tailwind).

function StatCard({ icon, label, value, sub, accent = "text-slate-950", chip = "bg-slate-100" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-base ${chip}`}>{icon}</div>
        <span className="text-[11px] font-medium text-gray-500">{label}</span>
      </div>
      <div>
        <div className={`text-3xl font-extrabold tracking-tight ${accent}`}>{value ?? "—"}</div>
        {sub && <div className="mt-1 text-[11px] font-medium text-gray-400">{sub}</div>}
      </div>
    </motion.div>
  );
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }); }
  catch { return ""; }
}

const QUICK = "rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-gray-50";

export default function DashboardPage({ user, listings = [], offers = [], messages = [], onRequireAuth }) {
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-12 text-center text-slate-900">
        <div className="text-5xl">🔒</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Paneli görmek için giriş yapın</h1>
        <button onClick={() => onRequireAuth?.()} className="mt-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">Giriş yap / Kayıt ol</button>
      </div>
    );
  }

  const isNakliyeci = user.role === "nakliyeci";
  const myListings = useMemo(() => listings.filter((l) => l.ownerId === user.id), [listings, user.id]);
  const myOffers = useMemo(() => offers.filter((o) => String(o.fromUserId) === String(user.id)), [offers, user.id]);

  const acceptedOffers = myOffers.filter((o) => o.status === "kabul");
  const totalTrips = acceptedOffers.length;
  const totalTon = useMemo(() => acceptedOffers.reduce((sum, o) => {
    const l = listings.find((x) => String(x.id) === String(o.listingId));
    return sum + (l?.amount || 0);
  }, 0), [acceptedOffers, listings]);
  const totalEarnings = useMemo(() => acceptedOffers.reduce((sum, o) => sum + (o.price || 0), 0), [acceptedOffers]);
  const activeVehicles = myListings.filter((l) => l.type === "arac" && l.status === "aktif").length;

  const activeListings = myListings.filter((l) => l.status === "aktif").length;
  const matchedListings = myListings.filter((l) => l.status === "eslesti").length;
  const pendingOffers = useMemo(() => offers.filter((o) =>
    o.status === "beklemede" && myListings.some((l) => String(l.id) === String(o.listingId))
  ).length, [offers, myListings]);
  const totalVolume = useMemo(() => myListings.filter((l) => l.status === "eslesti").reduce((s, l) => s + (l.amount || 0), 0), [myListings]);

  const activity = useMemo(() => {
    const items = [
      ...messages.filter((m) => String(m.fromId) === String(user.id) || String(m.toId) === String(user.id)).map((m) => ({
        key: `msg-${m.id}`, icon: "💬", text: `${m.fromId === user.id ? "Mesaj gönderdiniz" : `${m.fromName} mesaj gönderdi`}: "${m.text.slice(0, 40)}${m.text.length > 40 ? "…" : ""}"`, date: m.createdAt, link: "/mesajlar",
      })),
      ...offers.filter((o) => String(o.fromUserId) === String(user.id)).map((o) => ({
        key: `offer-${o.id}`, icon: o.status === "kabul" ? "✅" : o.status === "ret" ? "❌" : "📝",
        text: `Teklif ${o.status === "kabul" ? "kabul edildi" : o.status === "ret" ? "reddedildi" : "gönderildi"}${o.price ? ` — ${o.price.toLocaleString("tr-TR")} ₺` : ""}`,
        date: o.createdAt, link: `/ilan/${o.listingId}`,
      })),
      ...offers.filter((o) => o.status !== "beklemede" && myListings.some((l) => String(l.id) === String(o.listingId))).map((o) => ({
        key: `recv-${o.id}`, icon: o.status === "kabul" ? "🤝" : "📨",
        text: `${o.fromUser} teklif ${o.status === "kabul" ? "kabul edildi" : "reddedildi"}${o.price ? ` — ${o.price.toLocaleString("tr-TR")} ₺` : ""}`,
        date: o.createdAt, link: "/ilanlarim",
      })),
    ];
    return items.sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 10);
  }, [messages, offers, myListings, user.id]);

  const roleLabel = isNakliyeci ? "Nakliyeci" : user.role === "tedarikci" ? "Tedarikçi" : "İş Veren";
  const roleCls = isNakliyeci ? "text-emerald-700 bg-emerald-100" : user.role === "tedarikci" ? "text-sky-700 bg-sky-100" : "text-amber-700 bg-amber-100";

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-5 px-4 pb-24 pt-2 text-slate-900">
      <SEO title="Panelim" description="Kazanç özeti, sefer istatistikleri ve son aktiviteniz." />

      {/* Karsilama */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Merhaba, {user.name} 👋</h1>
          </div>
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${roleCls}`}>{roleLabel}</span>
        </div>
        <button onClick={() => navigate("/ilan-ver")} className="rounded-full bg-yellow-400 px-4 py-2.5 text-xs font-extrabold text-slate-950">+ İlan ver</button>
      </div>

      <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-950">Faaliyet özetin.</h2>

      {/* Istatistikler */}
      <div className="grid grid-cols-2 gap-3">
        {isNakliyeci ? (<>
          <StatCard icon="🚛" label="Tamamlanan sefer" value={totalTrips} sub="Kabul edilen teklif" />
          <StatCard icon="⚖️" label="Toplam taşınan" value={totalTon > 0 ? `${totalTon.toLocaleString("tr-TR")} t` : "—"} sub="Kabul edilen işler" chip="bg-sky-100" />
          <StatCard icon="💰" label="Tahmini kazanç" value={totalEarnings > 0 ? `${totalEarnings.toLocaleString("tr-TR")}₺` : "—"} sub="Fiyatlı teklifler" chip="bg-emerald-100" />
          <StatCard icon="🚗" label="Aktif araç ilanı" value={activeVehicles} sub="Şu an yayında" chip="bg-amber-100" />
        </>) : (<>
          <StatCard icon="📋" label="Aktif ilan" value={activeListings} sub="Şu an yayında" />
          <StatCard icon="🤝" label="Eşleşen ilan" value={matchedListings} sub="Nakliyeci bulundu" chip="bg-emerald-100" />
          <StatCard icon="📨" label="Bekleyen teklif" value={pendingOffers} sub="Yanıt bekleniyor" chip="bg-amber-100" />
          <StatCard icon="⚖️" label="Toplam iş hacmi" value={totalVolume > 0 ? `${totalVolume.toLocaleString("tr-TR")} t` : "—"} sub="Eşleşen ilanlar" chip="bg-sky-100" />
        </>)}
      </div>

      {/* Ilanlarim ozeti */}
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-950">{isNakliyeci ? "Araç ilanlarım" : "İlanlarım"}</h2>
          <button onClick={() => navigate("/ilanlarim")} className="text-xs font-semibold text-gray-500">Tümü →</button>
        </div>
        {myListings.length === 0 ? (
          <div className="py-5 text-center text-sm text-gray-400">
            Henüz ilan yok.<br />
            <button onClick={() => navigate("/ilan-ver")} className="mt-1.5 font-bold text-amber-600">İlk ilanı ver →</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {myListings.slice(0, 5).map((l) => {
              const cat = CATS.find((c) => c.id === l.cat);
              const lOffers = offers.filter((o) => String(o.listingId) === String(l.id));
              const sCls = l.status === "eslesti" ? "text-emerald-700 bg-emerald-100"
                : l.status === "kapali" ? "text-gray-500 bg-slate-100" : "text-amber-700 bg-amber-100";
              const sLbl = l.status === "eslesti" ? "Eşleşti" : l.status === "kapali" ? "Kapalı" : "Aktif";
              return (
                <div key={l.id} onClick={() => navigate(`/ilan/${l.id}`)} className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-gray-100 p-3">
                  <CategoryIcon catId={l.cat} size={18} fallback={cat?.icon} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-950">{l.title}</div>
                    <div className="text-[11px] text-gray-500">{l.il} • {lOffers.length} teklif</div>
                  </div>
                  <span className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[10.5px] font-bold ${sCls}`}>{sLbl}</span>
                  {l.recurring && <span title="Düzenli iş" className="text-sm">🔁</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Son aktivite */}
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-slate-950">Son aktivite</h2>
        {activity.length === 0 ? (
          <div className="py-5 text-center text-sm text-gray-400">Henüz aktivite yok.<br />İlan vererek veya teklif göndererek başlayın.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {activity.map((a) => (
              <div key={a.key} onClick={() => navigate(a.link)} className="flex cursor-pointer gap-2.5 rounded-2xl border border-gray-100 p-3">
                <span className="flex-shrink-0 text-lg">{a.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-snug text-slate-800">{a.text}</div>
                  {a.date && <div className="mt-1 text-[11px] text-gray-400">{fmtDate(a.date)}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hizli eylemler */}
      <div className="flex flex-wrap gap-2">
        {isNakliyeci ? (<>
          <button onClick={() => navigate("/ilanlar?type=is")} className={QUICK}>🔍 İş ilanlarına bak</button>
          <button onClick={() => navigate("/ilan-ver")} className={QUICK}>🚛 Araç ilanı ver</button>
        </>) : (<>
          <button onClick={() => navigate("/ilanlarim")} className={QUICK}>📋 Teklifleri yönet</button>
          <button onClick={() => navigate("/ilan-ver")} className={QUICK}>📢 Yeni ilan ver</button>
        </>)}
        <button onClick={() => navigate("/mesajlar")} className={QUICK}>💬 Mesajlar</button>
        <button onClick={() => navigate("/profil")} className={QUICK}>👤 Profil</button>
      </div>
    </div>
  );
}
