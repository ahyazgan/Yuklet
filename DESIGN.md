# DESIGN.md — HamTed Tasarım Anayasası

> Tek doğruluk kaynağı. Tüm ajanlar (UI Builder, UX Writer, Data Viz, Mobile Agent, Conversion Optimizer) bu dosyaya uyar.
> Token'lar `src/index.css`'teki gerçek CSS değişkenlerinden türetilmiştir — hardcode değer yasak.

## Marka
- **Ürün:** HamTed — hafriyat & silobas yük taşımacılığı ilan/eşleştirme platformu.
- **Ton:** Güvenilir, sade, sahaya yakın. Müteahhit/nakliyeci/tedarikçi diliyle konuş — jargon değil, iş dili.
- **Logo:** Turuncu gradyan kare (`#C85A24 → #E8864A`), beyaz "H", radius 10px.

## Renk (light / dark)
| Token | Light | Dark | Kullanım |
|---|---|---|---|
| `--bg` | `#FAFAF8` | `#121212` | Sayfa zemini |
| `--bg-card` | `#FFFFFF` | `#1E1E1E` | Kart/yüzey |
| `--border` | `#E8E5DF` | `#2E2E2E` | Kenarlık |
| `--border-light` | `#F0EDE8` | `#262626` | İnce ayraç |
| `--accent` | `#C85A24` | `#E8864A` | **Primary** — CTA, vurgu, fiyat |
| `--accent-bg` | `#C85A2410` | `#E8864A15` | Primary açık zemin |
| `--accent-border` | `#C85A2435` | `#E8864A40` | Primary kenarlık |
| `--text` | `#1A1918` | `#EAEAEA` | Ana metin |
| `--text-sec` | `#6B6860` | `#A0A0A0` | İkincil metin |
| `--text-ter` | `#A09E96` | `#6A6A6A` | Üçüncül / etiket |
| `--green` | `#2E7D42` | `#4CAF50` | Başarı, kabul, "uygun" |
| `--blue` | `#2E6FA3` | `#5CA8DC` | Bilgi, teklif rozeti |
| `--amber` | `#A07828` | `#D4A642` | Uyarı, rating, promo |
| `--red` | `#B0423A` | `#E05A52` | Hata, sil, reddet |

Statü zeminleri: `--green-bg`, `--blue-bg`, `--amber-bg` (+ red `#B0423A15`).
**Kural:** Dönüşüm için yeni renk uydurma — vurgu = `--accent`. Renkli gölge YOK.

## Tipografi
- **Font:** `Outfit` (Google Fonts), sans-serif. Ağırlıklar: 300–900.
- **Ölçek (px):** 10 · 11 · 12 · 13 (gövde) · 14 · 15 · 16 · 17 · 20 · 22 · 24 · 28 · 32 · 36 · 42
- **Başlık ağırlığı:** 800–900, letter-spacing negatif (-0.5 → -2px) büyük başlıklarda.
- **Gövde:** 13–14px, weight 400–500, line-height 1.6–1.8.
- **Etiket/caps:** 10–12px, weight 600–700, letter-spacing +0.5→1.2px.

## Spacing (4px tabanlı)
`4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 52`
- Kart iç padding: 18–28px. Sayfa padding (mobil): 16–20px.

## Radius
- sm **6–8** (buton, input, küçük rozet)
- md **10–12** (kart küçük, filtre, search)
- lg **14–16** (kart, form-card, modal-sm)
- xl **20** (hero, modal, büyük kart)
- pill **999 / 20** (section-badge, cart-badge)

## Gölge
- `--shadow`: `0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)` — kart varsayılan.
- `--shadow-hover`: `0 8px 25px rgba(0,0,0,.08), 0 3px 10px rgba(0,0,0,.05)` — hover/yükselti.
- Yumuşak, nötr. Renkli gölge yok (primary buton hariç: `0 4px 16px #C85A2435`).

## Breakpoint
- mobil **≤ 480** (küçük telefon) · **≤ 768** (telefon — desktop-nav gizlenir, mobile-nav açılır)
- tablet **≤ 1024** · içerik max-width **1160px**

## Mobil (Mobile Agent kuralları)
- Tasarım çerçevesi: **390 × 844** (iPhone 14/15 referans).
- Dokunma hedefi **min 44×44px**. Birincil aksiyonlar başparmak bölgesinde (alt %33).
- **Alt tab bar** (5 sekme): Ana sayfa · İlanlar · **İlan Ver (orta, vurgulu)** · Mesajlar · Profil.
- Üst safe-area + alt home-indicator için boşluk bırak.
- Her ekranda tek baskın CTA. Liste = tek sütun kart akışı.

## İlkeler
1. Token dışı değer kullanılmaz (renk/spacing/tipografi/radius).
2. Sade hiyerarşi, cömert boşluk, düşük görsel gürültü. Chart junk yok.
3. Her ekran tek soruyu/aksiyonu öne çıkarır (Conversion: hero → değer → kanıt → CTA).
4. Empty state: tek cümle değer + tek net aksiyon.
5. TR varsayılan; düzgün Türkçe karakter. Buton fiille başlar ("Teklif ver", "İlan oluştur").
6. Dark pattern yok: sahte aciliyet, gizli ücret, aldatıcı vazgeçme yok.

## Sapma kontrolü
Hardcode renk/spacing görülürse Design Lead düzeltir. Yeni token gerekiyorsa gerekçesi buraya yazılır.
