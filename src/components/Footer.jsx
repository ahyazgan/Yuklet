import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <div className="logo-icon logo-icon-sm">H</div>
              <span className="logo-text" style={{ fontSize: 16 }}>HamTed</span>
            </div>
            <div className="footer-desc">Turkiye'nin yuk & nakliye eslestirme platformu. Hafriyat ve silobas islerini dogru aracla, hizli ve guvenli sekilde bulusturur.</div>
          </div>
          <div>
            <div className="footer-title">Platform</div>
            <Link to="/ilanlar" className="footer-link">Tum Ilanlar</Link>
            <Link to="/ilan-ver" className="footer-link">Ilan Ver</Link>
            <Link to="/nasil-calisir" className="footer-link">Nasil Calisir</Link>
          </div>
          <div>
            <div className="footer-title">Kategoriler</div>
            <Link to="/ilanlar" className="footer-link">🚛 Hafriyat</Link>
            <Link to="/ilanlar" className="footer-link">🛢️ Silobas</Link>
          </div>
          <div>
            <div className="footer-title">Sirket</div>
            <Link to="/hakkimizda" className="footer-link">Hakkimizda</Link>
            <Link to="/iletisim" className="footer-link">Iletisim</Link>
          </div>
          <div>
            <div className="footer-title">Yasal</div>
            <Link to="/yasal/gizlilik" className="footer-link">Gizlilik Politikasi</Link>
            <Link to="/yasal/kullanim-kosullari" className="footer-link">Kullanim Kosullari</Link>
            <Link to="/yasal/kvkk" className="footer-link">KVKK Aydinlatma</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <div>&copy; 2026 HamTed Teknoloji A.S. — Tum haklari saklidir.</div>
          <div>ETBIS kayitli · KEP: hamted@hs01.kep.tr</div>
        </div>
      </div>
    </footer>
  );
}
