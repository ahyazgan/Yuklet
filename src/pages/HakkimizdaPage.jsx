import SEO from "../components/SEO";

// ── SAHA (Tailwind) — Hakkimizda.

export default function HakkimizdaPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 text-ham-ink">
      <SEO title="Hakkımızda" description="HamTed hakkında bilgi edinin. Türkiye'nin yük & nakliye eşleştirme platformu." />
      <div className="mb-9 text-center">
        <span className="inline-block rounded-full bg-ham-stone px-4 py-1.5 text-xs font-bold text-ham-sub">Biz Kimiz?</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ham-ink">Hakkımızda</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-ham-border bg-ham-card p-7 shadow-sm">
          <h2 className="mb-3 text-xl font-extrabold tracking-tight text-ham-ink">Misyonumuz</h2>
          <p className="mb-3 text-sm leading-relaxed text-ham-sub">
            HamTed, hafriyat ve silobas taşımacılığında yükü olan ile boş aracı olan tarafı doğrudan buluşturur.
            Telefon trafiği ve aracı zincirini ortadan kaldırarak, doğru aracın doğru işe hızlıca ulaşmasını sağlarız.
          </p>
          <p className="text-sm leading-relaxed text-ham-sub">
            Şeffaf ilanlar, karşılıklı puanlama ve komisyonsuz eşleştirme ile nakliye sektöründe yeni bir standart belirliyoruz.
          </p>

          <h2 className="mb-3 mt-8 text-xl font-extrabold tracking-tight text-ham-ink">Vizyonumuz</h2>
          <p className="text-sm leading-relaxed text-ham-sub">
            Türkiye'nin dökme yük ve hafriyat taşımacılığında en çok kullanılan dijital eşleştirme ağı olmak;
            her müteahhidin ve her nakliyecinin boş kapasiteyi değerlendirebildiği bir ekosistem kurmak.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            ["🚛", "İki ana kategori", "Hafriyat ve silobas işlerine odaklı, sade ve hızlı bir deneyim."],
            ["📍", "Türkiye geneli", "Marmara'dan başlayarak tüm bölgelerde yük ve araç eşleştirme."],
            ["🤝", "Komisyonsuz", "Anlaşma taraflar arasında; platform yalnızca buluşturma — ücretsiz."],
            ["⭐", "Güven puanı", "Karşılıklı değerlendirme ile güvenilir nakliyeci ve iş sahibi ağı."],
          ].map(([icon, title, desc]) => (
            <div key={title} className="flex items-start gap-3.5 rounded-3xl border border-ham-border bg-ham-card p-5 shadow-sm">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-ham-stone text-xl">{icon}</div>
              <div>
                <div className="text-base font-bold text-ham-ink">{title}</div>
                <div className="text-sm text-ham-sub">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rakamlar */}
      <div className="mt-12">
        <h2 className="mb-5 text-center text-xl font-extrabold tracking-tight text-ham-ink">Rakamlarla HamTed</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["2", "Ana Kategori"],
            ["1000+", "Aktif İlan"],
            ["500+", "Nakliyeci"],
            ["81", "İl Kapsamı"],
            ["7/24", "İlan Yayını"],
            ["%0", "Komisyon"],
          ].map(([num, label]) => (
            <div key={label} className="rounded-3xl border border-ham-border bg-ham-card p-5 text-center shadow-sm">
              <div className="text-2xl font-black tracking-tight text-ham-ink" style={{ fontFamily: "'Space Mono',ui-monospace,monospace" }}>{num}</div>
              <div className="mt-1 text-xs text-ham-sub">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
