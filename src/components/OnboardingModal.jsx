import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

// ── SAHA Onboarding — ilk ziyaret rol seçimi (bir kez gösterilir).
// 2px ink çerçeve · hazard şeridi · Archivo uppercase · Space Mono · renkli kare baş harf.
// Renk anlam taşır: sarı=müteahhit, stone=nakliyeci, yeşil=tedarikçi.

const C = {
  ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", card: "#FFFFFF",
  stone: "#F4F1EA", sub: "#5A5852", muted: "#9A968D",
};
const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";
const ARCH = "'Archivo',system-ui,sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";
const FRAME = `2px solid ${C.ink}`;

const ROLES = [
  { letter: "M", title: "Müteahhit / Alıcı", desc: "Yük taşıtmak istiyorum", route: "/muteahhit", bg: C.yellow, fg: C.ink },
  { letter: "N", title: "Nakliyeci / Taşıyıcı", desc: "Aracımla iş arıyorum", route: "/nakliyeci", bg: C.stone, fg: C.ink },
  { letter: "T", title: "Tedarikçi / Ocak", desc: "Malzeme satıyorum", route: "/tedarikci", bg: C.green, fg: "#FFFFFF" },
];

export default function OnboardingModal({ onClose }) {
  const navigate = useNavigate();
  const pick = (route) => { onClose?.(); if (route) navigate(route); };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,10,.55)" }}
    >
      <div
        className="w-full max-w-[420px] overflow-hidden"
        style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: "6px 6px 0 rgba(10,10,10,.18)" }}
      >
        {/* üst hazard şeridi */}
        <div style={{ height: 7, backgroundImage: HAZARD }} />

        <div className="p-7">
          <div className="mb-3.5 flex justify-center">
            <Logo size="lg" />
          </div>
          <h2 className="text-center text-[20px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.02em" }}>
            Hoş Geldin
          </h2>
          <p className="mb-5 mt-1.5 text-center text-[12px]" style={{ color: C.sub, fontFamily: MONO }}>
            Hafriyat ve dökme yükü doğru araçla, komisyonsuz buluşturuyoruz. Sen hangisisin?
          </p>

          <div className="flex flex-col gap-2.5">
            {ROLES.map((r) => (
              <button
                key={r.title}
                onClick={() => pick(r.route)}
                className="flex items-center gap-3.5 p-3.5 text-left transition hover:-translate-y-0.5"
                style={{ border: FRAME, borderRadius: 6, background: C.card }}
              >
                <span
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-[18px] font-extrabold"
                  style={{ border: FRAME, borderRadius: 5, background: r.bg, color: r.fg, fontFamily: ARCH }}
                >
                  {r.letter}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>{r.title}</span>
                  <span className="mt-0.5 block text-[10px]" style={{ color: C.sub, fontFamily: MONO }}>{r.desc}</span>
                </span>
                <span className="ml-auto flex-shrink-0" style={{ color: C.ink }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => pick(null)}
            className="mt-4 w-full text-center text-[11px] font-bold uppercase"
            style={{ color: C.muted, fontFamily: MONO, letterSpacing: "0.02em" }}
          >
            Şimdilik geç, keşfet →
          </button>
        </div>
      </div>
    </div>
  );
}
