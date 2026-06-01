import { C } from "../utils/theme";
import SEO from "../components/SEO";

export default function HakkimizdaPage() {
  return (
    <div className="page-content">
      <SEO title="Hakkimizda" description="HamTed hakkinda bilgi edinin. Turkiye'nin yuk & nakliye eslestirme platformu." />
      <div className="page-header">
        <div className="section-badge" style={{ background: C.blueBg, borderColor: C.blue+"30", color: C.blue }}>
          Biz Kimiz?
        </div>
        <h1 className="page-title">Hakkimizda</h1>
      </div>

      <div className="about-grid">
        <div className="about-mission">
          <h2 className="section-title">Misyonumuz</h2>
          <p className="about-text">
            HamTed, hafriyat ve silobas tasimaciliginda yuku olan ile bos araci olan tarafi dogrudan bulusturur.
            Telefon trafigi ve araci zincirini ortadan kaldirarak, dogru aracin dogru ise hizlica ulasmasini saglariz.
          </p>
          <p className="about-text">
            Seffaf ilanlar, karsilikli puanlama ve komisyonsuz eslestirme ile nakliye sektorunde yeni bir standart belirliyoruz.
          </p>

          <h2 className="section-title" style={{ marginTop: 32 }}>Vizyonumuz</h2>
          <p className="about-text">
            Turkiye'nin dokme yuk ve hafriyat tasimaciliginda en cok kullanilan dijital eslestirme agi olmak;
            her muteahhidin ve her nakliyecinin bos kapasiteyi degerlendirebildigi bir ekosistem kurmak.
          </p>
        </div>

        <div className="about-cards">
          {[
            ["🚛", "Iki ana kategori", "Hafriyat ve silobas islerine odakli, sade ve hizli bir deneyim."],
            ["📍", "Turkiye geneli", "Marmara'dan baslayarak tum bolgelerde yuk ve arac eslestirme."],
            ["🤝", "Komisyonsuz", "Anlasma taraflar arasinda; platform yalnizca bulusturma ucretsiz."],
            ["⭐", "Guven puani", "Karsilikli degerlendirme ile guvenilir nakliyeci ve is sahibi agi."],
          ].map(([icon, title, desc]) => (
            <div key={title} className="about-card">
              <div className="about-card-icon">{icon}</div>
              <div>
                <div className="about-card-title">{title}</div>
                <div className="about-card-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rakamlar */}
      <div style={{ marginTop: 48 }}>
        <h2 className="section-title" style={{ textAlign: "center" }}>Rakamlarla HamTed</h2>
        <div className="numbers-grid">
          {[
            ["2", "Ana Kategori"],
            ["1000+", "Aktif Ilan"],
            ["500+", "Nakliyeci"],
            ["81", "Il Kapsami"],
            ["7/24", "Ilan Yayini"],
            ["%0", "Komisyon"],
          ].map(([num, label]) => (
            <div key={label} className="number-card">
              <div className="number-value">{num}</div>
              <div className="number-label">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
