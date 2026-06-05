import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import CategoryIcon from "../components/CategoryIcon";

// ── MoveIQ LIGHT landing (Tailwind) — Nakliyeci/Tasiyici.

const BENEFITS = [
  { icon: "📭", title: "Boş sefer yok", desc: "Bölgenizdeki yükleri önceden görün. Boş dönüş yerine iş alın, kilometre başı kazancınızı artırın." },
  { icon: "⚡", title: "Anında iş eşleştirme", desc: "İş ilanları anlık güncellenir. Sabah ilan veren müteahhit, öğleden önce araç bulabilir — siz o araçsınız." },
  { icon: "📄", title: "Dijital irsaliye", desc: "Kağıt takip yok. Taşıma belgelerinizi telefonda görün, saklayın, gönderin." },
  { icon: "⭐", title: "Puan & güven", desc: "İyi iş çıkardıkça puanınız artar. Yüksek puanlı nakliyeciler daha fazla iş, daha iyi fiyat alır." },
  { icon: "💵", title: "Teklif verin, fiyat siz belirleyin", desc: "Platform fiyat dikte etmez. Kendi fiyatınızı teklif edin, iş sahibiyle doğrudan anlaşın." },
  { icon: "🔁", title: "Düzenli iş anlaşmaları", desc: "Uzun süreli şantiyelerde anlaşmalı nakliyeci olun. Sabit iş, sabit gelir." },
];

const HOW = [
  { n: "1", t: "Araç ilanınızı açın", d: "Araç tipinizi, kapasiteyi, bölgenizi ve müsaitliğinizi belirtin. 2 dakika." },
  { n: "2", t: "İş ilanlarına teklif verin", d: "Size uygun yükleri filtreleyin. Fiyat teklifinizi ve mesajınızı gönderin." },
  { n: "3", t: "Anlaşın, yola çıkın", d: "Teklif kabul edilince iş sahibiyle iletişime geçin, belgeleri dijital yönetin." },
];

const VEHICLES = [
  { icon: "🚛", label: "Damperli kamyon", sub: "5–25 ton" },
  { icon: "🚚", label: "Kırk ayak / 4 dingil", sub: "30 ton+" },
  { icon: "🛢️", label: "Silobas", sub: "Çimento / tahıl / kimyasal" },
  { icon: "⛟", label: "Tanker", sub: "Sıvı / kimyasal" },
  { icon: "🚜", label: "Mini damper", sub: "Traktör römork" },
  { icon: "📦", label: "Dökme yük dorsesi", sub: "Açık / kapalı kasa" },
];

export default function NakliyeciPage() {
  const navigate = useNavigate();

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <SEO title="Nakliyeci & Taşıyıcı" description="Boş sefer yapmayın. Hafriyat ve döküm yük işlerini bulun, anında teklif verin, daha fazla kazanın." />

      {/* Hero */}
      <section className="border-b border-gray-100 dark:border-navy-line bg-white dark:bg-navy-card">
        <div className="mx-auto w-full max-w-5xl px-5 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-2xl">
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold tracking-wide text-emerald-700">NAKLİYECİ & TAŞIYICI</span>
            <h1 className="my-4 text-4xl font-black leading-tight tracking-tight text-slate-950 dark:text-slate-100 md:text-5xl">
              Boş sefer yapmayın,<br />
              <span className="text-emerald-600">her kilometre</span> kazandırsın
            </h1>
            <p className="mb-7 max-w-xl text-lg leading-relaxed text-gray-500 dark:text-slate-400">
              Bölgenizdeki hafriyat ve döküm yük işlerini anlık görün. Teklif verin, iş sahibiyle doğrudan anlaşın. Boş dönüş yok, kayıp kilometre yok.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate("/ilan-ver")} className="rounded-full bg-slate-950 dark:bg-navy-soft px-7 py-3.5 text-base font-bold text-white dark:text-slate-100 transition hover:bg-slate-800">Araç ilanı ver — ücretsiz</button>
              <button onClick={() => navigate("/ilanlar")} className="rounded-full bg-white dark:bg-navy-card px-7 py-3.5 text-base font-bold text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-gray-200 dark:ring-navy-line transition hover:bg-gray-50 dark:hover:bg-navy-soft">İş ilanlarına bak →</button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-5">
        {/* Arac tipleri */}
        <h2 className="mb-5 mt-12 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Hangi araçla çalışıyorsunuz?</h2>
        <div className="mb-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VEHICLES.map((v) => (
            <motion.div key={v.label} whileHover={{ y: -3 }} onClick={() => navigate("/ilan-ver")} className="flex cursor-pointer items-center gap-3 rounded-3xl bg-white dark:bg-navy-card p-4 shadow-sm">
              <div className="flex-shrink-0 text-3xl">{v.icon}</div>
              <div>
                <div className="text-sm font-bold text-slate-950 dark:text-slate-100">{v.label}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">{v.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Iki kategori */}
        <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Ne taşıyabilirsiniz?</h2>
        <div className="mb-14 grid gap-4 sm:grid-cols-2">
          {[
            { catId: "hafriyat", title: "Hafriyat", color: "text-amber-700", desc: "Toprak, moloz, kaya, kırıntı, asfalt frezeleme — inşaat sahasından döküm sahasına." },
            { catId: "silobas", title: "Silobas & Döküme", color: "text-sky-700", desc: "Çimento, kum, çakıl, mıcır, tahıl, kimyasal granül — silobas ve tanker araçlar için." },
          ].map((c) => (
            <div key={c.catId} className="rounded-3xl bg-white dark:bg-navy-card p-6 shadow-sm">
              <div className="mb-2.5 flex items-center gap-3">
                <CategoryIcon catId={c.catId} size={36} fallback={c.catId === "hafriyat" ? "🚛" : "🛢️"} />
                <span className={`text-lg font-extrabold ${c.color}`}>{c.title}</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Faydalar */}
        <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Size ne kazandırır?</h2>
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
        <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">3 adımda iş bulun</h2>
        <div className="mb-14 grid gap-4 sm:grid-cols-3">
          {HOW.map((s) => (
            <div key={s.n} className="rounded-3xl bg-white dark:bg-navy-card p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-base font-black text-emerald-700">{s.n}</div>
              <div className="mb-1.5 text-base font-bold text-slate-950 dark:text-slate-100">{s.t}</div>
              <div className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{s.d}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mb-16 flex flex-wrap items-center justify-between gap-5 rounded-[28px] bg-slate-950 dark:bg-navy-soft px-8 py-9">
          <div>
            <div className="mb-1 text-2xl font-extrabold text-white">Araç ilanınızı bugün açın</div>
            <div className="text-sm text-slate-400">Kayıt ve ilan ücretsiz. Anlaştığınızda komisyon yok.</div>
          </div>
          <button onClick={() => navigate("/ilan-ver")} className="whitespace-nowrap rounded-full bg-yellow-400 px-7 py-3.5 text-base font-extrabold text-slate-950 transition hover:bg-yellow-500">Araç ilanı ver →</button>
        </div>
      </div>
    </div>
  );
}
