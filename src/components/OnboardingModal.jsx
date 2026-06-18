import { useNavigate } from "react-router-dom";

// ── İlk ziyaret onboarding — rol seçimi (bir kez gösterilir).
// Renk anlam taşır: sarı=aksiyon (müteahhit), nötr stone (nakliyeci), yeşil=tedarik.
const ROLES = [
  { letter: "M", title: "Müteahhit / Alıcı", desc: "Yük taşıtmak istiyorum", route: "/muteahhit", ring: "text-ham-ink bg-ham-yellow" },
  { letter: "N", title: "Nakliyeci / Taşıyıcı", desc: "Aracımla iş arıyorum", route: "/nakliyeci", ring: "text-ham-ink bg-ham-stone" },
  { letter: "T", title: "Tedarikçi / Ocak", desc: "Malzeme satıyorum", route: "/tedarikci", ring: "text-white", ringStyle: { background: "#16803C" } },
];

export default function OnboardingModal({ onClose }) {
  const navigate = useNavigate();
  const pick = (route) => { onClose?.(); if (route) navigate(route); };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ham-ink/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[420px] rounded-[26px] bg-ham-card p-7 shadow-2xl">
        <div className="mb-3 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ham-yellow text-2xl font-black text-ham-ink">H</div>
        </div>
        <h2 className="text-center text-xl font-extrabold tracking-tight text-ham-ink">HamTed'e hoş geldin 👋</h2>
        <p className="mb-5 mt-1 text-center text-sm text-ham-sub">Hafriyat ve dökme yükü doğru araçla, komisyonsuz buluşturuyoruz. Sen hangisisin?</p>
        <div className="flex flex-col gap-2.5">
          {ROLES.map((r) => (
            <button key={r.title} onClick={() => pick(r.route)} className="flex items-center gap-3.5 rounded-2xl border border-ham-border p-4 text-left transition hover:-translate-y-0.5 hover:border-ham-yellow">
              <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-base font-extrabold ${r.ring}`} style={r.ringStyle}>{r.letter}</span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ham-ink">{r.title}</span>
                <span className="block text-xs text-ham-sub">{r.desc}</span>
              </span>
              <span className="ml-auto text-xl text-ham-faint">›</span>
            </button>
          ))}
        </div>
        <button onClick={() => pick(null)} className="mt-4 w-full text-center text-xs font-semibold text-ham-muted">Şimdilik geç, keşfet →</button>
      </div>
    </div>
  );
}
