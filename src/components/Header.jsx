import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="logo-link">
          <div className="logo-icon">H</div>
          <div>
            <div className="logo-text">HamTed</div>
            <div className="logo-sub">YÜK & NAKLİYE</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="desktop-nav">
          {/* Çözümler mega dropdown */}
          <div className="mega-menu-wrap" onMouseEnter={() => setShowCozumler(true)} onMouseLeave={() => setShowCozumler(false)}>
            <button className="nav-link" style={{ cursor: "pointer" }}>Çözümler ▾</button>
            {showCozumler && (
              <div className="mega-menu" style={{ minWidth: 260 }}>
                {COZUMLER.map(c => (
                  <Link key={c.to} to={c.to} className="mega-menu-item" onClick={() => setShowCozumler(false)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
                    <span style={{ fontSize: 20 }}>{c.icon}</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{c.label}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-ter)" }}>{c.sub}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {NAV_ITEMS.map(item => (
            <Link key={item.label} to={item.to} className="nav-link">{item.label}</Link>
          ))}

          {USER_ITEMS.map(item => (
            <Link key={item.label} to={item.to} className="nav-link" style={{ color: "var(--accent)", position: "relative" }}>
              {item.label}{item.badge > 0 && <span className="cart-badge">{item.badge}</span>}
            </Link>
          ))}

          <button onClick={toggleDark} className="theme-toggle" aria-label="Tema">{darkMode ? "☀" : "☾"}</button>

          {user ? (
            <>
              <Link to="/profil" className="nav-link" style={{ fontWeight: 700, color: "var(--text)" }} title={`${user.email}`}>👤 {user.name}</Link>
              <button onClick={onLogout} className="nav-btn" aria-label="Çıkış yap">Çıkış</button>
            </>
          ) : (
            <button onClick={onLoginClick} className="nav-btn" aria-label="Giriş yap">Giriş yap</button>
          )}

          <button onClick={() => navigate("/ilan-ver")} className="btn-primary" style={{ marginLeft: 6 }}>+ İlan ver</button>
        </nav>

        {/* Mobile nav */}
        <div className="mobile-nav">
          <button onClick={toggleDark} className="theme-toggle" aria-label="Tema değiştir">{darkMode ? "☀" : "☾"}</button>
          <button onClick={() => navigate("/ilan-ver")} className="nav-btn" aria-label="İlan ver">+ İlan</button>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="hamburger-btn" aria-label="Menü" style={{ position: "relative" }}>
            {mobileMenu ? "✕" : "☰"}{!mobileMenu && (pendingOffersCount + unreadCount) > 0 && <span className="cart-badge" style={{ position: "absolute", top: -4, right: -4 }}>{pendingOffersCount + unreadCount}</span>}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div className="mobile-dropdown">
          {COZUMLER.map(c => (
            <button key={c.to} onClick={() => handleNav(c.to)} className="mobile-menu-item">{c.icon} {c.label}</button>
          ))}
          {NAV_ITEMS.map(item => (
            <button key={item.label} onClick={() => handleNav(item.to)} className="mobile-menu-item">{item.label}</button>
          ))}
          {USER_ITEMS.map(item => (
            <button key={item.label} onClick={() => handleNav(item.to)} className="mobile-menu-item">
              {item.label}{item.badge > 0 ? ` (${item.badge})` : ""}
            </button>
          ))}
          {user && <button onClick={() => handleNav("/profil")} className="mobile-menu-item">Profil</button>}
          {user ? (
            <button onClick={() => { onLogout(); setMobileMenu(false); }} className="mobile-menu-item">Çıkış ({user.name})</button>
          ) : (
            <button onClick={() => { onLoginClick(); setMobileMenu(false); }} className="mobile-menu-item">Giriş yap</button>
          )}
          <button onClick={() => handleNav("/ilan-ver")} className="mobile-menu-item mobile-menu-login">+ İlan ver</button>
        </div>
      )}
    </header>
  );
}
