// ── BootLoader — soğuk açılış yükleyicisi (SAHA marka) ─────────────
// Gerçek logo kamyonu (/logo-icon.png) zemin çizgisi üzerinde ileri-geri
// manevra yapar; zemin sayfalarla aynı manila (#F1EDE5) — yükleyiciden
// içeriğe geçiş kesintisiz. Saf CSS animasyonu — ek bağımlılık yok.

const ARCH = "'Archivo',system-ui,sans-serif";
const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";
const C = { bg: "#F1EDE5", ink: "#0A0A0A", sub: "#5A5852" };

export default function BootLoader() {
  return (
    <div
      role="status"
      aria-label="Yükleniyor"
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: C.bg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 14,
      }}
    >
      <style>{`
        @keyframes boot-drive {
          0%   { transform: translateX(-30px); }
          50%  { transform: translateX(30px); }
          100% { transform: translateX(-30px); }
        }
        @keyframes boot-blink { 0%, 60%, 100% { opacity: 0; } 20%, 40% { opacity: 1; } }
        .boot-dot { animation: boot-blink 1.2s infinite; }
        @media (prefers-reduced-motion: reduce) {
          .boot-anim { animation: none !important; }
        }
      `}</style>

      {/* Kamyon + zemin çizgisi */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img
          src="/logo-icon.png"
          alt=""
          width={150}
          height={150}
          className="boot-anim"
          style={{ display: "block", animation: "boot-drive 2.2s ease-in-out infinite", marginBottom: -28 }}
        />
        <div style={{ width: 220, height: 3, background: C.ink, borderRadius: 2 }} />
      </div>

      <div style={{ fontFamily: ARCH, fontWeight: 800, fontSize: 20, letterSpacing: "0.18em", textTransform: "uppercase", color: C.ink }}>
        YÜKLET
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: C.sub }}>
        YÜKLENİYOR
        <span className="boot-dot boot-anim">.</span>
        <span className="boot-dot boot-anim" style={{ animationDelay: ".2s" }}>.</span>
        <span className="boot-dot boot-anim" style={{ animationDelay: ".4s" }}>.</span>
      </div>
    </div>
  );
}
