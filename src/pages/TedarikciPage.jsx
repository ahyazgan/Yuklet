import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";

// ── MoveIQ LIGHT landing (Tailwind) — Tedarikci.

const BENEFITS = [
  { icon: "📈", title: "Daha geniş müşteri erişimi", desc: "Yüzlerce müteahhit ve yapı şirketine ulaşın. Sabit müşteri ağınızın ötesine geçin." },
  { icon: "🚚", title: "Nakliye çözümü dahil", desc: "Ürününüzü satan siz, taşıyanı platform bulsun. Müşterinize kapıya teslim hizmeti." },
  { icon: "📋", title: "Dijital fatura & sipariş", desc: "Kağıt irsaliye yok. Tüm siparişlerinizi, faturalarınızı ve ödeme durumlarınızı tek panelde." },
  { icon: "⭐", title: "Marka güvencesi", desc: "Doğrulanmış tedarikçi rozeti ve müşteri puanlarıyla ocağınızın dijital itibarını oluşturun." },
  { icon: "📦", title: "Ürün kataloğu", desc: "Çimento, kum, mıcır, çakıl — tüm ürünlerinizi fiyatla yayınlayın, güncellemesi saniyeler." },
  { icon: "💰", title: "Toplu alım indirimi", desc: "Büyük hacimli siparişler için özel fiyat tanımlayın, kurumsal müşteri çekin." },
];

const HOW = [
  { n: "1", t: "Tedarikçi hesabı açın", d: "Ocak / tesisinizi tanımlayın. Belgelerinizi yükleyin, doğrulanmış rozet alın." },
  { n: "2", t: "Ürün & fiyat girin", d: "Neyi, hangi fiyattan, ne kadar stokla sattığınızı belirtin. Nakliyeli veya teslim." },
  { n: "3", t: "Siparişleri yönetin", d: "Alıcılar teklif verir veya doğrudan sipariş açar. Panelinizdeki akışla yönetin." },
];

const PERSONAS = [
  { icon: "⛏️", label: "Kırma ocağı" },
  { icon: "🏭", label: "Beton santrali" },
  { icon: "🏖️", label: "Doğal kum ocağı" },
  { icon: "🪨", label: "Taş ocağı" },
  { icon: "🏗️", label: "Çimento deposu" },
  { icon: "🌾", label: "Tahıl deposu" },
];

export default function TedarikciPage() {
  const navigate = useNavigate();

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <SEO title="Tedarikçi" description="Kırma ocağı, kum ocağı, beton santrali — ürünlerinizi dijitale taşıyın, daha geniş müşteri kitlesine ulaşın." />

      {/* Hero */}
      <section className="border-b border-gray-100 dark:border-navy-line bg-white dark:bg-navy-card">
        <div className="mx-auto w-full max-w-5xl px-5 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-2xl">
            <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-bold tracking-wide text-sky-700">TEDARİKÇİ & OCAK SAHİBİ</span>
            <h1 className="my-4 text-4xl font-black leading-tight tracking-tight text-slate-950 dark:text-slate-100 md:text-5xl">
              Ocağınızı dijitale taşıyın,<br />
              <span className="text-sky-600">müşteri tabanınızı</span> büyütün
            </h1>
            <p className="mb-7 max-w-xl text-lg leading-relaxed text-gray-500 dark:text-slate-400">
              Kum, çakıl, mıcır, kırma taş, çimento — ürünlerinizi platforma ekleyin. Yüzlerce müteahhit size ulaşsın. Nakliye sorununu platform çözsün.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate("/ilan-ver")} className="rounded-full bg-slate-950 dark:bg-navy-soft px-7 py-3.5 text-base font-bold text-white dark:text-slate-100 transition hover:bg-slate-800">Tedarikçi olarak ilan ver</button>
              <button onClick={() => navigate("/hakkimizda")} className="rounded-full bg-white dark:bg-navy-card px-7 py-3.5 text-base font-bold text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-gray-200 dark:ring-navy-line transition hover:bg-gray-50 dark:hover:bg-navy-soft">Daha fazla bilgi →</button>
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

        {/* Nasil baslarsiniz */}
        <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Nasıl başlarsınız?</h2>
        <div className="mb-14 grid gap-4 sm:grid-cols-3">
          {HOW.map((s) => (
            <div key={s.n} className="rounded-3xl bg-white dark:bg-navy-card p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-base font-black text-sky-700">{s.n}</div>
              <div className="mb-1.5 text-base font-bold text-slate-950 dark:text-slate-100">{s.t}</div>
              <div className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{s.d}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mb-16 flex flex-wrap items-center justify-between gap-5 rounded-[28px] bg-slate-950 dark:bg-navy-soft px-8 py-9">
          <div>
            <div className="mb-1 text-2xl font-extrabold text-white">Ürün ilanı vermek ücretsiz</div>
            <div className="text-sm text-slate-400">Hesap oluşturun, ürünlerinizi dakikada ekleyin.</div>
          </div>
          <button onClick={() => navigate("/ilan-ver")} className="whitespace-nowrap rounded-full bg-yellow-400 px-7 py-3.5 text-base font-extrabold text-slate-950 transition hover:bg-yellow-500">Hemen başla →</button>
        </div>
      </div>
    </div>
  );
}
