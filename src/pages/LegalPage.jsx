import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, FileText, Trash2 } from "lucide-react";
import SEO from "../components/SEO";
import { useToast } from "../components/Toast";

// ── Yasal — SAHA design language (tab chips, hazard top strip, Archivo uppercase
// section titles, mono meta, 2px ink border). Slug routing + content preserved 1:1.

const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  sub: "#5A5852",
  muted: "#9A968D",
};
const ARCHIVO = "'Archivo', system-ui, sans-serif";
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const BODY = "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const LEGAL_PAGES = {
  "gizlilik": {
    title: "Gizlilik Politikasi",
    content: `YÜKLET ("Platform") olarak, kullanicilarimizin gizliligine onem veriyoruz. Bu politika, kisisel verilerinizin nasil toplandigi, kullanildigi ve korundugu hakkinda bilgi vermektedir. YÜKLET, yuk sahibi ile nakliyeciyi bulusturan bir eslestirme platformudur.

## 1. Toplanan Veriler

Platform uzerinden asagidaki kisisel veriler toplanabilir:

- **Kimlik Bilgileri:** Ad, soyad, firma unvani
- **Iletisim Bilgileri:** E-posta adresi, telefon numarasi
- **Ilan Bilgileri:** Yayinladiginiz is/arac ilanlari, yukleme ve bosaltma noktalari
- **Teklif Bilgileri:** Verdiginiz veya aldiginiz teklifler, mesajlasma gecmisi
- **Konum Verileri:** Yalnizca nakliyeci olarak canli sefer takibini KENDINIZ baslattiginizda, sefer suresince konumunuz alinir ve o isin sahibiyle paylasilir. Teslim kaniti gonderirken teslim noktasi kaydedilebilir. Konum izni vermezseniz diger tum ozellikler calismaya devam eder.
- **Fotograf ve Belgeler:** Kamera/galeri izniyle yuklediginiz kantar fisi, belge ve mesaj gorselleri
- **Teknik Veriler:** IP adresi, cihaz ve isletim sistemi bilgisi, hata kayitlari

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

## 5. Cerezler ve Yerel Depolama

Mobil uygulama cerez kullanmaz. Oturum bilgileriniz ve tercihleriniz (orn. engellediginiz kullanicilar) cihazinizin guvenli yerel depolamasinda tutulur. Uygulamada ucuncu taraf reklam veya analitik SDK'si yoktur.

## 6. Haklariniz

6698 sayili KVKK kapsaminda asagidaki haklara sahipsiniz:

- Kisisel verilerinizin islenip islenmedigini ogrenme
- Islenen veriler hakkinda bilgi talep etme
- Verilerin duzeltilmesini veya silinmesini isteme
- Islemenin kisitlanmasini talep etme
- Verilerin tasinabilirligini talep etme

Basvurulariniz icin: kvkk@yuklet.co

## 7. Iletisim

Veri sorumlusu: YÜKLET (yuklet.co)
E-posta: info@yuklet.co
KVKK basvurulari: kvkk@yuklet.co`
  },
  "kullanim-kosullari": {
    title: "Kullanim Kosullari",
    content: `Bu kullanim kosullari, YÜKLET platformunu kullanan tum kullanicilar icin gecerlidir. Platformu kullanarak bu kosullari kabul etmis sayilirsiniz.

## 1. Tanimlar

- **Platform:** yuklet.co web sitesi ve mobil uygulamasi
- **Kullanici:** Platformu kullanan gercek veya tuzel kisi
- **Is Sahibi:** Tasinacak yuk icin is ilani veren taraf (alici, firma, kisi)
- **Nakliyeci:** Arac ilani veren veya isi ilandaki fiyattan kabul eden tasiyici taraf

## 2. Platformun Niteligi

- YÜKLET, is sahibi ile nakliyeciyi bulusturan bir eslestirme/ilan platformudur
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

## 5. Kullanici Icerigi ve Sifir Tolerans

- Uygunsuz, saldirgan, taciz edici, nefret soylemi iceren veya hukuka aykiri icerige **sifir tolerans** gosterilir
- Kullanicilar bu tur icerigi veya kullaniciyi **Sikayet Et** ozelligiyle bildirebilir ve ilgili kullaniciyi **engelleyebilir**
- Bildirilen icerik **en gec 24 saat icinde** incelenir
- Ihlal tespit edilirse icerik kaldirilir ve **ihlal eden kullanicinin hesabi askiya alinir veya kalici olarak kapatilir**
- Bu kurallara aykiri davranan kullanicilarla platform iletisimi kesme hakkini sakli tutar

## 6. Sorumluluk Sinirlamasi

- Tasimanin yapilmasi, kalitesi ve odemesi taraflarin sorumlulugundadir
- Platform, kullanicilar arasindaki uyusmazliklarin tarafi degildir
- Arac belgeleri, yetki belgeleri (orn. K belgesi) ve sigorta yukumlulukleri ilgili tarafa aittir
- Platform, ucuncu taraf sitelere verilen linklerin iceriginden sorumlu degildir
- Mucbir sebepler nedeniyle olusan aksakliklardan sorumluluk kabul edilmez

## 7. Fikri Mulkiyet

- Platform uzerindeki tum icerik, tasarim ve yazilim YÜKLET'e aittir
- Izinsiz kopyalama, dagitma veya degistirme yasaktir

## 8. Uyusmazlik Cozumu

- Bu kosullar Turkiye Cumhuriyeti kanunlarina tabidir
- Uyusmazliklarda Istanbul Mahkemeleri ve Icra Daireleri yetkilidir`
  },
  "kvkk": {
    title: "KVKK Aydinlatma Metni",
    content: `6698 Sayili Kisisel Verilerin Korunmasi Kanunu ("KVKK") uyarinca, YÜKLET platformu isleticisi olarak veri sorumlusu sifatiyla sizleri bilgilendirmek isteriz.

## 1. Veri Sorumlusu

YÜKLET (yuklet.co)
Iletisim: kvkk@yuklet.co

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

Haklarinizi kullanmak icin hesabiniza kayitli e-posta adresinizden yazin:
- E-posta: kvkk@yuklet.co

Basvurular en gec 30 gun icinde ucretsiz sonuclandirilir. Hesabinizi ve tum verilerinizi ayrica uygulama icinden (Profil > Hesabi sil) aninda silebilirsiniz.`
  },
  "hesap-silme": {
    title: "Hesap ve Veri Silme",
    content: `YÜKLET hesabinizi ve hesabinizla iliskili tum verileri kalici olarak silebilirsiniz. Bu sayfa, Google Play ve App Store gerekleri uyarinca hesap silme yontemini ve silinen verileri aciklar.

## 1. Uygulama Icinden Silme (Onerilen)

En hizli yontem uygulama uzerinden silmektir:

- **Profil** sekmesini acin
- Menuden **"Hesabi sil"** satirina dokunun
- Bu sayfada sekmelerin hemen altindaki **"Hesabimi kalici olarak sil"** butonuna dokunun
- Onay adimini tamamlayin

Hesabiniz ve verileriniz aninda silinir, oturumunuz kapatilir.

## 2. Web Uzerinden Silme Talebi

Uygulamaya erisiminiz yoksa, hesabinizi web uzerinden silmek icin talep gonderebilirsiniz:

- **E-posta:** info@yuklet.co adresine, hesabinizla kayitli e-posta adresinden "Hesap Silme Talebi" konusuyla yazin
- Kimlik dogrulamasi sonrasi talebiniz **en gec 30 gun** icinde islenir

## 3. Silinen Veriler

Hesap silindiginde asagidaki veriler **kalici olarak** silinir:

- **Hesap Bilgileri:** Ad, e-posta, telefon, firma bilgileri
- **Ilanlariniz:** Yayinladiginiz tum is ve arac ilanlari
- **Teklifleriniz:** Verdiginiz ve aldiginiz tum teklifler
- **Mesajlariniz:** Tum mesajlasma gecmisi
- **Belgeleriniz:** Yukledginiz belgeler ve dogrulama kayitlari
- **Degerlendirmeler:** Verdiginiz puan ve yorumlar

## 4. Saklanabilecek Veriler

Yasal yukumlulukler geregi bazi veriler sinirli sure saklanabilir:

- Fatura ve odeme kayitlari (Vergi Usul Kanunu uyarinca 5 yil)
- Yasal uyusmazlik konusu olan kayitlar (uyusmazlik suresince)

Bu veriler yalnizca yasal zorunluluk kapsaminda tutulur ve baska amacla kullanilmaz.

## 5. Iletisim

Sorulariniz icin:
- E-posta: info@yuklet.co
- KVKK talepleri: kvkk@yuklet.co`
  }
};

// Tab chips — slug-based navigation (routing preserved)
const TABS = [
  { slug: "gizlilik", label: "Gizlilik" },
  { slug: "kullanim-kosullari", label: "Kullanım" },
  { slug: "kvkk", label: "KVKK" },
  { slug: "hesap-silme", label: "Hesap Sil" },
];

const shell = { display: "flex", flexDirection: "column", minHeight: "100%", background: C.bg, fontFamily: BODY };

export default function LegalPage({ user, onDeleteAccount, onRequireAuth }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const page = LEGAL_PAGES[slug];
  // Hesap silme aksiyonu artık burada yaşıyor (Profil yüzeyinden kaldırıldı):
  // Profil > Gizlilik & Yasal > "Hesap Sil" sekmesi. İki adımlı onay.
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleDeleteAccount = async () => {
    setDeleting(true);
    const res = await onDeleteAccount?.();
    if (res && res.ok === false) {
      toast?.(res.error || "Hesap silinemedi, lütfen tekrar dene.", "error");
      setDeleting(false);
      return;
    }
    toast?.("Hesabın ve verilerin silindi.", "info");
    navigate("/");
  };

  if (!page) {
    return (
      <div style={{ ...shell, alignItems: "center", justifyContent: "center", padding: "64px 20px", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0 #0A0A0A" }}>
          <FileText size={26} strokeWidth={2.2} color={C.ink} />
        </div>
        <div style={{ marginTop: 14, fontFamily: ARCHIVO, fontSize: 15, fontWeight: 900, textTransform: "uppercase", color: C.ink }}>Sayfa Bulunamadı</div>
        <Link to="/" style={{ marginTop: 10, fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: C.ink }}>Ana sayfaya dön →</Link>
      </div>
    );
  }

  return (
    <div style={shell}>
      <SEO title={page.title} description={page.title + " - YÜKLET (yuklet.co)"} />

      {/* App bar */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 20, background: C.header,
          borderBottom: `2px solid ${C.ink}`, display: "flex", alignItems: "center", gap: 10, padding: "11px 12px",
        }}
      >
        <button
          onClick={() => navigate(-1)} aria-label="Geri"
          style={{ border: `2px solid ${C.ink}`, background: C.card, borderRadius: 6, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.ink }}
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <h1 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 17, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink }}>Yasal</h1>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, padding: "16px 16px 96px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Tab chips */}
        <div style={{ display: "flex", gap: 8 }}>
          {TABS.map((t) => {
            const active = t.slug === slug;
            return (
              <button
                key={t.slug}
                onClick={() => navigate(`/yasal/${t.slug}`)}
                style={{
                  flex: 1, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "9px 6px",
                  background: active ? C.ink : C.card, color: active ? C.yellow : C.ink,
                  fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Hesap silme aksiyonu — SAYFANIN ÜSTÜNDE, uzun yasal metnin ALTINDA DEĞİL.
            App Store 5.1.1(v) & Google Play: silme seçeneği kaydırmadan görünür olmalı
            (metnin altına gömülü olması 1.0.1 build 27'de ret nedeniydi).
            Yalnız "Hesap Sil" sekmesinde ve giriş yapılmışken. */}
        {slug === "hesap-silme" && (
          user ? (
            !confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", minHeight: 44, background: C.card, border: "2px solid #DC2626", color: "#DC2626", borderRadius: 6, padding: "12px", fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, cursor: "pointer" }}
              >
                <Trash2 size={15} strokeWidth={2.4} /> Hesabımı kalıcı olarak sil
              </button>
            ) : (
              <div style={{ padding: 14, background: C.card, border: "2px solid #DC2626", borderRadius: 6 }}>
                <p style={{ margin: "0 0 12px", fontFamily: MONO, fontSize: 12, color: C.ink, lineHeight: 1.5 }}>
                  Hesabın, ilanların, tekliflerin, mesajların ve belgelerin <strong>kalıcı olarak</strong> silinecek. Bu işlem geri alınamaz.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}
                    style={{ flex: 1, minHeight: 44, background: C.card, border: `2px solid ${C.ink}`, color: C.ink, borderRadius: 6, padding: "12px", fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>
                    Vazgeç
                  </button>
                  <button type="button" onClick={handleDeleteAccount} disabled={deleting}
                    style={{ flex: 1, minHeight: 44, background: "#DC2626", border: "2px solid #DC2626", color: "#fff", borderRadius: 6, padding: "12px", fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", cursor: "pointer", opacity: deleting ? 0.6 : 1 }}>
                    {deleting ? "Siliniyor…" : "Evet, sil"}
                  </button>
                </div>
              </div>
            )
          ) : (
            <div style={{ padding: 14, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, textAlign: "center" }}>
              <p style={{ margin: "0 0 10px", fontFamily: MONO, fontSize: 11.5, color: C.sub, lineHeight: 1.5 }}>
                Hesabını uygulama içinden silmek için önce giriş yap.
              </p>
              <button type="button" onClick={() => onRequireAuth?.()}
                style={{ width: "100%", minHeight: 44, background: C.ink, border: `2px solid ${C.ink}`, color: C.yellow, borderRadius: 6, padding: "12px", fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, cursor: "pointer" }}>
                Giriş yap
              </button>
            </div>
          )
        )}

        {/* Content card — hazard top strip */}
        <div style={{ position: "relative", overflow: "hidden", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, boxShadow: "3px 3px 0 #0A0A0A" }}>
          <div style={{ height: 7, backgroundImage: HAZARD }} />
          <div style={{ padding: 18 }}>
            <h2 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 20, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink }}>{page.title}</h2>
            <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: C.muted }}>
              Son güncelleme: 2 Temmuz 2026 · YÜKLET · yuklet.co
            </div>

            <div style={{ marginTop: 16, fontFamily: BODY, fontSize: 13, lineHeight: 1.6, color: C.sub }}>
              {page.content.split("\n").map((line, i) => {
                if (line.startsWith("## ")) {
                  return (
                    <h3 key={i} style={{ margin: "22px 0 8px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>
                      {line.replace("## ", "")}
                    </h3>
                  );
                }
                if (line.startsWith("- **")) {
                  const parts = line.replace("- **", "").split(":**");
                  return (
                    <div key={i} style={{ marginBottom: 6, paddingLeft: 4 }}>
                      <strong style={{ color: C.ink }}>{parts[0]}:</strong>{parts[1]}
                    </div>
                  );
                }
                if (line.startsWith("- ")) return <div key={i} style={{ marginBottom: 6, paddingLeft: 4 }}>{line.replace("- ", "• ")}</div>;
                if (line.trim() === "") return <br key={i} />;
                return <p key={i} style={{ margin: "0 0 8px" }}>{line}</p>;
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
