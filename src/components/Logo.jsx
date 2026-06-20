// ── DAYIM marka logosu — SAHA dili. Sarı kutu içinde siyah "DAYIM" yazısı
// (önizleme varyantı F). Tek doğruluk kaynağı: tüm uygulama bunu kullanır.
//
//   <Logo />                 → varsayılan (orta boy, açık zemin)
//   <Logo size="sm" />       → küçük (header/tab)
//   <Logo size="lg" />       → büyük (giriş / splash)
//   <Logo onDark />          → koyu zemin üzerinde (gölge yumuşar)
//   <Logo as="span" />       → satır içi (varsayılan inline-flex zaten)

const SIZES = {
  sm: { fontSize: 15, padX: 8, padY: 3, radius: 5, border: 2, shadow: 2 },
  md: { fontSize: 22, padX: 11, padY: 5, radius: 6, border: 2, shadow: 3 },
  lg: { fontSize: 30, padX: 15, padY: 7, radius: 7, border: 2.5, shadow: 4 },
};

export default function Logo({ size = "md", onDark = false, className = "", style = {} }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <span
      className={className}
      aria-label="DAYIM"
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#FACC15",
        color: "#0A0A0A",
        border: `${s.border}px solid #0A0A0A`,
        borderRadius: s.radius,
        padding: `${s.padY}px ${s.padX}px`,
        boxShadow: `${s.shadow}px ${s.shadow}px 0 ${onDark ? "rgba(10,10,10,.45)" : "#0A0A0A"}`,
        fontFamily: "'Archivo', system-ui, sans-serif",
        fontWeight: 900,
        fontSize: s.fontSize,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        textTransform: "uppercase",
        userSelect: "none",
        ...style,
      }}
    >
      DAYIM
    </span>
  );
}
