import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LISTINGS } from "../data/listings";
import SEO from "../components/SEO";

// ── Bu sayfa TAMAMEN TAILWIND ile yazildi (kademeli gecis ornek/sablonu).
// Tasarim aracindan uretilen React+Tailwind kodu da aynen bu sekilde yapistirilabilir.

const PERSONAS = [
  { id: "muteahhit", letter: "M", title: "Müteahhit / Alıcı", desc: "İş ilanı aç, teklif topla", route: "/muteahhit", ring: "text-yellow-400 bg-yellow-400/15" },
  { id: "tedarikci", letter: "T", title: "Tedarikçi", desc: "Ocak/santral ürününü listele", route: "/tedarikci", ring: "text-emerald-400 bg-emerald-400/15" },
  { id: "nakliyeci", letter: "N", title: "Nakliyeci", desc: "Araç ilanı ver, yük bul", route: "/nakliyeci", ring: "text-sky-400 bg-sky-400/15" },
];

const CAT_TAG = {
  hafriyat: { label: "HAFRİYAT", cls: "text-amber-300 bg-amber-400/15" },
  silobas: { label: "SİLOBAS", cls: "text-sky-300 bg-sky-400/15" },
};

const TRUCK_DARK = "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400";
const TRUCK_LIGHT = "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=400";

const STEPS = ["İlan", "Teklif", "Kabul", "Yolda"];

export default function NakliyeHome({ listings = LISTINGS }) {
  const navigate = useNavigate();
  const open = listings.filter((l) => l.status !== "kapali");

  const trackJob = open.find((l) => l.type === "is") || open[0];
  const cargo = open.find((l) => l.type === "arac") || open.find((l) => l !== trackJob) || open[0];
  const recent = listings.find((l) => l.status === "kapali" || l.status === "eslesti")
    || open.find((l) => l !== trackJob && l !== cargo) || open[0];
  const rest = open.filter((l) => l !== trackJob && l !== cargo).slice(0, 3);

  const onCount = trackJob ? (trackJob.offers > 0 ? 2 : 1) : 1;
  const fillPct = ((onCount - 1) / (STEPS.length - 1)) * 100;
  const idText = (l) => "HMT-" + String(l.id).padStart(4, "0");

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-5 px-4 pb-24 pt-2">
      <SEO description="Hafriyat ve silobas işleri doğru araçla buluşuyor. Müteahhit, tedarikçi ve nakliyeciler için Türkiye'nin yük eşleştirme platformu." />

      {/* UST BAR */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#6c7b93]">İyi çalışmalar 👋</p>
          <p className="mt-0.5 text-lg font-extrabold tracking-tight text-white">HamTed</p>
        </div>
        <button
          onClick={() => navigate("/mesajlar")}
          aria-label="Bildirimler"
          className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#2a323f] bg-[#1b222d] text-slate-300 transition-colors hover:bg-[#232c3a]"
        >
          🔔
          <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border-2 border-[#1b222d] bg-yellow-400" />
        </button>
      </div>

      {/* ARAMA */}
      <div className="flex items-center gap-2 rounded-2xl border border-[#2a323f] bg-[#1b222d] p-1.5 pl-4">
        <span className="text-base">🔍</span>
        <input
          placeholder="İl, malzeme veya güzergah ara…"
          onKeyDown={(e) => { if (e.key === "Enter") navigate("/ilanlar"); }}
          aria-label="İlan ara"
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6c7b93]"
        />
        <button
          onClick={() => navigate("/ilanlar")}
          className="whitespace-nowrap rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-extrabold text-[#11141a] transition-colors hover:bg-yellow-500"
        >
          Ara
        </button>
      </div>

      {/* LACIVERT TAKIP KARTI */}
      {trackJob && (
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="rounded-[32px] border border-[#2a323f] bg-gradient-to-b from-[#232c3a] via-[#1b222d] to-[#161c26] p-6 text-slate-100 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-yellow-400">Öne çıkan iş</p>
              <h3 className="text-xl font-extrabold leading-tight tracking-tight text-white">{trackJob.title}</h3>
              <p className="mt-1 text-[11px] text-[#6c7b93]">No · {idText(trackJob)} · {trackJob.offers || 0} teklif</p>
            </div>
            <button
              onClick={() => navigate(`/ilan/${trackJob.id}`)}
              className="whitespace-nowrap rounded-full bg-yellow-400 px-5 py-2.5 text-xs font-extrabold text-[#11141a] transition hover:opacity-90"
            >
              Takip et
            </button>
          </div>

          {/* ilerleme cubugu */}
          <div className="relative my-6 flex items-center justify-between px-1">
            <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 bg-[#2e3b4e]" />
            <div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded bg-yellow-400" style={{ width: `${fillPct}%` }} />
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`z-10 h-4 w-4 rounded-full border-4 ${i < onCount ? "border-[#161c26] bg-yellow-400" : "border-[#1b222d] bg-[#52637a]"}`}
              />
            ))}
          </div>
          <div className="mb-5 flex justify-between">
            {STEPS.map((s, i) => (
              <span key={s} className={`flex-1 text-center text-[9.5px] font-semibold ${i < onCount ? "text-yellow-400" : "text-[#6c7b93]"}`}>{s}</span>
            ))}
          </div>

          <div className="flex justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[11px] text-[#6c7b93]">Yükleme</p>
              <p className="truncate text-sm font-extrabold text-white">{trackJob.il}</p>
              <p className="mt-1 text-[11px] text-[#6c7b93]">{trackJob.yukleme || trackJob.ilce || "—"}</p>
            </div>
            <div className="min-w-0 text-right">
              <p className="mb-1 text-[11px] text-[#6c7b93]">Boşaltma</p>
              <p className="truncate text-sm font-extrabold text-white">{trackJob.bosaltma ? trackJob.bosaltma.split(",")[0] : (trackJob.ilce || "Saha")}</p>
              <p className="mt-1 text-[11px] text-[#6c7b93]">{trackJob.dateText || "—"}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ISTATISTIK */}
      <div className="flex gap-2">
        {[["2.400+", "Aktif ilan"], ["850+", "Nakliyeci"], ["12 sa", "Ort. eşleşme"]].map(([n, l]) => (
          <div key={l} className="flex-1 rounded-2xl border border-[#2a323f] bg-[#1b222d] px-3.5 py-3">
            <div className="text-xl font-extrabold text-yellow-400">{n}</div>
            <div className="mt-0.5 text-[11px] text-[#6c7b93]">{l}</div>
          </div>
        ))}
      </div>

      {/* MUSAIT ARAC / KARGO KARTI */}
      {cargo && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight text-white">{cargo.type === "arac" ? "Müsait araç" : "Öne çıkan yük"}</h2>
            <button onClick={() => navigate("/ilanlar")} className="text-xs font-bold text-[#6c7b93]">Tümü ›</button>
          </div>
          <button
            onClick={() => navigate(`/ilan/${cargo.id}`)}
            className="flex w-full items-center justify-between gap-3.5 overflow-hidden rounded-[32px] border border-[#2a323f] bg-gradient-to-b from-[#232c3a] to-[#1b222d] p-5 text-left text-slate-100 transition hover:-translate-y-0.5"
          >
            <div className="flex min-w-0 flex-col gap-3">
              <span className="self-start rounded-full bg-[#29323f] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-yellow-400">
                {cargo.type === "arac" ? "Müsait" : (CAT_TAG[cargo.cat]?.label || "İlan")}
              </span>
              <div>
                <p className="mb-0.5 text-[11px] text-[#6c7b93]">{cargo.type === "arac" ? "Araç" : "Malzeme"}</p>
                <h5 className="text-base font-extrabold leading-tight text-white">{cargo.type === "arac" ? (cargo.vehicle || cargo.title) : (cargo.material || cargo.title)}</h5>
              </div>
              <div className="flex gap-5">
                <div>
                  <p className="text-[10px] text-[#6c7b93]">{cargo.priceType === "sabit" && cargo.price ? "Fiyat" : "Durum"}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-white">{cargo.priceType === "sabit" && cargo.price ? `₺${cargo.price}` : "Teklif"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6c7b93]">{cargo.type === "arac" ? "Kapasite" : "Miktar"}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-white">{cargo.type === "arac" ? (cargo.capacity || "—") : `${cargo.amount || "—"} ${cargo.unit || ""}`}</p>
                </div>
              </div>
            </div>
            <img src={TRUCK_DARK} alt="Araç" loading="lazy" className="h-[108px] w-36 flex-shrink-0 rounded-[18px] border border-[#2a323f] object-cover" />
          </button>
        </section>
      )}

      {/* PERSONALAR */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold tracking-tight text-white">Ne yapmak istiyorsun?</h2>
        {PERSONAS.map((p, i) => (
          <motion.button
            key={p.id}
            onClick={() => navigate(p.route)}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}
            className="flex w-full items-center gap-3.5 rounded-3xl border border-[#2a323f] bg-[#1b222d] p-4 text-left transition hover:-translate-y-0.5 hover:border-yellow-400/40"
          >
            <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold ${p.ring}`}>{p.letter}</span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-white">{p.title}</span>
              <span className="block text-xs text-[#6c7b93]">{p.desc}</span>
            </span>
            <span className="ml-auto text-2xl text-[#6c7b93]">›</span>
          </motion.button>
        ))}
      </section>

      {/* SON ILAN — SARI KART + LISTE */}
      {recent && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight text-white">Son ilanlar</h2>
            <button onClick={() => navigate("/ilanlar")} className="text-xs font-bold text-[#6c7b93]">Tümü ›</button>
          </div>

          <button
            onClick={() => navigate(`/ilan/${recent.id}`)}
            className="flex w-full items-center justify-between gap-3.5 overflow-hidden rounded-[32px] bg-gradient-to-br from-yellow-300 to-yellow-500 p-5 text-left shadow-[0_12px_30px_rgba(245,179,1,0.32)] transition hover:-translate-y-0.5"
          >
            <div className="flex min-w-0 flex-col gap-3">
              <span className="self-start rounded-full bg-black/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#11141a]">
                {recent.status === "kapali" ? "Tamamlandı" : recent.status === "eslesti" ? "Eşleşti" : "Yayında"}
              </span>
              <div>
                <p className="text-[11px] font-semibold text-[#4a4220]">{recent.createdText || recent.dateText || "yeni"}</p>
                <p className="mt-0.5 text-[17px] font-black leading-tight tracking-tight text-[#11141a]">{recent.title}</p>
              </div>
            </div>
            <img src={TRUCK_LIGHT} alt="İlan" loading="lazy" className="h-[100px] w-[132px] flex-shrink-0 rounded-2xl object-cover" />
          </button>

          {/* diger ilanlar */}
          <div className="flex flex-col gap-2.5">
            {rest.map((l) => {
              const tag = CAT_TAG[l.cat] || CAT_TAG.hafriyat;
              const isFixed = l.priceType === "sabit" && l.price;
              return (
                <button
                  key={l.id}
                  onClick={() => navigate(`/ilan/${l.id}`)}
                  className="flex w-full flex-col gap-2 rounded-[22px] border border-[#2a323f] bg-[#1b222d] p-4 text-left transition hover:-translate-y-0.5 hover:border-yellow-400/40"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${tag.cls}`}>{tag.label}</span>
                    <span className="text-[11px] text-[#6c7b93]">• {l.createdText || "yeni"}</span>
                  </div>
                  <div className="text-base font-bold leading-snug text-white">{l.title}</div>
                  <div className="flex flex-wrap items-center gap-1 text-xs text-[#6c7b93]">📍 {l.il}{l.ilce ? `, ${l.ilce}` : ""}{l.amount ? ` • ${l.amount} ${l.unit || ""}` : ""}</div>
                  <div className="flex items-center justify-between gap-2 pt-2.5">
                    <span>
                      <span className="text-xl font-extrabold tracking-tight text-yellow-400">{isFixed ? `₺${l.price}` : "Teklif"}</span>
                      <span className="text-[11px] text-[#6c7b93]"> {isFixed ? (l.unit ? `/${l.unit}` : "") : "usulü"}</span>
                    </span>
                    <span className="whitespace-nowrap rounded-full bg-yellow-400 px-4 py-2 text-xs font-extrabold text-[#11141a]">Teklif ver</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
