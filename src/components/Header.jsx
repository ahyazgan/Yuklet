import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header({ darkMode, toggleDark }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { label: "Ilanlar", to: "/ilanlar" },
    { label: "Nasil calisir", to: "/nasil-calisir" },
    { label: "Hakkimizda", to: "/hakkimizda" },
    { label: "Iletisim", to: "/iletisim" },
  ];

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

          <button onClick={toggleDark} className="theme-toggle" aria-label="Tema">{darkMode ? "☀" : "☾"}</button>

          <button onClick={() => navigate("/ilan-ver")} className="btn-primary" style={{ marginLeft: 6 }}>+ Ilan ver</button>
        </nav>

        {/* Mobile nav */}
        <div className="mobile-nav">
          <button onClick={toggleDark} className="theme-toggle" aria-label="Tema degistir">{darkMode ? "☀" : "☾"}</button>
          <button onClick={() => navigate("/ilan-ver")} className="nav-btn" aria-label="Ilan ver">+ Ilan</button>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="hamburger-btn" aria-label="Menu">{mobileMenu ? "✕" : "☰"}</button>
        </div>
      </div>

      {mobileMenu && (
        <div className="mobile-dropdown">
          {NAV_ITEMS.map(item => (
            <button key={item.label} onClick={() => handleNav(item.to)} className="mobile-menu-item">{item.label}</button>
          ))}
          <button onClick={() => handleNav("/ilan-ver")} className="mobile-menu-item mobile-menu-login">+ Ilan ver</button>
        </div>
      )}
    </header>
  );
}
