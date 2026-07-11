import { Link, useLocation } from "react-router-dom";
import { Home, List, Plus, MessageCircle, User, Coffee, Store, Package } from "lucide-react";
import { hapticTap } from "../native/haptics";

// ── SAHA alt tab bar (Tailwind + inline style). Mobil app kolonuna hizalı (max-w-[460px]).
// Beyaz zemin, üstte 2px siyah çizgi. Aktif sekmede üstte 18x3px sarı çizgi.
// Ortada büyük sarı "+" butonu (48px, 2px ink çerçeve, radius 8px). Emoji DEĞİL — lucide stroke ikonlar.

// Sekmeler role göre değişir:
//   Alıcı (isveren):    Ana · Tedarik · +Talep · Sipariş · Mesaj · Profil (6'lı)
//   Satıcı (tedarikci): Ana · Vitrinim(bekleyen sipariş rozeti) · +Ürün Ekle · Mesaj · Profil
//   Nakliyeci:          Ana · İlanlar · Mola · Mesaj · Profil
//   Misafir:            Ana · İlanlar · +İlan Ver · Mesaj · Profil
const HOME_TAB = { to: "/", label: "Ana", Icon: Home, match: (p) => p === "/" };
const LISTINGS_TAB = { to: "/ilanlar", label: "İlanlar", Icon: List, match: (p) => p === "/ilanlar" || p.startsWith("/ilanlar?") || p.startsWith("/ilan/") };
const ADD_TAB = { to: "/ilan-ver", label: "İlan Ver", Icon: Plus, center: true, match: (p) => p.startsWith("/ilan-ver") };
const MESSAGES_TAB = { to: "/mesajlar", label: "Mesaj", Icon: MessageCircle, match: (p) => p.startsWith("/mesajlar") };
// Alıcı: pazar ekranı "Tedarik" dilinde; ortadaki buton talep bırakma;
// verdiği siparişlerin durumu /tekliflerim'de (alıcı dilinde "Siparişlerim").
const TEDARIK_TAB = { ...LISTINGS_TAB, label: "Tedarik", Icon: Store };
const TALEP_TAB = { ...ADD_TAB, label: "Talep" };
// updateBadge: son bakıştan beri durumu değişen (onay/ret) sipariş sayısı.
const SIPARIS_TAB = { to: "/tekliflerim", label: "Sipariş", Icon: Package, updateBadge: true, match: (p) => p.startsWith("/tekliflerim") || p.startsWith("/takip/") };
// Satıcı: pazar yerine kendi vitrini; ilan detayı/düzenleme de vitrin işi sayılır.
// Gelen siparişler de vitrinde onaylandığı için bekleyen sipariş rozeti bu sekmede.
const VITRIN_TAB = { to: "/ilanlarim", label: "Vitrinim", Icon: Package, orderBadge: true, match: (p) => p.startsWith("/ilanlarim") || p.startsWith("/ilan/") || p.startsWith("/ilan-duzenle") };
const URUN_TAB = { ...ADD_TAB, label: "Ürün Ekle" };
// Nakliyecide ortadaki büyük buton: İlan Ver yerine Mola.
const MOLA_CENTER_TAB = { to: "/mola", label: "Mola", Icon: Coffee, center: true, match: (p) => p.startsWith("/mola") };
const PROFILE_TAB = { to: "/profil", label: "Profil", Icon: User, match: (p) => p.startsWith("/profil") || p.startsWith("/ilanlarim") || p.startsWith("/panel") };
// Satıcıda /ilanlarim Vitrinim sekmesini yakar, Profil'i değil.
const SELLER_PROFILE_TAB = { ...PROFILE_TAB, match: (p) => p.startsWith("/profil") || p.startsWith("/panel") };

function tabsForRole(role) {
  if (role === "tedarikci") return [HOME_TAB, VITRIN_TAB, URUN_TAB, MESSAGES_TAB, SELLER_PROFILE_TAB];
  if (role === "nakliyeci") return [HOME_TAB, LISTINGS_TAB, MOLA_CENTER_TAB, MESSAGES_TAB, PROFILE_TAB];
  if (role === "isveren") return [HOME_TAB, TEDARIK_TAB, TALEP_TAB, SIPARIS_TAB, MESSAGES_TAB, PROFILE_TAB];
  return [HOME_TAB, LISTINGS_TAB, ADD_TAB, MESSAGES_TAB, PROFILE_TAB];
}

const LABEL_STYLE = {
  fontFamily: "'Space Mono', monospace",
  fontSize: "7.5px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

export default function MobileTabBar({ unreadCount = 0, pendingOffersCount = 0, orderUpdatesCount = 0, role }) {
  const { pathname } = useLocation();
  const tabs = tabsForRole(role);
  // 6 sekmede (nakliyeci) yatay boşluğu daralt — 460px'te sığsın.
  const sixUp = tabs.length > 5;

  return (
    <nav
      aria-label="Alt gezinme"
      className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[460px] items-end justify-around pb-[max(8px,env(safe-area-inset-bottom))] pt-2.5 ${sixUp ? "px-1" : "px-2"}`}
      style={{ background: "#FFFFFF", borderTop: "2px solid #0A0A0A" }}
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);

        // Ortadaki büyük sarı buton (İlan Ver ya da nakliyecide Mola) — yukarı taşar.
        if (tab.center) {
          const CenterIcon = tab.Icon;
          return (
            <Link key={tab.to} to={tab.to} onClick={hapticTap} aria-label={tab.label} aria-current={active ? "page" : undefined} className="flex flex-1 flex-col items-center">
              <span
                className="flex items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  marginTop: -22,
                  background: "#FACC15",
                  border: "2px solid #0A0A0A",
                  borderRadius: 8,
                }}
              >
                <CenterIcon width={26} height={26} stroke="#0A0A0A" strokeWidth={2.6} />
              </span>
              <span className="mt-1" style={{ ...LABEL_STYLE, color: "#0A0A0A" }}>{tab.label}</span>
            </Link>
          );
        }

        const badge = tab.to === "/mesajlar" ? unreadCount : tab.orderBadge ? pendingOffersCount : tab.updateBadge ? orderUpdatesCount : 0;
        const { Icon } = tab;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            onClick={hapticTap}
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
            className="relative flex flex-1 flex-col items-center gap-1 py-1"
          >
            {/* Aktif sekme: üstte 18x3px sarı çizgi */}
            {active && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 18,
                  height: 3,
                  background: "#FACC15",
                }}
              />
            )}
            <span className="relative flex items-center justify-center">
              <Icon width={20} height={20} stroke={active ? "#0A0A0A" : "#9A968D"} strokeWidth={2} />
              {badge > 0 && (
                <span
                  className="absolute flex min-w-[16px] items-center justify-center rounded-full px-1"
                  style={{
                    top: -6,
                    right: -10,
                    background: "#DC2626",
                    color: "#FFFFFF",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "9px",
                    fontWeight: 700,
                    boxShadow: "0 0 0 2px #FFFFFF",
                  }}
                >
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </span>
            <span style={{ ...LABEL_STYLE, color: active ? "#0A0A0A" : "#9A968D" }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
