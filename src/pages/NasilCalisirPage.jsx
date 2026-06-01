import { C } from "../utils/theme";
import SEO from "../components/SEO";

const STEPS = [
  { num: "1", title: "Ilanini Yayinla", desc: "Tasinacak yukunu veya bos aracini birkac dakikada ekle. Konum, miktar ve tarihi belirt.", clr: C.accent },
  { num: "2", title: "Teklifleri Topla", desc: "Ilgili nakliyeciler veya is sahipleri ilanini gorur, sana teklif gonderir.", clr: C.blue },
  { num: "3", title: "Anlas", desc: "Gelen teklifleri karsilastir, en uygun olanla dogrudan iletisime gec ve anlas.", clr: C.green },
  { num: "4", title: "Yola Cik", desc: "Is tamamlandiktan sonra karsilikli puanlama ile guvenli bir topluluk olusturulur.", clr: C.amber },
];

export default function NasilCalisirPage() {
  return (
    <div className="page-content">
      <SEO title="Nasil Calisir" description="HamTed nasil calisir? 4 adimda hafriyat ve silobas yuklerinizi dogru aracla bulusturun." />
      <div className="page-header">
        <div className="section-badge" style={{ background: C.accentBg, borderColor: C.accentBorder, color: C.accent }}>
          Adim Adim
        </div>
        <h1 className="page-title">Nasil Calisir?</h1>
        <p className="page-desc">4 basit adimda yukunu veya aracini dogru tarafla bulustur.</p>
      </div>

      <div className="steps-grid">
        {STEPS.map(s => (
          <div key={s.num} className="step-card">
            <div className="step-num" style={{ background: s.clr + "12", borderColor: s.clr + "30", color: s.clr }}>{s.num}</div>
            <div className="step-title">{s.title}</div>
            <div className="step-desc">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* SSS */}
      <div style={{ marginTop: 48 }}>
        <h2 className="section-title">Sikca Sorulan Sorular</h2>
        <div className="faq-list">
          {[
            ["Ilan vermek ucretli mi?", "Hayir. Ilan vermek ve teklif almak ucretsizdir. Platform, is sahibi ile nakliyeciyi komisyonsuz bulusturur."],
            ["Hangi isler icin kullanabilirim?", "Iki ana kategori vardir: Hafriyat (kazi, toprak, moloz tasima) ve Silobas (dokme cimento, kum, mıcır, tahil gibi yukler)."],
            ["Is ilani mi arac ilani mi vermeliyim?", "Tasinacak yukunuz varsa 'Is ilani', bos araciniza is ariyorsaniz 'Arac ilani' verin. Karsi taraf size ulasir."],
            ["Teklifler nasil geliyor?", "Ilaniniz yayinlandiktan sonra ilgili kullanicilar teklif verir veya dogrudan iletisime gecer. Teklifleri ilan detayinda gorursunuz."],
            ["Odeme platform uzerinden mi yapiliyor?", "Hayir, anlasma ve odeme taraflar arasinda yapilir. Platform yalnizca eslestirme ve iletisimi saglar."],
          ].map(([q, a]) => (
            <div key={q} className="faq-item">
              <div className="faq-question">{q}</div>
              <div className="faq-answer">{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
