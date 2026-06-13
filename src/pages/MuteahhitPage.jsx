import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";

// ── Muteahhit/Alici — app-native ekran (MoveIQ LIGHT, max-w-460 kolon). DESIGN.md §5.

const BENEFITS = [
  { icon: "⚡", t: "Anlık teklif", d: "İlanını ver, dakikalar içinde belgeli nakliyecilerden fiyat gelsin." },
  { icon: "✅", t: "Belgeli & puanlı", d: "Sadece K belgeli, geçmişi doğrulanmış araçlarla çalış." },
  { icon: "📦", t: "Her yük tipi", d: "Hafriyat, kum, çakıl, mıcır, çimento — hepsi tek yerde." },
  { icon: "📍", t: "Konuma yakın", d: "Şantiyene en yakın boş araçlar öne çıkar, boş sefer maliyeti düşer." },
];

const HOW = [
  { n: "1", t: "İlanını ver", d: "Yükleme/boşaltma, yük tipi, miktar ve tarih. 2 dakika." },
  { n: "2", t: "Teklifleri karşılaştır", d: "Nakliyeciler fiyat ve araçla teklif yollar; puanlara bak." },
  { n: "3", t: "Anlaş & başla", d: "En uygun teklifi kabul et, iletişime geç." },
];

export default function MuteahhitPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-5 px-4 pb-24 pt-3 text-slate-900 dark:text-slate-100">
      <SEO title="Müteahhit & Alıcı" description="Şantiyen için hafriyat ve döküm yük nakliyesi artık çok kolay. Anlık teklif al, belgeli araçlarla çalış." />

      {/* üst bar */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Geri" className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white text-slate-700 shadow-sm dark:border-navy-line dark:bg-navy-card dark:text-slate-300">←</button>
        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Müteahhit / Alıcı</span>
      </div>

      {/* hero kart */}
      <motion.section
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm dark:border-navy-line dark:bg-navy-card"
      >
        <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-600">Müteahhit & Alıcı</span>
        <h1 className="mt-3 text-[26px] font-black leading-[1.1] tracking-tight text-slate-950 dark:text-slate-100">
          Şantiyene en uygun<br /><span className="text-amber-500">nakliyeyi dakikada</span> bul
        </h1>
        <p className="mt-2.5 text-[13px] leading-relaxed text-gray-500 dark:text-slate-400">
          Hafriyat, kum, çakıl, mıcır, çimento — yüklerini belgeli ve puanlı nakliyecilere anında ulaştır. Telefon trafiği yok, belirsizlik yok.
        </p>
        <div className="mt-4 flex flex-col gap-2.5">
          <button onClick={() => navigate("/ilan-ver")} className="flex items-center justify-center rounded-full bg-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-sm shadow-yellow-400/30 transition active:scale-[.98]">İlan ver — ücretsiz</button>
          <button onClick={() => navigate("/ilanlar")} className="flex items-center justify-center rounded-full bg-slate-50 px-5 py-3 text-sm font-bold text-slate-900 ring-1 ring-gray-100 transition active:scale-[.98] dark:bg-navy-soft dark:text-slate-100 dark:ring-navy-line">Boş araçlara bak →</button>
        </div>
        <div className="pointer-events-none absolute -right-7 -top-7 h-28 w-28 rounded-full bg-yellow-400/10" />
      </motion.section>

      {/* neden */}
      <section>
        <span className="mb-2.5 block text-xs font-extrabold text-slate-800 dark:text-slate-100">Sana ne kazandırır?</span>
        <div className="flex flex-col gap-2.5">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.t}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm dark:border-navy-line dark:bg-navy-card"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-base">{b.icon}</span>
              <div className="min-w-0">
                <span className="block text-[13px] font-bold text-slate-950 dark:text-slate-100">{b.t}</span>
                <span className="block text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">{b.d}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* nasıl çalışır */}
      <section>
        <span className="mb-2.5 block text-xs font-extrabold text-slate-800 dark:text-slate-100">3 adımda nakliye ayarla</span>
        <div className="flex flex-col gap-2.5">
          {HOW.map((s) => (
            <div key={s.n} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm dark:border-navy-line dark:bg-navy-card">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-black text-amber-700">{s.n}</span>
              <div className="min-w-0">
                <span className="block text-[13px] font-bold text-slate-950 dark:text-slate-100">{s.t}</span>
                <span className="block text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">{s.d}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* kapanış cta */}
      <div className="flex flex-col gap-3 rounded-[24px] bg-slate-950 p-5 dark:bg-navy-soft">
        <div>
          <div className="text-base font-extrabold text-white">Hemen başla — ücretsiz</div>
          <div className="mt-0.5 text-[12px] text-slate-400">Kayıt ol, ilk ilanını 2 dakikada ver.</div>
        </div>
        <button onClick={() => navigate("/ilan-ver")} className="rounded-full bg-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition active:scale-[.98]">İlan ver →</button>
      </div>
    </div>
  );
}
