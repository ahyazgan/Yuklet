import { useNavigate } from "react-router-dom";

// ── İlk ziyaret onboarding — rol seçimi (bir kez gösterilir).
const ROLES = [
  { letter: "M", title: "Müteahhit / Alıcı", desc: "Yük taşıtmak istiyorum", route: "/muteahhit", ring: "text-amber-600 bg-amber-100" },
  { letter: "N", title: "Nakliyeci / Taşıyıcı", desc: "Aracımla iş arıyorum", route: "/nakliyeci", ring: "text-sky-600 bg-sky-100" },
  { letter: "T", title: "Tedarikçi / Ocak", desc: "Malzeme satıyorum", route: "/tedarikci", ring: "text-emerald-600 bg-emerald-100" },
];

export default function OnboardingModal({ onClose }) {
  const navigate = useNavigate();
  const pick = (route) => { onClose?.(); if (route) navigate(route); };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[420px] rounded-[26px] bg-white p-7 shadow-2xl dark:bg-navy-card">
        <div className="mb-3 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-2xl font-black text-slate-950">H</div>
        </div>
        <h2 className="text-center text-xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">HamTed'e hoş geldin 👋</h2>
        <p className="mb-5 mt-1 text-center text-sm text-gray-500 dark:text-slate-400">Hafriyat ve dökme yükü doğru araçla, komisyonsuz buluşturuyoruz. Sen hangisisin?</p>
        <div className="flex flex-col gap-2.5">
          {ROLES.map((r) => (
            <button key={r.title} onClick={() => pick(r.route)} className="flex items-center gap-3.5 rounded-2xl border border-gray-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-yellow-400 dark:border-navy-line">
              <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-base font-extrabold ${r.ring}`}>{r.letter}</span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-950 dark:text-slate-100">{r.title}</span>
                <span className="block text-xs text-gray-500 dark:text-slate-400">{r.desc}</span>
              </span>
              <span className="ml-auto text-xl text-gray-300">›</span>
            </button>
          ))}
        </div>
        <button onClick={() => pick(null)} className="mt-4 w-full text-center text-xs font-semibold text-gray-400 dark:text-slate-500">Şimdilik geç, keşfet →</button>
      </div>
    </div>
  );
}
