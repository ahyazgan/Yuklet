import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, BadgeCheck, Truck, Package, Lock, Building2, HelpCircle, LogOut, ChevronRight, ShieldCheck, Upload, FileText, Star, Heart, Navigation, History, Inbox, Bell, Phone } from "lucide-react";
import { useToast } from "../components/Toast";
import { StarsDisplay } from "../components/Stars";
import SEO from "../components/SEO";
import Logo from "../components/Logo";
import PhoneVerifyModal from "../components/PhoneVerifyModal";
import { DEFAULT_NOTIF_PREFS } from "../utils/storage";
import { visibleReviewsFor } from "../utils/reviewGate";
import { isAdmin } from "../utils/admin";
import { computeReliability, reliabilityTier } from "../utils/reliability";
import { PAYMENTS_ENABLED } from "../config/features";

// ── SAHA profil — keskin endüstriyel "saha" dili.
//    2px ink çerçeve, koyu header + hazard, Archivo uppercase, Space Mono, stroke ikon.
//    Görsel = SAHA; tüm orijinal işlevsellik (props/state/handler/navigate) korunur.

const C = {
  ink: "#0A0A0A", header: "#EAE3D6", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA", border: "#E3DDD0", line: "#F0ECE3",
  sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const ARCHIVO = "'Archivo', system-ui, sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const ROLES = [
  { id: "isveren", label: "Alıcı", desc: "İş ilanı açar, teklif alır" },
  { id: "tedarikci", label: "Satıcı", desc: "Malzeme satar: ocak, beton, kum" },
  { id: "nakliyeci", label: "Nakliyeci / Taşıyıcı", desc: "Araç ilanı açar, yük taşır" },
];

// Role label shown in the dark identity header.
const ROLE_BADGE = {
  isveren: "ALICI",
  tedarikci: "SATICI",
  nakliyeci: "NAKLİYECİ",
};

// Rol bazlı belge tipleri — her rolün işine uygun evraklar.
const DOC_TYPES_BY_ROLE = {
  nakliyeci: ["K Belgesi", "Araç Ruhsatı", "SRC Belgesi", "Sigorta Poliçesi", "Vergi Levhası", "Diğer"],
  tedarikci: ["Ocak/Maden Ruhsatı", "Kapasite Raporu", "TSE/Uygunluk Belgesi", "Vergi Levhası", "Ticaret Sicil Gazetesi", "Diğer"],
  isveren: ["Vergi Levhası", "Ticaret Sicil Gazetesi", "İmza Sirküsü", "Faaliyet Belgesi", "Diğer"],
};
const DOC_TYPES_DEFAULT = ["Vergi Levhası", "Diğer"];
const docTypesForRole = (role) => DOC_TYPES_BY_ROLE[role] || DOC_TYPES_DEFAULT;

// Rol bazlı menü satırları — herkese ortak olanlar + role özel kısayollar.
// to: rota, icon: lucide bileşeni, label/desc: metin.
function menuForRole(role) {
  const common = [
    { icon: Heart, label: "Favorilerim", desc: "Kaydettiğin ilanlar", to: "/ilanlar?fav=1" },
    { icon: HelpCircle, label: "Yardım & destek", desc: "Sık sorulan sorular ve iletişim", to: "/iletisim" },
  ];
  if (role === "nakliyeci") {
    return [
      { icon: Truck, label: "Filom", desc: "Araç + şoför + plaka kayıtların", to: "/filo" },
      { icon: Navigation, label: "Sevkiyat", desc: "Aktif seferlerini canlı izle", to: "/sevkiyat" },
      { icon: History, label: "Sefer Geçmişi", desc: "Tamamlanan taşımalar ve hat performansı", to: "/sefer-gecmisi" },
      { icon: Inbox, label: "Verdiğim Teklifler", desc: "İş ilanlarına gönderdiğin teklifler", to: "/tekliflerim" },
      { icon: Package, label: "Araç İlanlarım", desc: "Açtığın araç/taşıma ilanları", to: "/ilanlarim" },
      ...common,
    ];
  }
  if (role === "tedarikci") {
    return [
      { icon: Package, label: "Ürün İlanlarım", desc: "Malzeme/stok ilanların ve gelen siparişler", to: "/ilanlarim" },
      { icon: Inbox, label: "Siparişlerim", desc: "Gelen malzeme siparişlerini yönet", to: "/tekliflerim" },
      { icon: Navigation, label: "Sevkiyat", desc: "Giden malzemenin teslimatını izle", to: "/sevkiyat" },
      { icon: History, label: "Satış Geçmişi", desc: "Tamamlanan satışlar ve teslimatlar", to: "/sefer-gecmisi" },
      ...common,
    ];
  }
  // isveren (Müteahhit / Alıcı) — varsayılan
  return [
    { icon: Package, label: "İş İlanlarım", desc: "Açtığın iş ilanları ve gelen teklifler", to: "/ilanlarim" },
    { icon: Inbox, label: "Tekliflerim & Siparişlerim", desc: "Gönderdiğin teklif ve siparişleri izle", to: "/tekliflerim" },
    { icon: Navigation, label: "Sevkiyat", desc: "Kabul ettiğin işin teslimatını izle", to: "/sevkiyat" },
    { icon: History, label: "İş Geçmişi", desc: "Tamamlanan işler ve performans", to: "/sefer-gecmisi" },
    ...common,
  ];
}

// Rol bazlı istatistik bandı etiketleri — orta ve sağ kutu role göre değişir.
// (Sol kutu her rolde PUAN olarak kalır.) value alanları render'da doldurulur.
const STAT_LABELS_BY_ROLE = {
  nakliyeci: { mid: "SEFER", right: "BELGE" },
  tedarikci: { mid: "SATIŞ", right: "BELGE" },
  isveren: { mid: "İŞ İLANI", right: "BELGE" },
};

// Belge başına gerçek durum (admin reviewDoc ile "dogrulandi"/"red" olur; yoksa beklemede).
function docStatusInfo(d) {
  if (d?.status === "dogrulandi") return { label: "✓ Doğrulandı", color: "#16803C" };
  if (d?.status === "red") return { label: "✕ Reddedildi", color: "#DC2626" };
  return { label: "⏳ İnceleniyor", color: "#92600A" };
}

function fmtRev(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return ""; }
}

// Initials from a name (max 2 chars).
function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const shell = {
  width: "100%", maxWidth: 460, margin: "0 auto", minHeight: "100vh",
  display: "flex", flexDirection: "column", background: C.bg, fontFamily: "inherit",
};

// ── Reusable SAHA primitives ──
const cardSt = { background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 16, boxShadow: "6px 6px 0 rgba(10,10,10,.12)" };
const sectionTitle = { fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em", textTransform: "uppercase", margin: "0 0 12px" };
const labelSt = { display: "block", marginBottom: 6, fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.sub, letterSpacing: 0.4, textTransform: "uppercase" };
const inputSt = { width: "100%", boxSizing: "border-box", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px 13px", fontSize: 14, color: C.ink, outline: "none", fontFamily: MONO };

export default function ProfilPage({ user, onUpdateProfile, onVerifyPhone, onRequireAuth, onLogout, onDeleteAccount, reviews = [], getUserRating, listings = [], offers = [], docs = [], onAddDoc, onRemoveDoc, notifPrefs = DEFAULT_NOTIF_PREFS, onUpdateNotifPrefs }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [docType, setDocType] = useState("K Belgesi");
  const [confirmDelete, setConfirmDelete] = useState(false); // hesap silme iki adımlı onay
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);

  // Hesabı kalıcı sil (App Store/Play zorunlu): verileri temizle, çıkış yap, ana sayfaya dön.
  const handleDeleteAccount = async () => {
    const res = await onDeleteAccount?.();
    if (res && res.ok === false) {
      // Silme başarısız: oturumu/UI'yi bozmadan kullanıcıya net hata göster.
      toast?.(res.error || "Hesap silinemedi, lütfen tekrar dene.", "error");
      return;
    }
    toast?.("Hesabın ve verilerin silindi.", "info");
    navigate("/");
  };

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    role: user?.role || "isveren",
  });

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_500_000) { toast("Dosya çok büyük (~2.5MB sınırı)", "error"); return; }
    const docTypeToSave = docTypesForRole(user?.role).includes(docType) ? docType : docTypesForRole(user?.role)[0];
    const reader = new FileReader();
    reader.onload = () => {
      onAddDoc?.({ id: Date.now(), ownerId: user.id, type: docTypeToSave, name: f.name, dataUrl: reader.result, createdAt: new Date().toISOString() });
      toast("Belge yüklendi — inceleniyor", "success");
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  // ── Logged-out state (preserves onRequireAuth behavior) ──
  if (!user) {
    return (
      <div style={shell}>
        <SEO title="Profil" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <Logo size="lg" />
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Profil için giriş yapın</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: 0, maxWidth: 280 }}>Hesabını görüntülemek, belge yüklemek ve değerlendirmelerini görmek için giriş yap.</p>
          <button onClick={() => onRequireAuth?.()}
            style={{ marginTop: 4, background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 22px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
            Giriş yap / Kayıt ol
          </button>
        </div>
      </div>
    );
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim()) { toast("Ad / firma zorunludur", "error"); return; }
    onUpdateProfile?.({ name: form.name.trim(), phone: form.phone.trim(), role: form.role });
    toast("Profil güncellendi", "success");
  };

  const rating = getUserRating?.(user.id);
  // Çift-kör: sen karşı tarafı puanlamadan (ya da süre dolmadan) yorum gizli kalır.
  const myReviews = visibleReviewsFor(user.id, reviews).slice(0, 8);
  const rel = computeReliability(user.id, { listings, offers, reviews });
  const relTier = reliabilityTier(rel.score);
  const avgRating = rating ? rating.avg : (user.rating ?? 5.0);
  const roleBadge = ROLE_BADGE[user.role] || "ÜYE";

  // ── Rol bazlı türetimler ──
  const role = user.role;
  const myDocTypes = docTypesForRole(role);
  // Seçili belge tipi role uymuyorsa (rol değişmiş olabilir) ilk geçerliye düş.
  const activeDocType = myDocTypes.includes(docType) ? docType : myDocTypes[0];
  // İstatistik orta kutusu: nakliyeci→sefer, tedarikçi→satış, müteahhit→iş ilanı sayısı.
  const myListings = listings.filter((l) => String(l.ownerId) === String(user.id));
  const midStatValue =
    role === "nakliyeci" ? String(rel.totalTrips ?? 0)
    : role === "tedarikci" ? String(myListings.filter((l) => l.delivered).length)
    : String(myListings.length);
  const statLabels = STAT_LABELS_BY_ROLE[role] || STAT_LABELS_BY_ROLE.isveren;
  const myMenu = menuForRole(role);

  return (
    <div style={shell}>
      <SEO title="Profil" description="Hesap bilgilerinizi görüntüleyin ve güncelleyin." />

      {/* ── Üst kimlik bloğu (koyu header + hazard) ── */}
      <div style={{ background: C.ink, padding: "16px 20px 22px", color: "#fff", position: "relative", overflow: "hidden" }}>
        {/* sağ dikey hazard şeridi */}
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 14, backgroundImage: HAZARD }} />

        {/* Settings (admin paneli mevcut işlev) */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: 18 }}>
          <button onClick={() => navigate(isAdmin(user) ? "/admin" : "/panel")}
            aria-label={isAdmin(user) ? "Yönetim paneli" : "Panelim"}
            style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.25)", borderRadius: 6, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Settings size={18} color="#fff" strokeWidth={2} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6, paddingRight: 18 }}>
          {/* Avatar — yellow square, 2px border, initials */}
          <div style={{ width: 60, height: 60, borderRadius: 6, background: C.yellow, border: `2px solid ${C.ink}`, boxShadow: "0 0 0 2px #fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: ARCHIVO, fontSize: 22, fontWeight: 900, color: C.ink }}>{initials(user.name)}</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: ARCHIVO, fontSize: 19, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span>
              {user.verified && <BadgeCheck size={18} color={C.yellow} strokeWidth={2.2} style={{ flexShrink: 0 }} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.yellow, border: `2px solid ${C.yellow}`, padding: "2px 7px", borderRadius: 5, letterSpacing: 0.5 }}>{roleBadge}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.yellow, display: "flex", alignItems: "center", gap: 3 }}>
                <Star size={11} fill={C.yellow} color={C.yellow} /> {Number(avgRating).toFixed(1)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          </div>
        </div>

        {/* İstatistik bandı (gerçek veri) */}
        <div style={{ display: "flex", marginTop: 18, marginRight: 18, border: "2px solid rgba(255,255,255,0.18)", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ flex: 1, textAlign: "center", padding: "11px 4px" }}>
            <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.yellow }}>{Number(avgRating).toFixed(1)}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 2, letterSpacing: 0.6 }}>PUAN</div>
          </div>
          <div style={{ width: 2, background: "rgba(255,255,255,0.14)" }} />
          <div style={{ flex: 1, textAlign: "center", padding: "11px 4px" }}>
            <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: "#fff" }}>{midStatValue}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 2, letterSpacing: 0.6 }}>{statLabels.mid}</div>
          </div>
          <div style={{ width: 2, background: "rgba(255,255,255,0.14)" }} />
          <div style={{ flex: 1, textAlign: "center", padding: "11px 4px" }}>
            <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: "#fff" }}>{docs.length}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 2, letterSpacing: 0.6 }}>{statLabels.right}</div>
          </div>
        </div>
      </div>
      {/* alt hazard sınır şeridi */}
      <div style={{ height: 8, backgroundImage: HAZARD }} />

      {/* ── Gövde ── */}
      <div style={{ flex: 1, padding: "18px 16px 110px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Hesap bilgileri / düzenleme */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={cardSt}>
          <h2 style={sectionTitle}>Hesap bilgileri</h2>

          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}>Ad / Firma</label>
            <input style={inputSt} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Yıldızlar İnşaat" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}>E-posta</label>
            <input style={{ ...inputSt, background: C.stone, opacity: 0.6, cursor: "not-allowed" }} value={user.email} disabled />
          </div>

          {/* Telefon + doğrulama */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ ...labelSt, margin: 0 }}>Telefon</label>
              {user.phoneVerified ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.green, border: `2px solid ${C.green}`, background: "#E6F4EA", borderRadius: 5, padding: "2px 7px", textTransform: "uppercase" }}>
                  <BadgeCheck size={12} strokeWidth={2.6} /> Doğrulandı
                </span>
              ) : (
                <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.muted, border: `2px solid ${C.border}`, background: C.stone, borderRadius: 5, padding: "2px 7px", textTransform: "uppercase" }}>
                  Doğrulanmadı
                </span>
              )}
            </div>
            <input style={inputSt} value={form.phone}
              onChange={(e) => set("phone", e.target.value)} placeholder="05XX XXX XX XX" />
            {!user.phoneVerified && (
              <button type="button" onClick={() => setShowPhoneVerify(true)}
                style={{ marginTop: 8, width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px", fontFamily: ARCHIVO, fontSize: 12.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
                <Phone size={15} strokeWidth={2.4} /> Numaramı doğrula
              </button>
            )}
            <div style={{ marginTop: 7, fontFamily: MONO, fontSize: 10, color: C.faint, lineHeight: 1.5 }}>
              {user.phoneVerified
                ? "Numaran doğrulandı. Yalnızca eşleşen tarafla iletişim için paylaşılır."
                : "Teklif vermek ve ilan açmak için cep numaranı doğrulaman gerekir. Numaran yalnızca eşleşen tarafla paylaşılır."}
            </div>
          </div>

          {/* Rol seçimi — yalnızca rolü henüz atanmamış kullanıcıya gösterilir.
              Rol kayıt sırasında seçilir; rolü olan kullanıcı profilde değiştiremez. */}
          {!ROLES.some((r) => r.id === user.role) && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelSt}>Rol</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ROLES.map((r) => {
                  const active = form.role === r.id;
                  return (
                    <button type="button" key={r.id} onClick={() => set("role", r.id)}
                      style={{ textAlign: "left", border: `2px solid ${C.ink}`, background: active ? C.yellow : C.card, borderRadius: 6, padding: "11px 13px", cursor: "pointer", boxShadow: active ? "3px 3px 0 #0A0A0A" : "none" }}>
                      <div style={{ fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em" }}>{r.label}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: active ? C.ink : C.sub, marginTop: 3 }}>{r.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button type="button" onClick={save}
            style={{ width: "100%", background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "14px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
            Değişiklikleri kaydet
          </button>
        </motion.section>

        {/* Bildirim tercihleri — hangi bildirimleri alacağını seç */}
        <section style={cardSt}>
          <h2 style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 7 }}>
            <Bell size={16} strokeWidth={2.4} color={C.ink} /> Bildirim tercihleri
          </h2>
          {[
            { key: "offers", label: "Gelen teklifler", desc: "İlanlarına teklif geldiğinde" },
            { key: "accepts", label: "Teklif sonucu", desc: "Teklifin kabul veya ret edildiğinde" },
            { key: "messages", label: "Mesajlar", desc: "Yeni mesaj geldiğinde" },
            { key: "reviews", label: "Değerlendirme hatırlatması", desc: "Tamamlanan işi puanlamak için" },
            { key: "savedSearch", label: "Kayıtlı arama eşleşmesi", desc: "Aramana uygun yeni ilan çıkınca" },
          ].map((row, i) => {
            const on = notifPrefs[row.key] !== false;
            return (
              <div key={row.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.ink }}>{row.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, marginTop: 2 }}>{row.desc}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={row.label}
                  onClick={() => onUpdateNotifPrefs?.({ [row.key]: !on })}
                  style={{ flexShrink: 0, width: 46, height: 26, borderRadius: 6, border: `2px solid ${C.ink}`, background: on ? C.green : C.stone, position: "relative", cursor: "pointer", padding: 0, transition: "background 0.15s" }}
                >
                  <span style={{ position: "absolute", top: 1, left: on ? 21 : 1, width: 20, height: 20, borderRadius: 4, background: "#fff", border: `2px solid ${C.ink}`, transition: "left 0.15s" }} />
                </button>
              </div>
            );
          })}
          <p style={{ fontFamily: MONO, fontSize: 10, color: C.faint, margin: "10px 0 0", lineHeight: 1.5 }}>
            Kapattığın türler bildirim merkezinde ve cihaz bildirimlerinde görünmez.
          </p>
        </section>

        {/* Güvenilirlik skoru — sefer/teslim/puan verisinden */}
        <section style={cardSt}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ ...sectionTitle, margin: 0, display: "flex", alignItems: "center", gap: 7 }}>
              <ShieldCheck size={16} strokeWidth={2.4} color={relTier.color} /> Güvenilirlik
            </h2>
            {rel.score != null && (
              <span style={{ fontFamily: ARCHIVO, fontSize: 26, fontWeight: 900, color: relTier.color, letterSpacing: "-0.02em" }}>%{rel.score}</span>
            )}
          </div>
          {rel.score == null ? (
            <p style={{ fontFamily: MONO, fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.55 }}>
              Henüz yeterli veri yok. İş tamamladıkça ve değerlendirme aldıkça güvenilirlik skorun oluşur.
            </p>
          ) : (
            <>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12, fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "#fff", background: relTier.color, borderRadius: 5, padding: "3px 9px", textTransform: "uppercase" }}>
                {relTier.label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  ["Tamamlanan iş", String(rel.jobsDone)],
                  ["Toplam sefer", String(rel.totalTrips)],
                  ["Teslim onayı", rel.approvalRate != null ? `%${Math.round(rel.approvalRate * 100)}` : "—"],
                  ["Ortalama puan", rel.avgRating != null ? `${rel.avgRating.toFixed(1)} ★ (${rel.ratingCount})` : "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ border: `2px solid ${C.border}`, borderRadius: 6, padding: "9px 11px" }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k}</div>
                    <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: C.ink, marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>
              {rel.disputes > 0 && (
                <p style={{ fontFamily: MONO, fontSize: 10, color: C.red, margin: "10px 0 0" }}>{rel.disputes} anlaşmazlık skoru etkiliyor.</p>
              )}
            </>
          )}
        </section>

        {/* Doğrulama durumu — adım adım rozet yolu */}
        <section style={cardSt}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h2 style={{ ...sectionTitle, margin: 0, display: "flex", alignItems: "center", gap: 7 }}>
              <ShieldCheck size={16} strokeWidth={2.4} color={user.verified ? C.green : C.ink} /> Doğrulama
            </h2>
            <span style={{
              fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, border: "2px solid",
              borderColor: user.verified ? C.green : C.border,
              background: user.verified ? "#E6F4EA" : C.stone,
              color: user.verified ? C.green : C.muted,
            }}>
              {user.verified ? "✓ Onaylı üye" : "Onaylanmadı"}
            </span>
          </div>
          <p style={{ fontFamily: MONO, fontSize: 11, color: C.sub, margin: "0 0 12px", lineHeight: 1.5 }}>
            Adımları tamamla → <b>onaylı rozeti</b> kazan. Onaylı üyeler daha çok güven ve teklif alır.
          </p>
          {[
            { label: `Belge yükle (${myDocTypes.slice(0, 3).join(", ")})`, done: docs.length > 0 },
            { label: "Ekip incelemesi → onaylı rozet", done: Boolean(user.verified) },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <span style={{
                flexShrink: 0, width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: s.done ? C.green : "transparent", border: `2px solid ${s.done ? C.green : C.border}`,
                color: "#fff", fontFamily: MONO, fontSize: 11, fontWeight: 700,
              }}>{s.done ? "✓" : i + 1}</span>
              <span style={{ flex: 1, fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: s.done ? C.ink : C.sub }}>{s.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: s.done ? C.green : C.muted, whiteSpace: "nowrap" }}>{s.done ? "TAMAM" : "BEKLİYOR"}</span>
            </div>
          ))}
        </section>

        {/* Belgelerim — belge yükleme */}
        <section style={cardSt}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h2 style={{ ...sectionTitle, margin: 0 }}>Belgelerim</h2>
            <span style={{
              fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, border: "2px solid",
              borderColor: user.verified ? C.green : docs.length ? C.yellow : C.border,
              background: user.verified ? "#E6F4EA" : docs.length ? "#FEF9E7" : C.stone,
              color: user.verified ? C.green : docs.length ? "#92600A" : C.muted,
            }}>
              {user.verified ? "✓ Doğrulandı" : docs.length ? "⏳ İnceleniyor" : "Eksik"}
            </span>
          </div>
          <p style={{ fontFamily: MONO, fontSize: 11, color: C.sub, margin: "0 0 12px", lineHeight: 1.5 }}>
            {role === "nakliyeci"
              ? <>K belgesi, araç ruhsatı, SRC yükle → ekibimiz inceleyip <b>doğrulanmış rozeti</b> verir.</>
              : role === "tedarikci"
              ? <>Ocak ruhsatı, kapasite raporu, vergi levhası yükle → ekibimiz inceleyip <b>doğrulanmış rozeti</b> verir.</>
              : <>Vergi levhası, ticaret sicil gazetesi, imza sirküsü yükle → ekibimiz inceleyip <b>doğrulanmış rozeti</b> verir.</>}
          </p>

          {/* belge tipi seçimi */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelSt}>Belge tipi</label>
            <select value={activeDocType} onChange={(e) => setDocType(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px 12px", fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.ink, outline: "none" }}>
              {myDocTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* DASHED yükleme alanı */}
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", border: `2px dashed ${C.ink}`, borderRadius: 6, padding: "22px 16px", background: C.stone, textAlign: "center" }}>
            <span style={{ width: 44, height: 44, borderRadius: 6, background: C.yellow, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Upload size={20} color={C.ink} strokeWidth={2.2} />
            </span>
            <span style={{ fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Belge yükle</span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.sub }}>JPG, PNG veya PDF · max 2.5 MB</span>
            <input type="file" accept="image/*,application/pdf" onChange={onFile} style={{ display: "none" }} />
          </label>

          {docs.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {docs.map((d) => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 10 }}>
                  {String(d.dataUrl).startsWith("data:image")
                    ? <img src={d.dataUrl} alt="" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 5, border: `2px solid ${C.ink}`, objectFit: "cover" }} />
                    : <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 5, background: C.stone, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={18} color={C.ink} strokeWidth={2} /></span>}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: ARCHIVO, fontSize: 12, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em" }}>{d.type}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: docStatusInfo(d).color, whiteSpace: "nowrap" }}>
                    {docStatusInfo(d).label}
                  </span>
                  <button onClick={() => onRemoveDoc?.(d.id)}
                    style={{ background: "none", border: "none", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.red, cursor: "pointer", textTransform: "uppercase" }}>Sil</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Aldığın değerlendirmeler */}
        {(rating || myReviews.length > 0) && (
          <section style={cardSt}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ ...sectionTitle, margin: 0 }}>Aldığın değerlendirmeler</h2>
              {rating && <StarsDisplay value={rating.avg} count={rating.count} className="text-sm" />}
            </div>
            {myReviews.length === 0 ? (
              <p style={{ fontFamily: MONO, fontSize: 11, color: C.faint, margin: 0, lineHeight: 1.5 }}>Henüz değerlendirme yok. İş tamamladıkça puanların burada birikir.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myReviews.map((r) => (
                  <div key={r.id} style={{ border: `2px solid ${C.ink}`, borderRadius: 6, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em" }}>{r.fromName}</span>
                      <StarsDisplay value={r.rating} className="text-xs" />
                    </div>
                    {r.comment && <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>{r.comment}</p>}
                    <p style={{ fontFamily: MONO, fontSize: 10, color: C.faint, margin: "4px 0 0" }}>{fmtRev(r.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Menü satırları */}
        <section style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden", boxShadow: "6px 6px 0 rgba(10,10,10,.12)" }}>
          {[
            ...myMenu,
            ...(PAYMENTS_ENABLED ? [
              { icon: Truck, label: "Cüzdan", desc: "Kazanç, hakediş ve harcama", to: "/cuzdan" },
              { icon: Building2, label: "Ödeme & hesap", desc: "Banka / IBAN bilgileri", to: "/cuzdan" },
            ] : []),
            ...(isAdmin(user) ? [{ icon: ShieldCheck, label: "Yönetim Paneli", desc: "Şikayet, belge ve moderasyon", to: "/admin" }] : []),
            { icon: HelpCircle, label: "Yardım & destek", desc: "Sık sorulan sorular ve iletişim", to: "/iletisim" },
          ].map((m, i, arr) => {
            const Icon = m.icon;
            return (
              <button key={m.label} onClick={() => navigate(m.to)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 14px", background: "none", border: "none", borderBottom: i < arr.length - 1 ? `1.5px solid ${C.ink}` : "none", textAlign: "left", cursor: "pointer" }}>
                <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 6, background: C.stone, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color={C.ink} strokeWidth={2} />
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em" }}>{m.label}</span>
                  <span style={{ display: "block", fontFamily: MONO, fontSize: 10, color: C.sub, marginTop: 2 }}>{m.desc}</span>
                </span>
                <ChevronRight size={18} color={C.ink} strokeWidth={2.2} />
              </button>
            );
          })}
        </section>

        {/* Çıkış (mobil app — çıkış burada kalır) */}
        <button type="button" onClick={() => onLogout?.()}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.card, border: `2px solid ${C.ink}`, color: C.red, borderRadius: 6, padding: "14px", fontFamily: MONO, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, cursor: "pointer", boxShadow: "3px 3px 0 rgba(10,10,10,.12)" }}>
          <LogOut size={18} strokeWidth={2.2} /> Çıkış yap
        </button>

        {/* Hesap silme (App Store 5.1.1(v) & Google Play zorunlu) — iki adımlı onay */}
        {!confirmDelete ? (
          <button type="button" onClick={() => setConfirmDelete(true)}
            style={{ width: "100%", marginTop: 12, background: "transparent", border: "none", color: C.muted, fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, cursor: "pointer", padding: "8px" }}>
            Hesabımı kalıcı olarak sil
          </button>
        ) : (
          <div style={{ marginTop: 12, padding: 14, background: C.card, border: `2px solid ${C.red}`, borderRadius: 6 }}>
            <p style={{ margin: "0 0 12px", fontFamily: MONO, fontSize: 12, color: C.ink, lineHeight: 1.5 }}>
              Hesabın, ilanların, tekliflerin, mesajların ve belgelerin <strong>kalıcı olarak</strong> silinecek. Bu işlem geri alınamaz.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, background: C.card, border: `2px solid ${C.ink}`, color: C.ink, borderRadius: 6, padding: "12px", fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>
                Vazgeç
              </button>
              <button type="button" onClick={handleDeleteAccount}
                style={{ flex: 1, background: C.red, border: `2px solid ${C.red}`, color: "#fff", borderRadius: 6, padding: "12px", fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>
                Evet, sil
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── TELEFON DOĞRULAMA MODALI ──────────────────────────────── */}
      {showPhoneVerify && (
        <PhoneVerifyModal
          initialPhone={form.phone || user.phone || ""}
          onVerified={(phone) => { onVerifyPhone?.(phone); setForm((f) => ({ ...f, phone })); toast("Numaran doğrulandı", "success"); }}
          onClose={() => setShowPhoneVerify(false)}
        />
      )}
    </div>
  );
}
