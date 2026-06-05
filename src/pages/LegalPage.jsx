import { useParams, Link } from "react-router-dom";
import SEO from "../components/SEO";

const LEGAL_PAGES = {
  "gizlilik": {
    title: "Gizlilik Politikasi",
    content: `HamTed Teknoloji A.S. ("HamTed") olarak, kullanicilarimizin gizliligine onem veriyoruz. Bu politika, kisisel verilerinizin nasil toplandigi, kullanildigi ve korundugu hakkinda bilgi vermektedir. HamTed, yuk sahibi ile nakliyeciyi bulusturan bir eslestirme platformudur.

## 1. Toplanan Veriler

Platform uzerinden asagidaki kisisel veriler toplanabilir:

- **Kimlik Bilgileri:** Ad, soyad, firma unvani, vergi numarasi
- **Iletisim Bilgileri:** E-posta adresi, telefon numarasi, adres
- **Ilan Bilgileri:** Yayinladiginiz is/arac ilanlari, yukleme ve bosaltma noktalari
- **Teklif Bilgileri:** Verdiginiz veya aldiginiz teklifler, mesajlasma gecmisi
- **Teknik Veriler:** IP adresi, tarayici bilgisi, cerez verileri
- **Kullanim Verileri:** Platform icindeki etkilesimler, arama gecmisi

## 2. Verilerin Kullanim Amaci

Toplanan veriler asagidaki amaclarla kullanilir:

- Ilan yayinlama ve eslestirme hizmetinin sunulmasi
- Kullanici hesaplarinin olusturulmasi ve yonetimi
- Taraflar arasinda iletisim ve teklif surecinin saglanmasi
- Karsilikli degerlendirme ve guven puani sisteminin isletilmesi
- Platform iyilestirme ve analiz calismalari
- Yasal yukumluluklerin yerine getirilmesi

## 3. Verilerin Paylasilmasi

Kisisel verileriniz, asagidaki durumlar disinda ucuncu taraflarla paylasilmaz:

- Eslestirme amaciyla, ilan verdiginiz/teklif aldiginiz karsi taraf ile
- Yasal zorunluluklar gerektirdiginde yetkili kurumlar
- Platform altyapisini saglayan teknik hizmet saglayicilar

## 4. Veri Guvenligi

- 256-bit SSL sifreleme ile veri iletimi
- Erisim kontrolu ve yetkilendirme mekanizmalari
- Duzenli guvenlik denetimleri

## 5. Cerez Politikasi

Platform, kullanici deneyimini iyilestirmek icin cerezler kullanir:

- **Zorunlu Cerezler:** Platform isleyisi icin gerekli
- **Analitik Cerezler:** Kullanim istatistikleri (Google Analytics)
- **Tercih Cerezleri:** Dil, tema gibi kullanici tercihleri

## 6. Haklariniz

6698 sayili KVKK kapsaminda asagidaki haklara sahipsiniz:

- Kisisel verilerinizin islenip islenmedigini ogrenme
- Islenen veriler hakkinda bilgi talep etme
- Verilerin duzeltilmesini veya silinmesini isteme
- Islemenin kisitlanmasini talep etme
- Verilerin tasinabilirligini talep etme

Basvurulariniz icin: kvkk@hamted.com.tr

## 7. Iletisim

HamTed Teknoloji A.S.
Buyukdere Cad. No:123 Kat:5, Levent, Istanbul
E-posta: info@hamted.com.tr
Telefon: +90 (212) 555 00 00`
  },
  "kullanim-kosullari": {
    title: "Kullanim Kosullari",
    content: `Bu kullanim kosullari, HamTed platformunu kullanan tum kullanicilar icin gecerlidir. Platformu kullanarak bu kosullari kabul etmis sayilirsiniz.

## 1. Tanimlar

- **Platform:** hamted.com.tr web sitesi ve mobil uygulamasi
- **Kullanici:** Platformu kullanan gercek veya tuzel kisi
- **Is Sahibi:** Tasinacak yuk icin is ilani veren taraf (muteahhit, firma, kisi)
- **Nakliyeci:** Arac ilani veren veya ise teklif veren tasiyici taraf

## 2. Platformun Niteligi

- HamTed, is sahibi ile nakliyeciyi bulusturan bir eslestirme/ilan platformudur
- Platform, tasima hizmetinin tarafi degildir; tasima sozlesmesi dogrudan kullanicilar arasinda kurulur
- Platform, ilan ve tekliflerin dogrulugunu garanti etmez

## 3. Uyelik Kosullari

- Uyelik icin gercek ve dogru bilgi verilmesi gerekir
- 18 yasindan kucukler platform uzerinden islem yapamaz
- Yanlis veya yaniltici bilgi vermek uyeligin iptaline yol acar

## 4. Ilan ve Teklif Kurallari

- Ilanlar gercek bir is veya arac icin verilmelidir
- Yaniltici, mukerrer veya konu disi ilanlar kaldirilabilir
- Verilen teklifler baglayici nitelikte olup iyi niyet kurallarina tabidir
- Anlasma ve odeme kosullari taraflar arasinda serbestce belirlenir

## 5. Sorumluluk Sinirlamasi

- Tasimanin yapilmasi, kalitesi ve odemesi taraflarin sorumlulugundadir
- Platform, kullanicilar arasindaki uyusmazliklarin tarafi degildir
- Arac belgeleri, yetki belgeleri (orn. K belgesi) ve sigorta yukumlulukleri ilgili tarafa aittir
- Platform, ucuncu taraf sitelere verilen linklerin iceriginden sorumlu degildir
- Mucbir sebepler nedeniyle olusan aksakliklardan sorumluluk kabul edilmez

## 6. Fikri Mulkiyet

- Platform uzerindeki tum icerik, tasarim ve yazilim HamTed'e aittir
- Izinsiz kopyalama, dagitma veya degistirme yasaktir

## 7. Uyusmazlik Cozumu

- Bu kosullar Turkiye Cumhuriyeti kanunlarina tabidir
- Uyusmazliklarda Istanbul Mahkemeleri ve Icra Daireleri yetkilidir`
  },
  "kvkk": {
    title: "KVKK Aydinlatma Metni",
    content: `6698 Sayili Kisisel Verilerin Korunmasi Kanunu ("KVKK") uyarinca, HamTed Teknoloji A.S. olarak veri sorumlusu sifatiyla sizleri bilgilendirmek isteriz.

## 1. Veri Sorumlusu

HamTed Teknoloji A.S.
Mersis No: 0123456789012345
Adres: Buyukdere Cad. No:123 Kat:5, Levent, Istanbul

## 2. Kisisel Verilerin Islenmesi

Kisisel verileriniz, KVKK'nin 5. ve 6. maddelerinde belirtilen hukuki sebeplere dayanilarak asagidaki amaclarla islenmektedir:

- Ilan yayinlama ve eslestirme hizmetinin yurutulmesi
- Taraflar arasinda iletisim ve teklif surecinin saglanmasi
- Kullanici iliskileri yonetimi ve guven puani sistemi
- Bilgi guvenligi sureclerinin yurutulmesi
- Hukuki sureclerin takibi

## 3. Kisisel Verilerin Aktarimi

Kisisel verileriniz, yukarida belirtilen amaclar dogrultusunda:

- Eslestirme amaciyla ilgili karsi tarafa
- Teknik altyapi ve hizmet saglayicilara
- Yasal zorunluluk halinde yetkili kamu kurumlarina

KVKK'nin 8. ve 9. maddelerinde belirtilen kosullara uygun olarak aktarilabilir.

## 4. Veri Toplama Yontemi ve Hukuki Sebebi

Kisisel verileriniz;
- Uyelik formu
- Ilan ve teklif formlari
- Iletisim formu
- Cerezler ve otomatik yontemler

araciligiyla, sozlesmenin ifasi, yasal yukumluluk ve mesru menfaat hukuki sebeplerine dayanilarak toplanmaktadir.

## 5. Veri Sahibi Haklari (KVKK Madde 11)

KVKK'nin 11. maddesi uyarinca;

a) Kisisel verilerinizin islenip islenmedigini ogrenme
b) Islenmisse buna iliskin bilgi talep etme
c) Isleme amacini ve amacina uygun kullanilip kullanilmadigini ogrenme
d) Yurt icinde veya yurt disinda aktarildigi ucuncu kisileri bilme
e) Eksik veya yanlis islenmisse duzeltilmesini isteme
f) KVKK'nin 7. maddesinde ongoren kosullar cercevesinde silinmesini/yok edilmesini isteme
g) Duzeltme ve silme islemlerinin aktarildigi ucuncu kisilere bildirilmesini isteme
h) Islenen verilerin munhasiran otomatik sistemler vasitasiyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya cikmasina itiraz etme
i) Kanuna aykiri olarak islenmesi sebebiyle zarara ugramaniz halinde zararin giderilmesini talep etme

haklarina sahipsiniz.

## 6. Basvuru Yontemi

Haklarinizi kullanmak icin:
- E-posta: kvkk@hamted.com.tr
- Posta: Buyukdere Cad. No:123 Kat:5, Levent, Istanbul
- KEP: hamted@hs01.kep.tr

Basvurular en gec 30 gun icinde sonuclandirilir.`
  }
};

export default function LegalPage() {
  const { slug } = useParams();
  const page = LEGAL_PAGES[slug];

  if (!page) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 px-5 py-16 text-center text-slate-900 dark:text-slate-100">
        <div className="text-4xl">📜</div>
        <div className="text-base font-bold text-slate-950 dark:text-slate-100">Sayfa bulunamadı</div>
        <Link to="/" className="text-sm font-bold text-amber-600">Ana sayfaya dön</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 text-slate-900 dark:text-slate-100">
      <SEO title={page.title} description={page.title + " - HamTed Teknoloji A.Ş."} />
      <div className="rounded-3xl bg-white dark:bg-navy-card p-7 shadow-sm">
        <h1 className="mb-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">{page.title}</h1>
        <div className="mb-6 text-xs text-gray-400 dark:text-navy-muted">Son güncelleme: 1 Ocak 2026 · HamTed Teknoloji A.Ş.</div>
        <div className="text-sm leading-relaxed text-gray-600 dark:text-slate-300">
          {page.content.split("\n").map((line, i) => {
            if (line.startsWith("## ")) return <h2 key={i} className="mb-2 mt-6 text-lg font-bold text-slate-950 dark:text-slate-100">{line.replace("## ", "")}</h2>;
            if (line.startsWith("- **")) {
              const parts = line.replace("- **", "").split(":**");
              return <div key={i} className="mb-1.5 pl-1"><strong className="text-slate-900 dark:text-slate-100">{parts[0]}:</strong>{parts[1]}</div>;
            }
            if (line.startsWith("- ")) return <div key={i} className="mb-1.5 pl-1">{line.replace("- ", "• ")}</div>;
            if (line.trim() === "") return <br key={i} />;
            return <p key={i} className="mb-2">{line}</p>;
          })}
        </div>
      </div>
    </div>
  );
}
