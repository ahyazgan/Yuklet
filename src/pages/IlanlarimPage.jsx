import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CATS } from "../data/categories";
import CategoryIcon from "../components/CategoryIcon";
import { useToast } from "../components/Toast";
import SEO from "../components/SEO";

// ── MoveIQ LIGHT ilanlarim (Tailwind).

const STATUS_STYLE = {
  beklemede: { label: "Beklemede", cls: "text-amber-700 bg-amber-100" },
  kabul: { label: "Kabul edildi", cls: "text-emerald-700 bg-emerald-100" },
  ret: { label: "Reddedildi", cls: "text-red-700 bg-red-100" },
};

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

const ACTION = "rounded-full border border-gray-200 dark:border-navy-line bg-white dark:bg-navy-card px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-navy-soft";

export default function IlanlarimPage({ listings = [], user, offers = [], onUpdateOffer, onUpdateListing, onDeleteListing, onRequireAuth, getContact }) {
  const navigate = useNavigate();
  const toast = useToast();

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-12 text-center text-slate-900 dark:text-slate-100">
        <div className="text-5xl">🔒</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">İlanlarınızı görmek için giriş yapın</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Açtığınız ilanları ve gelen teklifleri burada yönetebilirsiniz.</p>
        <button onClick={() => onRequireAuth?.()} className="mt-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white dark:bg-navy-soft dark:text-slate-100">Giriş yap / Kayıt ol</button>
      </div>
    );
  }

  const myListings = listings.filter((l) => l.ownerId && l.ownerId === user.id);

  const accept = (listing, offer) => {
    onUpdateOffer?.(offer.id, { status: "kabul" });
    onUpdateListing?.(listing.id, { status: "eslesti" });
    toast("Teklif kabul edildi, ilan eşleşti", "success");
  };
  const reject = (offer) => {
    onUpdateOffer?.(offer.id, { status: "ret" });
    toast("Teklif reddedildi", "info");
  };
  const renew = (l) => {
    onUpdateListing?.(l.id, { status: "aktif", createdText: "az önce" });
    toast("İlan yenilendi ve tekrar yayında", "success");
  };
  const del = (l) => {
    if (window.confirm(`"${l.title}" ilanını silmek istediğinize emin misiniz?`)) {
      onDeleteListing?.(l.id);
      toast("İlan silindi", "info");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-4 px-4 pb-24 pt-2 text-slate-900 dark:text-slate-100">
      <SEO title="İlanlarım" description="Açtığınız ilanlar ve gelen teklifler. Teklifleri kabul edin veya reddedin." />
      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">İlanlarım</h1>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{myListings.length} ilan · gelen teklifleri yönetin</p>
        </div>
        <button onClick={() => navigate("/ilan-ver")} className="rounded-full bg-yellow-400 px-4 py-2.5 text-xs font-extrabold text-slate-950">+ İlan ver</button>
      </div>

      {myListings.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-navy-card py-14 text-center text-sm text-gray-400 dark:text-navy-muted shadow-sm">
          Henüz ilanınız yok. <button onClick={() => navigate("/ilan-ver")} className="font-bold text-amber-600">İlk ilanı verin</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {myListings.map((l) => {
            const cat = CATS.find((c) => c.id === l.cat);
            const lOffers = offers.filter((o) => String(o.listingId) === String(l.id));
            const matched = l.status === "eslesti";
            const closed = l.status === "kapali";
            return (
              <motion.div key={l.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white dark:bg-navy-card p-5 shadow-sm">
                {/* Baslik */}
                <div className="mb-1 flex items-center gap-2.5">
                  <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5" onClick={() => navigate(`/ilan/${l.id}`)}>
                    <CategoryIcon catId={l.cat} size={22} fallback={cat?.icon} />
                    <h3 className="truncate text-base font-bold text-slate-950 dark:text-slate-100">{l.title}</h3>
                  </div>
                  {matched && <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">✓ Eşleşti</span>}
                  {closed && <span className="rounded-md bg-slate-100 dark:bg-navy-soft px-2 py-0.5 text-[11px] font-bold text-gray-500 dark:text-slate-400">Kapalı</span>}
                </div>
                <div className="mb-3 text-xs text-gray-500 dark:text-slate-400">📍 {l.il} / {l.ilce} • {l.amount} {l.unit} • {lOffers.length} teklif</div>

                {/* Aksiyonlar */}
                <div className="mb-3.5 flex flex-wrap gap-2">
                  <button onClick={() => navigate(`/ilan-duzenle/${l.id}`)} className={ACTION}>Düzenle</button>
                  {!matched && (
                    <button onClick={() => onUpdateListing?.(l.id, { status: closed ? "aktif" : "kapali" })} className={ACTION}>{closed ? "Tekrar aç" : "Kapat"}</button>
                  )}
                  {l.recurring && (
                    <button onClick={() => renew(l)} className="rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700">🔁 Yenile</button>
                  )}
                  <button onClick={() => del(l)} className="rounded-full border border-red-200 bg-white dark:bg-navy-card px-3.5 py-2 text-xs font-semibold text-red-600">Sil</button>
                </div>

                {/* Teklifler */}
                {lOffers.length === 0 ? (
                  <div className="border-t border-gray-100 dark:border-navy-line pt-3 text-sm text-gray-400 dark:text-navy-muted">Bu ilana henüz teklif gelmedi.</div>
                ) : (
                  <div className="flex flex-col gap-2.5 border-t border-gray-100 dark:border-navy-line pt-3">
                    {lOffers.map((o) => {
                      const s = STATUS_STYLE[o.status] || STATUS_STYLE.beklemede;
                      return (
                        <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 dark:border-navy-line p-3.5">
                          <div className="min-w-[180px] flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{o.fromUser}</span>
                              <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
                            </div>
                            <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">{o.message || "—"}</div>
                            <div className="mt-1 text-[11px] text-gray-400 dark:text-navy-muted">{fmtDate(o.createdAt)}</div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            {o.price != null && <span className="text-base font-extrabold text-slate-950 dark:text-slate-100">{o.price.toLocaleString("tr-TR")} ₺</span>}
                            {o.status === "beklemede" && !matched && (
                              <div className="flex gap-1.5">
                                <button onClick={() => accept(l, o)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Kabul et</button>
                                <button onClick={() => reject(o)} className="rounded-lg border border-gray-200 dark:border-navy-line px-3 py-2 text-xs font-bold text-red-600">Reddet</button>
                              </div>
                            )}
                            {o.status === "kabul" && (
                              <div className="flex flex-wrap items-center gap-2">
                                {getContact?.(o.fromUserId)?.phone && (
                                  <a href={`tel:${getContact(o.fromUserId).phone}`} className="text-xs font-bold text-emerald-600">📞 {getContact(o.fromUserId).phone}</a>
                                )}
                                <button onClick={() => navigate("/mesajlar")} className="rounded-lg bg-slate-950 dark:bg-navy-soft px-3 py-2 text-xs font-bold text-white dark:text-slate-100">Mesaj gönder</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
