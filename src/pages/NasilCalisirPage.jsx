import SEO from "../components/SEO";

// ── SAHA (Tailwind) — Nasil Calisir.

const STEPS = [
  { num: "1", title: "İlanını Yayınla", desc: "Taşınacak yükünü veya boş aracını birkaç dakikada ekle. Konum, miktar ve tarihi belirt." },
  { num: "2", title: "Teklifleri Topla", desc: "İlgili nakliyeciler veya iş sahipleri ilanını görür, sana teklif gönderir." },
  { num: "3", title: "Anlaş", desc: "Gelen teklifleri karşılaştır, en uygun olanla doğrudan iletişime geç ve anlaş." },
  { num: "4", title: "Yola Çık", desc: "İş tamamlandıktan sonra karşılıklı puanlama ile güvenli bir topluluk oluşturulur." },
];

const FAQ = [
  ["İlan vermek ücretli mi?", "Hayır. İlan vermek ve teklif almak ücretsizdir. Platform, iş sahibi ile nakliyeciyi komisyonsuz buluşturur."],
  ["Hangi işler için kullanabilirim?", "İki ana kategori vardır: Hafriyat (kazı, toprak, moloz taşıma) ve Silobas (dökme çimento, kum, mıcır, tahıl gibi yükler)."],
  ["İş ilanı mı araç ilanı mı vermeliyim?", "Taşınacak yükünüz varsa 'İş ilanı', boş aracınıza iş arıyorsanız 'Araç ilanı' verin. Karşı taraf size ulaşır."],
  ["Teklifler nasıl geliyor?", "İlanınız yayınlandıktan sonra ilgili kullanıcılar teklif verir veya doğrudan iletişime geçer. Teklifleri ilan detayında görürsünüz."],
  ["Ödeme platform üzerinden mi yapılıyor?", "Hayır, anlaşma ve ödeme taraflar arasında yapılır. Platform yalnızca eşleştirme ve iletişimi sağlar."],
];

export default function NasilCalisirPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 text-ham-ink">
      <SEO title="Nasıl Çalışır" description="HamTed nasıl çalışır? 4 adımda hafriyat ve silobas yüklerinizi doğru araçla buluşturun." />
      <div className="mb-9 text-center">
        <span className="inline-block rounded-full bg-ham-stone px-4 py-1.5 text-xs font-bold text-ham-sub">Adım Adım</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ham-ink">Nasıl Çalışır?</h1>
        <p className="mt-2 text-base text-ham-sub">4 basit adımda yükünü veya aracını doğru tarafla buluştur.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.num} className="rounded-3xl border border-ham-border bg-ham-card p-6 shadow-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-ham-yellow text-lg font-black text-ham-ink" style={{ fontFamily: "'Space Mono',ui-monospace,monospace" }}>{s.num}</div>
            <div className="mb-1.5 text-base font-bold text-ham-ink">{s.title}</div>
            <div className="text-sm leading-relaxed text-ham-sub">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* SSS */}
      <div className="mt-12">
        <h2 className="mb-5 text-xl font-extrabold tracking-tight text-ham-ink">Sıkça Sorulan Sorular</h2>
        <div className="flex flex-col gap-3">
          {FAQ.map(([q, a]) => (
            <div key={q} className="rounded-3xl border border-ham-border bg-ham-card p-5 shadow-sm">
              <div className="mb-2 text-base font-bold text-ham-ink">{q}</div>
              <div className="text-sm leading-relaxed text-ham-sub">{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
