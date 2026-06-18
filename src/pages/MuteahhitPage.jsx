import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";

// ── Muteahhit/Alici — app-native ekran (SAHA, max-w-460 kolon). DESIGN.md §5.

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
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-5 px-4 pb-24 pt-3 text-ham-ink">
      <SEO title="Müteahhit & Alıcı" description="Şantiyen için hafriyat ve döküm yük nakliyesi artık çok kolay. Anlık teklif al, belgeli araçlarla çalış." />

      {/* üst bar */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Geri" className="flex h-9 w-9 items-center justify-center rounded-full border border-ham-border bg-ham-card text-ham-sub shadow-sm">←</button>
        <span className="text-sm font-extrabold text-ham-ink">Müteahhit / Alıcı</span>
      </div>

      {/* hero kart */}
      <motion.section
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-[28px] border border-ham-border bg-ham-card p-5 shadow-sm"
      >
        <span className="inline-flex rounded-full bg-ham-yellow px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-ham-ink">Müteahhit & Alıcı</span>
        <h1 className="mt-3 text-[26px] font-black leading-[1.1] tracking-tight text-ham-ink">
          Şantiyene en uygun<br /><span className="text-ham-ink underline decoration-ham-yellow decoration-4 underline-offset-4">nakliyeyi dakikada</span> bul
        </h1>
        <p className="mt-2.5 text-[13px] leading-relaxed text-ham-sub">
          Hafriyat, kum, çakıl, mıcır, çimento — yüklerini belgeli ve puanlı nakliyecilere anında ulaştır. Telefon trafiği yok, belirsizlik yok.
        </p>
        <div className="mt-4 flex flex-col gap-2.5">
          <button onClick={() => navigate("/ilan-ver")} className="flex items-center justify-center rounded-full bg-ham-yellow px-5 py-3 text-sm font-extrabold text-ham-ink shadow-sm transition active:scale-[.98]">İlan ver — ücretsiz</button>
          <button onClick={() => navigate("/ilanlar")} className="flex items-center justify-center rounded-full bg-ham-stone px-5 py-3 text-sm font-bold text-ham-ink ring-1 ring-ham-border transition active:scale-[.98]">Boş araçlara bak →</button>
        </div>
        <div className="pointer-events-none absolute -right-7 -top-7 h-28 w-28 rounded-full bg-ham-yellow/15" />
      </motion.section>

      {/* neden */}
      <section>
        <span className="mb-2.5 block text-xs font-extrabold text-ham-ink">Sana ne kazandırır?</span>
        <div className="flex flex-col gap-2.5">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.t}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-start gap-3 rounded-2xl border border-ham-border bg-ham-card p-3.5 shadow-sm"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-ham-stone text-base">{b.icon}</span>
              <div className="min-w-0">
                <span className="block text-[13px] font-bold text-ham-ink">{b.t}</span>
                <span className="block text-[11px] leading-relaxed text-ham-sub">{b.d}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* nasıl çalışır */}
      <section>
        <span className="mb-2.5 block text-xs font-extrabold text-ham-ink">3 adımda nakliye ayarla</span>
        <div className="flex flex-col gap-2.5">
          {HOW.map((s) => (
            <div key={s.n} className="flex items-start gap-3 rounded-2xl border border-ham-border bg-ham-card p-3.5 shadow-sm">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-ham-yellow font-mono text-xs font-black text-ham-ink">{s.n}</span>
              <div className="min-w-0">
                <span className="block text-[13px] font-bold text-ham-ink">{s.t}</span>
                <span className="block text-[11px] leading-relaxed text-ham-sub">{s.d}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* kapanış cta */}
      <div className="flex flex-col gap-3 rounded-[24px] bg-ham-ink p-5">
        <div>
          <div className="text-base font-extrabold text-[#FAF9F6]">Hemen başla — ücretsiz</div>
          <div className="mt-0.5 text-[12px] text-ham-muted">Kayıt ol, ilk ilanını 2 dakikada ver.</div>
        </div>
        <button onClick={() => navigate("/ilan-ver")} className="rounded-full bg-ham-yellow px-5 py-3 text-sm font-extrabold text-ham-ink transition active:scale-[.98]">İlan ver →</button>
      </div>
    </div>
  );
}
