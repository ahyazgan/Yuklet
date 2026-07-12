import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, BadgeCheck, Truck, Package, Lock, Building2, HelpCircle, LogOut, ChevronRight, ShieldCheck, Upload, FileText, Star, Heart, Navigation, History, Inbox, Bell, Flag, Ban } from "lucide-react";
import { useToast } from "../components/Toast";
import { StarsDisplay } from "../components/Stars";
import SEO from "../components/SEO";
import Logo from "../components/Logo";
import ReportModal from "../components/ReportModal";
import { DEFAULT_NOTIF_PREFS } from "../utils/storage";
import { IL_LIST, HAFRIYAT_MATERIALS, SILOBAS_MATERIALS } from "../data/categories";
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

// Satıcı (tedarikçi) tesis türleri — ocak/santral profili için.
const TESIS_TURLERI = [
  "Kırma ocağı (taş/mıcır)",
  "Kum ocağı",
  "Beton santrali (hazır beton)",
  "Çimento fabrikası / bayi",
  "Agrega tesisi",
  "Maden ocağı",
  "Diğer tesis",
];
// Satıcının satabileceği malzemeler — iki kategori birleşimi (çoklu seçim).
const SATICI_MALZEMELERI = [...HAFRIYAT_MATERIALS, ...SILOBAS_MATERIALS];

// Alıcı (işveren) firma türleri — iş ilanı açan taraf.
const FIRMA_TURLERI = [
  "İnşaat şirketi",
  "Müteahhit / yüklenici",
  "Belediye / kamu kurumu",
  "Fabrika / sanayi tesisi",
  "Altyapı / yol firması",
  "Emlak / gayrimenkul geliştirici",
  "Bireysel",
  "Diğer",
];
// Alıcının faaliyet alanları — çoklu seçim.
const FAALIYET_ALANLARI = [
  "Konut inşaatı",
  "Ticari / ofis inşaatı",
  "Altyapı / yol",
  "Hafriyat işleri",
  "Sanayi tesisi",
  "Köprü / viyadük",
  "Peyzaj / çevre düzenleme",
  "Yıkım / kentsel dönüşüm",
  "Maden / enerji",
];

// Nakliyeci taşıma türleri — ne taşıdığı.
const TASIMA_TURLERI = [
  "Hafriyat (damperli)",
  "Silobas / dökme",
  "Hafriyat + Silobas (ikisi)",
  "Treyler / lowbed (ağır yük)",
  "Tanker (sıvı)",
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
    { icon: ShieldCheck, label: "Gizlilik & Yasal", desc: "Gizlilik, kullanım koşulları, KVKK, hesap silme", to: "/yasal/gizlilik" },
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
// "Herkese açık profilini önizle" butonu — düzenleme formunu public vitrine bağlar
// (satıcı → mağaza vitrini, alıcı → firma künyesi, nakliyeci → nakliyeci profili).
const previewBtnSt = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
  background: C.stone, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 12px",
  fontFamily: ARCHIVO, fontSize: 12, fontWeight: 800, textTransform: "uppercase",
  letterSpacing: "-0.01em", color: C.ink, cursor: "pointer", marginBottom: 16,
};

export default function ProfilPage({ user, onUpdateProfile, onRequireAuth, onLogout, reviews = [], getUserRating, listings = [], offers = [], docs = [], onAddDoc, onRemoveDoc, notifPrefs = DEFAULT_NOTIF_PREFS, onUpdateNotifPrefs, onReport, blockedIds = [], onToggleBlock, getContact }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [docType, setDocType] = useState("K Belgesi");
  const [reportTarget, setReportTarget] = useState(null); // şikayet edilecek yorum nesnesi
  const [showBlocked, setShowBlocked] = useState(false); // engellenen kullanıcılar listesi

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    role: user?.role || "isveren",
    // Satıcı (tedarikçi) profil alanları — yalnızca tedarikçi rolünde kullanılır.
    tesisTuru: user?.tesisTuru || "",
    sehir: user?.sehir || "",
    ilce: user?.ilce || "",
    hakkinda: user?.hakkinda || "",
    malzemeler: Array.isArray(user?.malzemeler) ? user.malzemeler : [],
    calismaSaatleri: user?.calismaSaatleri || "",
    // Alıcı (işveren) profil alanları — yalnızca isveren rolünde kullanılır.
    firmaTuru: user?.firmaTuru || "",
    web: user?.web || "",
    vergiNo: user?.vergiNo || "",
    faaliyetAlani: Array.isArray(user?.faaliyetAlani) ? user.faaliyetAlani : [],
    // Nakliyeci profil alanları — yalnızca nakliyeci rolünde kullanılır.
    tasimaTuru: user?.tasimaTuru || "",
    filoOzeti: user?.filoOzeti || "",
    hizmetBolgeleri: Array.isArray(user?.hizmetBolgeleri) ? user.hizmetBolgeleri : [],
  });

  // Firma logosu / amblemi — ilanlarda ve profilde görünür.
  // Boyut sınırı YOK: görsel istemcide otomatik küçültülür (max 512px).
  // Telefon fotoğrafları (3-8MB) elle küçültme gerektirmeden yüklenebilir.
  // Önce PNG denenir (şeffaf logolar bozulmasın); hâlâ büyükse beyaz zemin + JPEG.
  // Supabase modunda sonuç Storage'a gider (uploadLogo), localStorage modunda
  // data-url küçük kaldığı için ilan snapshot'ları da güvenli kalır.
  const LOGO_MAX_PX = 512;
  const LOGO_TARGET_CHARS = 400_000; // data-url uzunluğu hedefi (~300KB binary)
  const downscaleLogo = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const scale = Math.min(1, LOGO_MAX_PX / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          let out = canvas.toDataURL("image/png");
          if (out.length > LOGO_TARGET_CHARS) {
            // PNG hâlâ büyük (fotoğraf vb.) → şeffaflığı beyaza bas, JPEG'e geç.
            const flat = document.createElement("canvas");
            flat.width = w; flat.height = h;
            const fctx = flat.getContext("2d");
            fctx.fillStyle = "#fff";
            fctx.fillRect(0, 0, w, h);
            fctx.drawImage(canvas, 0, 0);
            out = flat.toDataURL("image/jpeg", 0.85);
          }
          resolve(out);
        } catch (err) { reject(err); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Görsel çözülemedi")); };
      img.src = url;
    });

  const onLogoFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast("Lütfen bir resim dosyası seç (PNG/JPG)", "error"); return; }
    if (f.size > 15_000_000) { toast("Dosya çok büyük (max ~15MB). Daha küçük bir görsel dene.", "error"); return; }
    let dataUrl;
    try { dataUrl = await downscaleLogo(f); }
    catch { toast("Görsel okunamadı. Farklı bir dosya dene.", "error"); return; }
    const res = await onUpdateProfile?.({ logo: dataUrl });
    if (res && res.ok === false) { toast(res.error || "Logo yüklenemedi", "error"); return; }
    toast("Logo güncellendi", "success");
  };
  const removeLogo = async () => {
    const res = await onUpdateProfile?.({ logo: "" });
    if (res && res.ok === false) { toast(res.error || "Logo kaldırılamadı", "error"); return; }
    toast("Logo kaldırıldı", "info");
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_500_000) { toast("Dosya çok büyük (~2.5MB sınırı)", "error"); return; }
    const docTypeToSave = docTypesForRole(user?.role).includes(docType) ? docType : docTypesForRole(user?.role)[0];
    const reader = new FileReader();
    reader.onload = async () => {
      // url = belge içeriği (data-url). İleride Supabase Storage public URL'i ile değişir.
      const res = await onAddDoc?.({ id: Date.now(), ownerId: user.id, type: docTypeToSave, name: f.name, url: reader.result, dataUrl: reader.result, createdAt: new Date().toISOString() });
      if (res && res.ok === false) { toast(res.error || "Belge yüklenemedi", "error"); return; }
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

  // Bir malzemeyi satıcının listesine ekle/çıkar (toggle).
  const toggleMalzeme = (m) =>
    setForm((f) => ({
      ...f,
      malzemeler: f.malzemeler.includes(m)
        ? f.malzemeler.filter((x) => x !== m)
        : [...f.malzemeler, m],
    }));

  // Bir faaliyet alanını alıcının listesine ekle/çıkar (toggle).
  const toggleFaaliyet = (m) =>
    setForm((f) => ({
      ...f,
      faaliyetAlani: f.faaliyetAlani.includes(m)
        ? f.faaliyetAlani.filter((x) => x !== m)
        : [...f.faaliyetAlani, m],
    }));

  // Bir hizmet bölgesini (il) nakliyecinin listesine ekle/çıkar (toggle).
  const toggleBolge = (m) =>
    setForm((f) => ({
      ...f,
      hizmetBolgeleri: f.hizmetBolgeleri.includes(m)
        ? f.hizmetBolgeleri.filter((x) => x !== m)
        : [...f.hizmetBolgeleri, m],
    }));

  const save = async () => {
    if (!form.name.trim()) { toast("Ad / firma zorunludur", "error"); return; }
    const patch = { name: form.name.trim(), phone: form.phone.trim(), role: form.role };
    // Satıcı rolündeyse tesis/konum/ürün alanlarını da kaydet.
    if (user.role === "tedarikci") {
      patch.tesisTuru = form.tesisTuru;
      patch.sehir = form.sehir;
      patch.ilce = form.ilce.trim();
      patch.hakkinda = form.hakkinda.trim();
      patch.malzemeler = form.malzemeler;
      patch.calismaSaatleri = form.calismaSaatleri.trim();
    }
    // Alıcı rolündeyse firma/konum/faaliyet alanlarını kaydet.
    if (user.role === "isveren") {
      patch.firmaTuru = form.firmaTuru;
      patch.sehir = form.sehir;
      patch.ilce = form.ilce.trim();
      patch.hakkinda = form.hakkinda.trim();
      patch.faaliyetAlani = form.faaliyetAlani;
      patch.web = form.web.trim();
      patch.vergiNo = form.vergiNo.trim();
    }
    // Nakliyeci rolündeyse taşıma/konum/bölge alanlarını kaydet.
    if (user.role === "nakliyeci") {
      patch.tasimaTuru = form.tasimaTuru;
      patch.sehir = form.sehir;
      patch.ilce = form.ilce.trim();
      patch.hakkinda = form.hakkinda.trim();
      patch.filoOzeti = form.filoOzeti.trim();
      patch.hizmetBolgeleri = form.hizmetBolgeleri;
    }
    const res = await onUpdateProfile?.(patch);
    if (res && res.ok === false) { toast(res.error || "Profil güncellenemedi", "error"); return; }
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
          {/* Avatar — logo varsa göster, yoksa baş harfli sarı kare */}
          <div style={{ width: 60, height: 60, borderRadius: 6, background: user.logo ? "#fff" : C.yellow, border: `2px solid ${C.ink}`, boxShadow: "0 0 0 2px #fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            {user.logo
              ? <img src={user.logo} alt={`${user.name} logosu`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontFamily: ARCHIVO, fontSize: 22, fontWeight: 900, color: C.ink }}>{initials(user.name)}</span>}
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

          {/* Firma logosu — ilanlarında ve profilinde görünür */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}>Firma logosu</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 6, background: user.logo ? "#fff" : C.stone, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {user.logo
                  ? <img src={user.logo} alt="Firma logosu" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 900, color: C.muted }}>{initials(form.name || user.name)}</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "8px 12px", fontFamily: ARCHIVO, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                    <Upload size={14} strokeWidth={2.4} /> {user.logo ? "Değiştir" : "Logo yükle"}
                    <input type="file" accept="image/*" onChange={onLogoFile} style={{ display: "none" }} />
                  </label>
                  {user.logo && (
                    <button type="button" onClick={removeLogo}
                      style={{ background: "none", border: `2px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.red, cursor: "pointer", textTransform: "uppercase" }}>
                      Kaldır
                    </button>
                  )}
                </div>
                <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, lineHeight: 1.5 }}>PNG / JPG · kare önerilir · büyük görseller otomatik küçültülür</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}>E-posta</label>
            <input style={{ ...inputSt, background: C.stone, opacity: 0.6, cursor: "not-allowed" }} value={user.email} disabled />
          </div>

          {/* Telefon (SMS doğrulama şimdilik kaldırıldı — gerçek SMS sağlayıcı bağlı değil) */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}>Telefon</label>
            <input style={inputSt} value={form.phone}
              onChange={(e) => set("phone", e.target.value)} placeholder="05XX XXX XX XX" />
            <div style={{ marginTop: 7, fontFamily: MONO, fontSize: 10, color: C.faint, lineHeight: 1.5 }}>
              Numaran yalnızca eşleşen tarafla iletişim için paylaşılır.
            </div>
          </div>

          {/* Rol seçimi — yalnızca rolü henüz atanmamış kullanıcıya gösterilir.
              Rol kayıt sırasında seçilir; rolü olan kullanıcı profilde değiştiremez.
              Yanlış seçim halinde destek ile değiştirilir (admin panelinden). */}
          {!ROLES.some((r) => r.id === user.role) ? (
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
          ) : (
            <div style={{ marginBottom: 16 }}>
              <label style={labelSt}>Rol</label>
              <div style={{ border: `2px solid ${C.ink}`, background: C.card, borderRadius: 6, padding: "11px 13px" }}>
                <div style={{ fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em" }}>{roleBadge}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.sub, marginTop: 4, lineHeight: 1.5 }}>
                  Rolün kayıt sırasında belirlenir ve değiştirilemez. Yanlış seçtiysen{" "}
                  <button type="button" onClick={() => navigate("/iletisim")}
                    style={{ background: "none", border: "none", padding: 0, font: "inherit", color: C.ink, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>
                    destek ile iletişime geç
                  </button>.
                </div>
              </div>
            </div>
          )}

          <button type="button" onClick={save}
            style={{ width: "100%", background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "14px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
            Değişiklikleri kaydet
          </button>
        </motion.section>

        {/* Satıcı bilgileri — yalnızca tedarikçi (satıcı) rolünde görünür.
            Herkese açık satıcı vitrini (/satici/:id) bu alanlardan beslenir. */}
        {role === "tedarikci" && (
          <section style={cardSt}>
            <h2 style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 7 }}>
              <Building2 size={16} strokeWidth={2.4} color={C.ink} /> Satıcı bilgileri
            </h2>
            <p style={{ fontFamily: MONO, fontSize: 10, color: C.faint, margin: "0 0 10px", lineHeight: 1.5 }}>
              Herkese açık <b style={{ color: C.ink }}>mağaza vitrinini</b> besler — alıcılar seni önce ürün
              kataloğun, stok ve teslimat bilginle görür. Ürünleri fiyatıyla{" "}
              <button type="button" onClick={() => navigate("/ilan-ver")}
                style={{ background: "none", border: "none", padding: 0, font: "inherit", color: C.ink, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>İlan Ver</button>{" "}
              sayfasından yayınlarsın.
            </p>
            <button type="button" onClick={() => navigate(`/satici/${user.id}`)} style={previewBtnSt}>
              <Package size={14} strokeWidth={2.4} /> Mağaza vitrinini gör <ChevronRight size={15} strokeWidth={2.4} />
            </button>

            {/* Tesis türü */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Tesis türü</label>
              <select value={form.tesisTuru} onChange={(e) => set("tesisTuru", e.target.value)}
                style={{ ...inputSt, fontWeight: 700, fontSize: 13 }}>
                <option value="">Seçiniz…</option>
                {TESIS_TURLERI.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Konum: il + ilçe */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={labelSt}>İl</label>
                <select value={form.sehir} onChange={(e) => set("sehir", e.target.value)}
                  style={{ ...inputSt, fontWeight: 700, fontSize: 13 }}>
                  <option value="">Seçiniz…</option>
                  {IL_LIST.map((il) => <option key={il} value={il}>{il}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={labelSt}>İlçe</label>
                <input style={inputSt} value={form.ilce} onChange={(e) => set("ilce", e.target.value)} placeholder="Gebze" />
              </div>
            </div>

            {/* Hakkında / tanıtım */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Hakkında</label>
              <textarea value={form.hakkinda} onChange={(e) => set("hakkinda", e.target.value)}
                rows={3} maxLength={400} placeholder="Tesisini, kapasiteni ve hizmet bölgeni kısaca anlat."
                style={{ ...inputSt, resize: "vertical", lineHeight: 1.5, minHeight: 70 }} />
              <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 9, color: C.faint, textAlign: "right" }}>{form.hakkinda.length}/400</div>
            </div>

            {/* Çalışma saatleri */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Çalışma saatleri</label>
              <input style={inputSt} value={form.calismaSaatleri} onChange={(e) => set("calismaSaatleri", e.target.value)} placeholder="Hafta içi 08:00–18:00, Cmt 08:00–13:00" />
            </div>

            {/* Sattığın malzemeler — çoklu seçim chip'leri */}
            <div>
              <label style={labelSt}>Sattığın malzemeler</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 2 }}>
                {SATICI_MALZEMELERI.map((m) => {
                  const active = form.malzemeler.includes(m);
                  return (
                    <button type="button" key={m} onClick={() => toggleMalzeme(m)}
                      style={{
                        fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                        border: `2px solid ${C.ink}`, background: active ? C.yellow : C.card, color: C.ink,
                        boxShadow: active ? "2px 2px 0 #0A0A0A" : "none",
                      }}>
                      {m}
                    </button>
                  );
                })}
                {/* Güncel listede olmayan kayıtlı seçimler (eski liste adları):
                    görünmez+silinemez kalmasınlar — çıkarılabilir chip olarak göster. */}
                {form.malzemeler.filter((m) => !SATICI_MALZEMELERI.includes(m)).map((m) => (
                  <button type="button" key={m} onClick={() => toggleMalzeme(m)}
                    title="Listede olmayan eski seçim — çıkarmak için dokun"
                    style={{
                      fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                      border: `2px dashed ${C.ink}`, background: C.yellow, color: C.ink,
                      boxShadow: "2px 2px 0 #0A0A0A",
                    }}>
                    {m} ×
                  </button>
                ))}
              </div>
              {form.malzemeler.length > 0 && (
                <div style={{ marginTop: 9, fontFamily: MONO, fontSize: 10, color: C.sub }}>{form.malzemeler.length} malzeme seçili</div>
              )}
            </div>

            <button type="button" onClick={save}
              style={{ width: "100%", marginTop: 18, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "14px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
              Satıcı bilgilerini kaydet
            </button>
          </section>
        )}

        {/* Firma bilgileri — yalnızca alıcı (işveren) rolünde görünür.
            Herkese açık alıcı vitrini (/alici/:id) bu alanlardan beslenir. */}
        {role === "isveren" && (
          <section style={cardSt}>
            <h2 style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 7 }}>
              <Building2 size={16} strokeWidth={2.4} color={C.ink} /> Firma bilgileri
            </h2>
            <p style={{ fontFamily: MONO, fontSize: 10, color: C.faint, margin: "0 0 10px", lineHeight: 1.5 }}>
              Herkese açık <b style={{ color: C.ink }}>firma künyeni</b> besler — nakliyeciler seni önce güvenin,
              tamamlanan iş sayın ve doğrulanmış belgelerinle tanır. Ne kadar eksiksizse o kadar güven verir.
            </p>
            <button type="button" onClick={() => navigate(`/alici/${user.id}`)} style={previewBtnSt}>
              <ShieldCheck size={14} strokeWidth={2.4} /> Firma künyeni gör <ChevronRight size={15} strokeWidth={2.4} />
            </button>

            {/* Firma türü */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Firma türü</label>
              <select value={form.firmaTuru} onChange={(e) => set("firmaTuru", e.target.value)}
                style={{ ...inputSt, fontWeight: 700, fontSize: 13 }}>
                <option value="">Seçiniz…</option>
                {FIRMA_TURLERI.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Konum: il + ilçe */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={labelSt}>İl</label>
                <select value={form.sehir} onChange={(e) => set("sehir", e.target.value)}
                  style={{ ...inputSt, fontWeight: 700, fontSize: 13 }}>
                  <option value="">Seçiniz…</option>
                  {IL_LIST.map((il) => <option key={il} value={il}>{il}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={labelSt}>İlçe</label>
                <input style={inputSt} value={form.ilce} onChange={(e) => set("ilce", e.target.value)} placeholder="Ümraniye" />
              </div>
            </div>

            {/* Hakkında / tanıtım */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Hakkında</label>
              <textarea value={form.hakkinda} onChange={(e) => set("hakkinda", e.target.value)}
                rows={3} maxLength={400} placeholder="Firmanı, çalıştığın bölgeyi ve iş hacmini kısaca anlat."
                style={{ ...inputSt, resize: "vertical", lineHeight: 1.5, minHeight: 70 }} />
              <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 9, color: C.faint, textAlign: "right" }}>{form.hakkinda.length}/400</div>
            </div>

            {/* Web + Vergi no */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={labelSt}>Web sitesi</label>
                <input style={inputSt} value={form.web} onChange={(e) => set("web", e.target.value)} placeholder="ornekfirma.com" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={labelSt}>Vergi no</label>
                <input style={inputSt} value={form.vergiNo} onChange={(e) => set("vergiNo", e.target.value)} placeholder="1234567890" />
              </div>
            </div>

            {/* Faaliyet alanı — çoklu seçim chip'leri */}
            <div>
              <label style={labelSt}>Faaliyet alanı</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 2 }}>
                {FAALIYET_ALANLARI.map((m) => {
                  const active = form.faaliyetAlani.includes(m);
                  return (
                    <button type="button" key={m} onClick={() => toggleFaaliyet(m)}
                      style={{
                        fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                        border: `2px solid ${C.ink}`, background: active ? C.yellow : C.card, color: C.ink,
                        boxShadow: active ? "2px 2px 0 #0A0A0A" : "none",
                      }}>
                      {m}
                    </button>
                  );
                })}
              </div>
              {form.faaliyetAlani.length > 0 && (
                <div style={{ marginTop: 9, fontFamily: MONO, fontSize: 10, color: C.sub }}>{form.faaliyetAlani.length} alan seçili</div>
              )}
            </div>

            <button type="button" onClick={save}
              style={{ width: "100%", marginTop: 18, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "14px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
              Firma bilgilerini kaydet
            </button>
          </section>
        )}

        {/* Taşıma bilgileri — yalnızca nakliyeci rolünde görünür.
            Herkese açık nakliyeci vitrini (/nakliyeci-profil/:id) bu alanlardan beslenir. */}
        {role === "nakliyeci" && (
          <section style={cardSt}>
            <h2 style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 7 }}>
              <Truck size={16} strokeWidth={2.4} color={C.ink} /> Taşıma bilgileri
            </h2>
            <p style={{ fontFamily: MONO, fontSize: 10, color: C.faint, margin: "0 0 10px", lineHeight: 1.5 }}>
              Herkese açık <b style={{ color: C.ink }}>nakliyeci profilini</b> besler — alıcılar seni filon,
              hizmet bölgen ve puanınla bulur.
            </p>
            <button type="button" onClick={() => navigate(`/nakliyeci-profil/${user.id}`)} style={previewBtnSt}>
              <Truck size={14} strokeWidth={2.4} /> Nakliyeci profilini gör <ChevronRight size={15} strokeWidth={2.4} />
            </button>

            {/* Taşıma türü */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Taşıma türü</label>
              <select value={form.tasimaTuru} onChange={(e) => set("tasimaTuru", e.target.value)}
                style={{ ...inputSt, fontWeight: 700, fontSize: 13 }}>
                <option value="">Seçiniz…</option>
                {TASIMA_TURLERI.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Konum: il + ilçe (merkez) */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={labelSt}>Merkez il</label>
                <select value={form.sehir} onChange={(e) => set("sehir", e.target.value)}
                  style={{ ...inputSt, fontWeight: 700, fontSize: 13 }}>
                  <option value="">Seçiniz…</option>
                  {IL_LIST.map((il) => <option key={il} value={il}>{il}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={labelSt}>İlçe</label>
                <input style={inputSt} value={form.ilce} onChange={(e) => set("ilce", e.target.value)} placeholder="Nilüfer" />
              </div>
            </div>

            {/* Hakkında / tanıtım */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Hakkında</label>
              <textarea value={form.hakkinda} onChange={(e) => set("hakkinda", e.target.value)}
                rows={3} maxLength={400} placeholder="Filonu, çalıştığın güzergahları ve deneyimini kısaca anlat."
                style={{ ...inputSt, resize: "vertical", lineHeight: 1.5, minHeight: 70 }} />
              <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 9, color: C.faint, textAlign: "right" }}>{form.hakkinda.length}/400</div>
            </div>

            {/* Filo özeti */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Filo özeti</label>
              <input style={inputSt} value={form.filoOzeti} onChange={(e) => set("filoOzeti", e.target.value)} placeholder="5 araç · 18–30 ton · damperli + silobas" />
              <div style={{ marginTop: 7, fontFamily: MONO, fontSize: 10, color: C.faint, lineHeight: 1.5 }}>
                Araçlarını ayrıca <button type="button" onClick={() => navigate("/filo")}
                  style={{ background: "none", border: "none", padding: 0, font: "inherit", color: C.ink, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>Filom</button> sayfasından yönetebilirsin.
              </div>
            </div>

            {/* Hizmet bölgeleri — çoklu il seçimi */}
            <div>
              <label style={labelSt}>Hizmet bölgeleri</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 2 }}>
                {IL_LIST.map((il) => {
                  const active = form.hizmetBolgeleri.includes(il);
                  return (
                    <button type="button" key={il} onClick={() => toggleBolge(il)}
                      style={{
                        fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                        border: `2px solid ${C.ink}`, background: active ? C.yellow : C.card, color: C.ink,
                        boxShadow: active ? "2px 2px 0 #0A0A0A" : "none",
                      }}>
                      {il}
                    </button>
                  );
                })}
              </div>
              {form.hizmetBolgeleri.length > 0 && (
                <div style={{ marginTop: 9, fontFamily: MONO, fontSize: 10, color: C.sub }}>{form.hizmetBolgeleri.length} il seçili</div>
              )}
            </div>

            <button type="button" onClick={save}
              style={{ width: "100%", marginTop: 18, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "14px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
              Taşıma bilgilerini kaydet
            </button>
          </section>
        )}

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
            // Mola Yeri forum bildirimi — yalnız nakliyeci rolünde göster.
            ...(role === "nakliyeci" ? [{ key: "mola", label: "Mola Yeri yorumları", desc: "Başlığına veya katıldığın başlığa yorum gelince" }] : []),
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
                  {(() => {
                    // SB modunda belge dataUrl değil url ile gelir; resimse ikisinden birini göster.
                    const src = d.dataUrl || d.url || "";
                    const isImg = src.startsWith("data:image") || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(src);
                    return isImg
                      ? <img src={src} alt="" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 5, border: `2px solid ${C.ink}`, objectFit: "cover" }} />
                      : <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 5, background: C.stone, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={18} color={C.ink} strokeWidth={2} /></span>;
                  })()}
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
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <StarsDisplay value={r.rating} className="text-xs" />
                        <button type="button" onClick={() => setReportTarget(r)} aria-label="Yorumu şikayet et"
                          style={{ background: "none", border: "none", padding: 2, cursor: "pointer", lineHeight: 0 }}>
                          <Flag size={14} color={C.muted} strokeWidth={2} />
                        </button>
                      </span>
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
            { icon: Ban, label: "Engellenen kullanıcılar", desc: blockedIds.length ? `${blockedIds.length} kullanıcı engelli` : "Engellediğin kimse yok", onClick: () => setShowBlocked(true) },
          ].map((m, i, arr) => {
            const Icon = m.icon;
            return (
              <button key={m.to || m.label} onClick={() => (m.onClick ? m.onClick() : navigate(m.to))}
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

        {/* Hesap silme profil yüzeyinden kaldırıldı — artık Gizlilik & Yasal >
            "Hesap Sil" sekmesinde (LegalPage /yasal/hesap-silme). Menüdeki
            "Gizlilik & Yasal" satırının açıklaması oraya işaret eder. */}
      </div>

      {/* Yorum şikayet modali — hakaret/uygunsuz içerik bildirimi (App Store 1.2) */}
      {reportTarget && (
        <ReportModal
          targetLabel={`Yorum: ${reportTarget.fromName}`}
          onClose={() => setReportTarget(null)}
          onSubmit={(p) =>
            onReport?.({
              type: "user",
              targetId: reportTarget.fromId,
              listingId: null,
              fromId: user?.id || null,
              fromName: user?.name || "misafir",
              ...p,
              desc: (p.desc ? p.desc + " — " : "") + `Şikayet edilen yorum: "${(reportTarget.comment || "").slice(0, 200)}"`,
            })
          }
        />
      )}

      {/* Engellenen kullanıcılar — engel buradan kaldırılır (Mesajlar'daki engelin geri dönüş yolu) */}
      {showBlocked && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(10,10,10,.7)" }}
          onClick={() => setShowBlocked(false)}
        >
          <div
            style={{ width: "100%", maxWidth: 420, maxHeight: "70vh", overflowY: "auto", background: "#fff", border: `2px solid ${C.ink}`, borderRadius: 6, padding: 18, boxShadow: "6px 6px 0 rgba(10,10,10,.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: ARCHIVO, fontSize: 17, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink, margin: "0 0 12px" }}>Engellenen Kullanıcılar</h2>
            {blockedIds.length === 0 ? (
              <p style={{ fontFamily: MONO, fontSize: 12, color: C.sub, margin: 0, lineHeight: 1.55 }}>
                Engellediğin kimse yok. Bir kullanıcıyı ilan detayından veya mesajlardaki ⋮ menüsünden engelleyebilirsin.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {blockedIds.map((id) => {
                  const name = getContact?.(id)?.name || "Kullanıcı";
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 12px" }}>
                      <span style={{ minWidth: 0, flex: 1, fontFamily: ARCHIVO, fontSize: 13.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {name}
                      </span>
                      <button
                        onClick={() => { onToggleBlock?.(id); toast?.("Engel kaldırıldı", "success"); }}
                        style={{ flexShrink: 0, background: C.stone, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "8px 12px", fontFamily: MONO, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: C.ink, cursor: "pointer" }}
                      >
                        Engeli kaldır
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => setShowBlocked(false)}
              style={{ width: "100%", marginTop: 14, background: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 0", fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: C.yellow, cursor: "pointer" }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
