import { Link, useLocation } from "react-router-dom";

// Figma "HamTed — Mobil Uygulama" tasarimindaki alt tab bar.
// Sadece mobilde gorunur (CSS: .mobile-tabbar @media max-width:768px).
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
    <nav className="mobile-tabbar" aria-label="Alt gezinme">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        if (tab.center) {
          return (
            <Link key={tab.to} to={tab.to} className="tabbar-item tabbar-item-center" aria-label={tab.label}>
              <span className="tabbar-fab">{tab.icon}</span>
              <span className="tabbar-label tabbar-label-accent">{tab.label}</span>
            </Link>
          );
        }
        const badge = tab.to === "/mesajlar" ? unreadCount : 0;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`tabbar-item ${active ? "tabbar-item-active" : ""}`}
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
          >
            <span className="tabbar-icon">
              {tab.icon}
              {badge > 0 && <span className="tabbar-badge">{badge > 9 ? "9+" : badge}</span>}
            </span>
            <span className="tabbar-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
