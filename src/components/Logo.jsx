// ── YÜKLET marka logosu — SAHA dili. Damperli kamyon + ileri ok simgesi +
// "YÜKLET" yazısı (yatay kilit). Şeffaf PNG (public/logo-full.png).
// Tek doğruluk kaynağı: tüm uygulama bunu kullanır.
//
//   <Logo />                 → varsayılan (orta boy, iki yanda hazard şeridi)
//   <Logo size="sm" />       → küçük (header/tab)
//   <Logo size="lg" />       → büyük (giriş / splash)
//   <Logo onDark />          → koyu zemin (görsel zaten şeffaf; gölge yumuşar)
//   <Logo icon />            → sadece simge (kamyon+ok), yazısız kompakt
//   <Logo flank={false} />   → şeritsiz, sadece logo (dar alanlar için)
//
// Yükseklik = size; genişlik orantılı (img intrinsic oran).

const HEIGHTS = { sm: 26, md: 38, lg: 56 };

// SAHA hazard bandı: sarı/antrasit çapraz şerit, dışa doğru kaybolur.
const YELLOW = "#FACC15";
const INK = "#1C1A17";

function Stripe({ h, side }) {
  const sh = Math.max(4, Math.round(h * 0.13)); // şerit kalınlığı
  const seg = sh + 2; // 45° kare desen adımı
  const fade =
    side === "left"
      ? "linear-gradient(90deg, transparent, #000 75%)"
      : "linear-gradient(270deg, transparent, #000 75%)";
  return (
    <span
      aria-hidden="true"
      style={{
        width: Math.round(h * 1.1),
        height: sh,
        borderRadius: sh,
        flexShrink: 1,
        background: `repeating-linear-gradient(-45deg, ${YELLOW} 0 ${seg}px, ${INK} ${seg}px ${seg * 2}px)`,
        WebkitMaskImage: fade,
        maskImage: fade,
      }}
    />
  );
}

export default function Logo({ size = "md", onDark = false, icon = false, flank, className = "", style = {} }) {
  const h = HEIGHTS[size] || HEIGHTS.md;
  // sm dar alanlarda (belge başlığı, not kutusu) kullanılıyor — şerit varsayılan kapalı
  const showFlank = flank ?? size !== "sm";
  const src = icon ? "/logo-icon.png" : "/logo-full.png";
  const img = (
    <img
      src={src}
      alt="YÜKLET"
      className={icon || !showFlank ? className : ""}
      style={{
        height: h,
        width: "auto",
        display: "inline-block",
        objectFit: "contain",
        // koyu zeminde ince siyah konturlu görseli ayırmak için yumuşak gölge
        filter: onDark ? "drop-shadow(0 1px 2px rgba(0,0,0,.5))" : "none",
        userSelect: "none",
        ...style,
      }}
      draggable={false}
    />
  );
  if (icon || !showFlank) return img;
  const imgH = style.height || h;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(imgH * 0.22),
        maxWidth: "100%",
      }}
    >
      <Stripe h={imgH} side="left" />
      {img}
      <Stripe h={imgH} side="right" />
    </span>
  );
}
