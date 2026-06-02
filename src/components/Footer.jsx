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
            <div className="footer-desc">Türkiye'nin yük & nakliye eşleştirme platformu. Müteahhit, tedarikçi ve nakliyecileri komisyonsuz buluşturur.</div>
          </div>
          <div>
            <div className="footer-title">Platform</div>
            <Link to="/ilanlar" className="footer-link">Tüm İlanlar</Link>
            <Link to="/ilan-ver" className="footer-link">İlan Ver</Link>
            <Link to="/nasil-calisir" className="footer-link">Nasıl Çalışır</Link>
          </div>
          <div>
            <div className="footer-title">Çözümler</div>
            <Link to="/muteahhit" className="footer-link">🏗️ Müteahhit & Alıcı</Link>
            <Link to="/tedarikci" className="footer-link">⛏️ Tedarikçi & Ocak</Link>
            <Link to="/nakliyeci" className="footer-link">🚚 Nakliyeci & Taşıyıcı</Link>
          </div>
          <div>
            <div className="footer-title">Şirket</div>
            <Link to="/hakkimizda" className="footer-link">Hakkımızda</Link>
            <Link to="/iletisim" className="footer-link">İletişim</Link>
          </div>
          <div>
            <div className="footer-title">Yasal</div>
            <Link to="/yasal/gizlilik" className="footer-link">Gizlilik Politikası</Link>
            <Link to="/yasal/kullanim-kosullari" className="footer-link">Kullanım Koşulları</Link>
            <Link to="/yasal/kvkk" className="footer-link">KVKK Aydınlatma</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <div>&copy; 2026 HamTed Teknoloji A.Ş. — Tüm hakları saklıdır.</div>
          <div>ETBİS kayıtlı · KEP: hamted@hs01.kep.tr</div>
        </div>
      </div>
    </footer>
  );
}
