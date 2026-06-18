import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";

// ── SAHA landing (Tailwind) — Tedarikci.

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
    <div className="text-ham-ink">
      <SEO title="Tedarikçi" description="Kırma ocağı, kum ocağı, beton santrali — ürünlerinizi dijitale taşıyın, daha geniş müşteri kitlesine ulaşın." />

      {/* Hero */}
      <section className="border-b border-ham-border bg-ham-card">
        <div className="mx-auto w-full max-w-5xl px-5 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-2xl">
            <span className="rounded-full bg-ham-stone px-3 py-1.5 text-xs font-bold tracking-wide text-ham-sub ring-1 ring-ham-border">TEDARİKÇİ & OCAK SAHİBİ</span>
            <h1 className="my-4 text-4xl font-black leading-tight tracking-tight text-ham-ink md:text-5xl">
              Ocağınızı dijitale taşıyın,<br />
              <span className="text-ham-ink underline decoration-ham-yellow decoration-[6px] underline-offset-4">müşteri tabanınızı</span> büyütün
            </h1>
            <p className="mb-7 max-w-xl text-lg leading-relaxed text-ham-sub">
              Kum, çakıl, mıcır, kırma taş, çimento — ürünlerinizi platforma ekleyin. Yüzlerce müteahhit size ulaşsın. Nakliye sorununu platform çözsün.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate("/ilan-ver")} className="rounded-full bg-ham-ink px-7 py-3.5 text-base font-bold text-[#FAF9F6] transition hover:opacity-90">Tedarikçi olarak ilan ver</button>
              <button onClick={() => navigate("/hakkimizda")} className="rounded-full bg-ham-card px-7 py-3.5 text-base font-bold text-ham-ink shadow-sm ring-1 ring-ham-border transition hover:bg-ham-stone">Daha fazla bilgi →</button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {PERSONAS.map((p) => (
                <span key={p.label} className="rounded-full bg-ham-stone px-3 py-1.5 text-xs font-semibold text-ham-sub ring-1 ring-ham-border">{p.icon} {p.label}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-5">
        {/* Faydalar */}
        <h2 className="mb-5 mt-12 text-2xl font-extrabold tracking-tight text-ham-ink">Size ne kazandırır?</h2>
        <div className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <motion.div key={b.title} whileHover={{ y: -3 }} className="rounded-3xl border border-ham-border bg-ham-card p-6 shadow-sm">
              <div className="mb-2.5 text-3xl">{b.icon}</div>
              <div className="mb-1.5 text-base font-bold text-ham-ink">{b.title}</div>
              <div className="text-sm leading-relaxed text-ham-sub">{b.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Nasil baslarsiniz */}
        <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-ham-ink">Nasıl başlarsınız?</h2>
        <div className="mb-14 grid gap-4 sm:grid-cols-3">
          {HOW.map((s) => (
            <div key={s.n} className="rounded-3xl border border-ham-border bg-ham-card p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-ham-yellow font-mono text-base font-black text-ham-ink">{s.n}</div>
              <div className="mb-1.5 text-base font-bold text-ham-ink">{s.t}</div>
              <div className="text-sm leading-relaxed text-ham-sub">{s.d}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mb-16 flex flex-wrap items-center justify-between gap-5 rounded-[28px] bg-ham-ink px-8 py-9">
          <div>
            <div className="mb-1 text-2xl font-extrabold text-[#FAF9F6]">Ürün ilanı vermek ücretsiz</div>
            <div className="text-sm text-ham-muted">Hesap oluşturun, ürünlerinizi dakikada ekleyin.</div>
          </div>
          <button onClick={() => navigate("/ilan-ver")} className="whitespace-nowrap rounded-full bg-ham-yellow px-7 py-3.5 text-base font-extrabold text-ham-ink transition hover:opacity-90">Hemen başla →</button>
        </div>
      </div>
    </div>
  );
}
