import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";

// ── MoveIQ LIGHT landing (Tailwind) — Muteahhit/Alici.

const BENEFITS = [
  { icon: "⚡", title: "Anlık teklif al", desc: "İlanınızı verin, dakikalar içinde belgeli nakliyecilerden fiyat teklifleri gelsin." },
  { icon: "✅", title: "Belgeli & puanlı araçlar", desc: "Yalnızca K belgeli, geçmişi doğrulanmış nakliyecilerle çalışın. Sürpriz yok." },
  { icon: "📦", title: "Her yük tipi", desc: "Hafriyat, moloz, kaya, kum, çakıl, mıcır, çimento — tüm inşaat yükleri tek platformda." },
  { icon: "📋", title: "Dijital irsaliye", desc: "Taşıma belgelerinizi dijital tutun; fatura ve irsaliyelere tek yerden erişin." },
  { icon: "📍", title: "Konum bazlı eşleştirme", desc: "Şantiyenize en yakın boş araçlar öncelikli gösterilir, boş sefer maliyeti sıfıra iner." },
  { icon: "🔁", title: "Tekrarlayan işler", desc: "Uzun süreli şantiyeler için anlaşmalı nakliyeci tanımlayın, her gün ilan açmayın." },
];

const HOW = [
  { n: "1", t: "İlanınızı verin", d: "Yükleme/boşaltma noktası, yük tipi, miktar ve tarihi girin. 2 dakika." },
  { n: "2", t: "Teklifleri karşılaştırın", d: "Nakliyeciler fiyat ve araç bilgileriyle teklif gönderir. Puanlarına bakın." },
  { n: "3", t: "Anlaşın & başlayın", d: "En uygun teklifi kabul edin. Platform iletişimi ve belge takibini kolaylaştırır." },
];

const PERSONAS = [
  { icon: "🏗️", label: "Müteahhit" },
  { icon: "🏢", label: "Yapı şirketi" },
  { icon: "🔨", label: "Alt yüklenici" },
  { icon: "🏙️", label: "Belediye / kamu" },
  { icon: "🏭", label: "Fabrika / sanayi" },
];

export default function MuteahhitPage() {
  const navigate = useNavigate();

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <SEO title="Müteahhit & Alıcı" description="Şantiyeniz için hafriyat ve döküm yük nakliyesi artık çok kolay. Anlık teklif alın, belgeli araçlarla çalışın." />

      {/* Hero */}
      <section className="border-b border-gray-100 dark:border-navy-line bg-white dark:bg-navy-card">
        <div className="mx-auto w-full max-w-5xl px-5 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-2xl">
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold tracking-wide text-amber-700">MÜTEAHHİT & ALICI</span>
            <h1 className="my-4 text-4xl font-black leading-tight tracking-tight text-slate-950 dark:text-slate-100 md:text-5xl">
              Şantiyenize en uygun<br />
              <span className="text-amber-500">nakliyeyi dakikada</span> bulun
            </h1>
            <p className="mb-7 max-w-xl text-lg leading-relaxed text-gray-500 dark:text-slate-400">
              Hafriyat, kum, çakıl, mıcır, çimento — inşaat yüklerinizi taşıyacak belgeli ve puanlı nakliyecilere anında ulaşın. Telefon trafiği yok, pazarlık yok, belirsizlik yok.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate("/ilan-ver")} className="rounded-full bg-slate-950 dark:bg-navy-soft px-7 py-3.5 text-base font-bold text-white dark:text-slate-100 transition hover:bg-slate-800">İlan ver — ücretsiz</button>
              <button onClick={() => navigate("/ilanlar")} className="rounded-full bg-white dark:bg-navy-card px-7 py-3.5 text-base font-bold text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-gray-200 dark:ring-navy-line transition hover:bg-gray-50 dark:hover:bg-navy-soft">Boş araçlara bak →</button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {PERSONAS.map((p) => (
                <span key={p.label} className="rounded-full bg-slate-50 dark:bg-navy-soft px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 ring-1 ring-gray-200 dark:ring-navy-line">{p.icon} {p.label}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-5">
        {/* Faydalar */}
        <h2 className="mb-5 mt-12 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Size ne kazandırır?</h2>
        <div className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <motion.div key={b.title} whileHover={{ y: -3 }} className="rounded-3xl bg-white dark:bg-navy-card p-6 shadow-sm">
              <div className="mb-2.5 text-3xl">{b.icon}</div>
              <div className="mb-1.5 text-base font-bold text-slate-950 dark:text-slate-100">{b.title}</div>
              <div className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{b.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Nasil calisir */}
        <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">3 adımda nakliye ayarlayın</h2>
        <div className="mb-14 grid gap-4 sm:grid-cols-3">
          {HOW.map((s) => (
            <div key={s.n} className="rounded-3xl bg-white dark:bg-navy-card p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-base font-black text-amber-700">{s.n}</div>
              <div className="mb-1.5 text-base font-bold text-slate-950 dark:text-slate-100">{s.t}</div>
              <div className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{s.d}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mb-16 flex flex-wrap items-center justify-between gap-5 rounded-[28px] bg-slate-950 dark:bg-navy-soft px-8 py-9">
          <div>
            <div className="mb-1 text-2xl font-extrabold text-white">Hemen başlayın — ücretsiz</div>
            <div className="text-sm text-slate-400">Kayıt olun, ilk ilanınızı 2 dakikada verin.</div>
          </div>
          <button onClick={() => navigate("/ilan-ver")} className="whitespace-nowrap rounded-full bg-yellow-400 px-7 py-3.5 text-base font-extrabold text-slate-950 transition hover:bg-yellow-500">İlan ver →</button>
        </div>
      </div>
    </div>
  );
}
