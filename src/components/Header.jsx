import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header({ darkMode, toggleDark, user, onLoginClick, onLogout, pendingOffersCount = 0, unreadCount = 0 }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { label: "Ilanlar", to: "/ilanlar" },
    { label: "Nasil calisir", to: "/nasil-calisir" },
    { label: "Hakkimizda", to: "/hakkimizda" },
    { label: "Iletisim", to: "/iletisim" },
  ];

  const USER_ITEMS = user ? [
    { label: "Ilanlarim", to: "/ilanlarim", badge: pendingOffersCount },
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
            <div className="logo-sub">YUK & NAKLIYE</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="desktop-nav">
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
              <Link to="/profil" className="nav-link" style={{ fontWeight: 700, color: "var(--text)" }} title={`${user.email} · ${user.role === "tedarikci" ? "Tedarikci" : "Is veren"}`}>👤 {user.name}</Link>
              <button onClick={onLogout} className="nav-btn" aria-label="Cikis yap">Cikis</button>
            </>
          ) : (
            <button onClick={onLoginClick} className="nav-btn" aria-label="Giris yap">Giris yap</button>
          )}

          <button onClick={() => navigate("/ilan-ver")} className="btn-primary" style={{ marginLeft: 6 }}>+ Ilan ver</button>
        </nav>

        {/* Mobile nav */}
        <div className="mobile-nav">
          <button onClick={toggleDark} className="theme-toggle" aria-label="Tema degistir">{darkMode ? "☀" : "☾"}</button>
          <button onClick={() => navigate("/ilan-ver")} className="nav-btn" aria-label="Ilan ver">+ Ilan</button>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="hamburger-btn" aria-label="Menu" style={{ position: "relative" }}>
            {mobileMenu ? "✕" : "☰"}{!mobileMenu && (pendingOffersCount + unreadCount) > 0 && <span className="cart-badge" style={{ position: "absolute", top: -4, right: -4 }}>{pendingOffersCount + unreadCount}</span>}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div className="mobile-dropdown">
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
            <button onClick={() => { onLogout(); setMobileMenu(false); }} className="mobile-menu-item">Cikis ({user.name})</button>
          ) : (
            <button onClick={() => { onLoginClick(); setMobileMenu(false); }} className="mobile-menu-item">Giris yap</button>
          )}
          <button onClick={() => handleNav("/ilan-ver")} className="mobile-menu-item mobile-menu-login">+ Ilan ver</button>
        </div>
      )}
    </header>
  );
}
