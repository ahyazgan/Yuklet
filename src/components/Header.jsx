import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ── MoveIQ LIGHT header (Tailwind).

const COZUMLER = [
  { icon: "🏗️", label: "Müteahhit & Alıcı", to: "/muteahhit", sub: "İlan ver, teklif al" },
  { icon: "⛏️", label: "Tedarikçi & Ocak", to: "/tedarikci", sub: "Ürün ilanı, geniş müşteri" },
  { icon: "🚚", label: "Nakliyeci & Taşıyıcı", to: "/nakliyeci", sub: "Boş sefer yok, iş bul" },
];

export default function Header({ darkMode, toggleDark, user, onLoginClick, onLogout, pendingOffersCount = 0, unreadCount = 0 }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showCozumler, setShowCozumler] = useState(false);
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { label: "İlanlar", to: "/ilanlar" },
    { label: "Nasıl çalışır", to: "/nasil-calisir" },
    { label: "Hakkımızda", to: "/hakkimizda" },
    { label: "İletişim", to: "/iletisim" },
  ];

  const USER_ITEMS = user ? [
    { label: "Panelim", to: "/panel", badge: 0 },
    { label: "İlanlarım", to: "/ilanlarim", badge: pendingOffersCount },
    { label: "Mesajlar", to: "/mesajlar", badge: unreadCount },
  ] : [];

  const handleNav = (to) => { setMobileMenu(false); navigate(to); };

  const navLink = "rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:text-slate-950";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 text-lg font-black text-slate-950">H</div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-slate-950">HamTed</div>
            <div className="text-[7.5px] font-semibold tracking-[3px] text-gray-400">YÜK & NAKLİYE</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <div className="relative" onMouseEnter={() => setShowCozumler(true)} onMouseLeave={() => setShowCozumler(false)}>
            <button className={navLink}>Çözümler ▾</button>
            {showCozumler && (
              <div className="absolute right-0 top-full w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
                {COZUMLER.map((c) => (
                  <Link key={c.to} to={c.to} onClick={() => setShowCozumler(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition hover:bg-gray-50">
                    <span className="text-xl">{c.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-slate-950">{c.label}</div>
                      <div className="text-[11px] text-gray-400">{c.sub}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {NAV_ITEMS.map((item) => (
            <Link key={item.label} to={item.to} className={navLink}>{item.label}</Link>
          ))}

          {USER_ITEMS.map((item) => (
            <Link key={item.label} to={item.to} className="relative rounded-lg px-3 py-1.5 text-sm font-semibold text-amber-600 transition hover:text-amber-700">
              {item.label}
              {item.badge > 0 && <span className="ml-1 rounded-full bg-yellow-400 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-950">{item.badge}</span>}
            </Link>
          ))}

          <button onClick={toggleDark} aria-label="Tema" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50">{darkMode ? "☀" : "☾"}</button>

          {user ? (
            <>
              <Link to="/profil" title={user.email} className="rounded-lg px-3 py-1.5 text-sm font-bold text-slate-950">👤 {user.name}</Link>
              <button onClick={onLogout} aria-label="Çıkış yap" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-600 transition hover:text-slate-950">Çıkış</button>
            </>
          ) : (
            <button onClick={onLoginClick} aria-label="Giriş yap" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-600 transition hover:text-slate-950">Giriş yap</button>
          )}

          <button onClick={() => navigate("/ilan-ver")} className="ml-1.5 rounded-full bg-yellow-400 px-4 py-2 text-sm font-extrabold text-slate-950 transition hover:bg-yellow-500">+ İlan ver</button>
        </nav>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 md:hidden">
          <button onClick={toggleDark} aria-label="Tema değiştir" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600">{darkMode ? "☀" : "☾"}</button>
          <button onClick={() => navigate("/ilan-ver")} aria-label="İlan ver" className="rounded-full bg-yellow-400 px-3 py-1.5 text-xs font-extrabold text-slate-950">+ İlan</button>
          <button onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menü" className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-xl text-slate-700">
            {mobileMenu ? "✕" : "☰"}
            {!mobileMenu && (pendingOffersCount + unreadCount) > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-yellow-400 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-950">{pendingOffersCount + unreadCount}</span>}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div className="flex flex-col gap-1.5 border-t border-gray-100 bg-white px-4 py-3 md:hidden">
          {[...COZUMLER.map((c) => ({ label: `${c.icon} ${c.label}`, to: c.to })), ...NAV_ITEMS].map((item) => (
            <button key={item.to} onClick={() => handleNav(item.to)} className="rounded-xl bg-slate-50 px-4 py-2.5 text-left text-sm font-medium text-slate-700">{item.label}</button>
          ))}
          {USER_ITEMS.map((item) => (
            <button key={item.label} onClick={() => handleNav(item.to)} className="rounded-xl bg-slate-50 px-4 py-2.5 text-left text-sm font-medium text-slate-700">
              {item.label}{item.badge > 0 ? ` (${item.badge})` : ""}
            </button>
          ))}
          {user && <button onClick={() => handleNav("/profil")} className="rounded-xl bg-slate-50 px-4 py-2.5 text-left text-sm font-medium text-slate-700">Profil</button>}
          {user ? (
            <button onClick={() => { onLogout(); setMobileMenu(false); }} className="rounded-xl bg-slate-50 px-4 py-2.5 text-left text-sm font-medium text-slate-700">Çıkış ({user.name})</button>
          ) : (
            <button onClick={() => { onLoginClick(); setMobileMenu(false); }} className="rounded-xl bg-slate-50 px-4 py-2.5 text-left text-sm font-medium text-slate-700">Giriş yap</button>
          )}
          <button onClick={() => handleNav("/ilan-ver")} className="rounded-xl bg-yellow-400 px-4 py-2.5 text-left text-sm font-extrabold text-slate-950">+ İlan ver</button>
        </div>
      )}
    </header>
  );
}
