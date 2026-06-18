import { Link, useLocation } from "react-router-dom";

// ── SAHA alt tab bar (Tailwind). Mobil app kolonuna hizalı (max-w-[460px]).

const TABS = [
  { to: "/", label: "Ana Sayfa", icon: "🏠", match: (p) => p === "/" },
  { to: "/ilanlar", label: "İlanlar", icon: "📋", match: (p) => p.startsWith("/ilanlar") || p.startsWith("/ilan/") },
  { to: "/ilan-ver", label: "İlan Ver", icon: "+", center: true, match: (p) => p.startsWith("/ilan-ver") },
  { to: "/mesajlar", label: "Mesajlar", icon: "💬", match: (p) => p.startsWith("/mesajlar") },
  { to: "/profil", label: "Profil", icon: "👤", match: (p) => p.startsWith("/profil") || p.startsWith("/ilanlarim") || p.startsWith("/panel") },
];

export default function MobileTabBar({ unreadCount = 0 }) {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Alt gezinme" className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[460px] items-end justify-around border-t border-ham-line bg-ham-card/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        if (tab.center) {
          return (
            <Link key={tab.to} to={tab.to} aria-label={tab.label} className="flex flex-col items-center gap-1">
              <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-ham-yellow text-2xl font-light leading-none text-ham-ink shadow-lg shadow-ham-yellow/40">{tab.icon}</span>
              <span className="text-[10px] font-bold text-ham-ink">{tab.label}</span>
            </Link>
          );
        }
        const badge = tab.to === "/mesajlar" ? unreadCount : 0;
        return (
          <Link key={tab.to} to={tab.to} aria-label={tab.label} aria-current={active ? "page" : undefined} className="flex flex-1 flex-col items-center gap-1 py-1">
            <span className={`relative text-lg ${active ? "" : "opacity-60 grayscale"}`}>
              {tab.icon}
              {badge > 0 && <span className="absolute -right-2.5 -top-1.5 flex min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-extrabold text-white ring-2 ring-ham-card" style={{ background: "#DC2626" }}>{badge > 9 ? "9+" : badge}</span>}
            </span>
            <span className={`text-[10px] font-semibold ${active ? "text-ham-ink" : "text-ham-faint"}`}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
