// ── BootLoader — soğuk açılış yükleyicisi (SAHA marka) ─────────────
// Native splash (#11141a) ile aynı zemin: splash kapanınca kesintisiz devam eder.
// Sarı kare logo + YÜKLET yazısı + kayan hazard şeridi + Space Mono durum satırı.
// Saf CSS animasyonu — ek bağımlılık yok, ilk boyamayı geciktirmez.

const ARCH = "'Archivo',system-ui,sans-serif";
const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";

export default function BootLoader() {
  return (
    <div
      role="status"
      aria-label="Yükleniyor"
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "#11141a",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 18,
      }}
    >
      <style>{`
        @keyframes boot-hazard { from { background-position: 0 0; } to { background-position: 28px 0; } }
        @keyframes boot-pulse  { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @keyframes boot-blink  { 0%, 60%, 100% { opacity: 0; } 20%, 40% { opacity: 1; } }
        .boot-dot { animation: boot-blink 1.2s infinite; }
        @media (prefers-reduced-motion: reduce) {
          .boot-anim { animation: none !important; }
        }
      `}</style>

      {/* Sarı kare logo — InstallPrompt'taki kare logo dilinin ters (koyu zemin) hali */}
      <div
        className="boot-anim"
        style={{
          width: 64, height: 64, background: "#facc15",
          border: "2px solid #0A0A0A", boxShadow: "4px 4px 0 rgba(0,0,0,.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "boot-pulse 1.6s ease-in-out infinite",
        }}
      >
        <span style={{ fontFamily: ARCH, fontWeight: 900, fontSize: 38, lineHeight: 1, color: "#0A0A0A" }}>Y</span>
      </div>

      <div style={{ fontFamily: ARCH, fontWeight: 800, fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fff" }}>
        YÜKLET
      </div>

      {/* Kayan hazard şeridi — şantiye bandı */}
      <div
        className="boot-anim"
        style={{
          width: 180, height: 10,
          border: "2px solid #0A0A0A", boxShadow: "3px 3px 0 rgba(0,0,0,.55)",
          backgroundImage: "repeating-linear-gradient(45deg, #facc15 0 10px, #0A0A0A 10px 20px)",
          backgroundSize: "28px 28px",
          animation: "boot-hazard .7s linear infinite",
        }}
      />

      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: "rgba(255,255,255,.55)" }}>
        YÜKLENİYOR
        <span className="boot-dot boot-anim">.</span>
        <span className="boot-dot boot-anim" style={{ animationDelay: ".2s" }}>.</span>
        <span className="boot-dot boot-anim" style={{ animationDelay: ".4s" }}>.</span>
      </div>
    </div>
  );
}
