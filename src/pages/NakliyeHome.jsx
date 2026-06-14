// HamTed — Ana Sayfa (Variant A · Sade)
// Figma tasarımından React/Tailwind uyarlaması.
// Alt tab bar App.jsx'teki global <MobileTabBar> tarafından sağlanır (burada yok).

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell, Search, List, MapPin, ChevronRight, RefreshCw, Truck, Package,
  Star, TrendingUp, Wallet, Clock, CheckCircle2, AlertCircle, ArrowRight, User,
} from "lucide-react";
import { LISTINGS } from "../data/listings";
import SEO from "../components/SEO";

// ── Durum rozeti yapılandırması ──────────────────────────────
const STATUS_CONFIG = {
  aktif: { label: "Aktif", bg: "bg-emerald-50", text: "text-emerald-700", icon: <CheckCircle2 size={10} /> },
  teklif: { label: "Teklif var", bg: "bg-amber-50", text: "text-amber-700", icon: <AlertCircle size={10} /> },
  tamamlandı: { label: "Tamamlandı", bg: "bg-sky-50", text: "text-sky-700", icon: <CheckCircle2 size={10} /> },
  eslesti: { label: "Eşleşti", bg: "bg-emerald-50", text: "text-emerald-700", icon: <CheckCircle2 size={10} /> },
};

function resolveStatus(l) {
  if (l.status === "eslesti") return "eslesti";
  if (l.status === "kapali") return "tamamlandı";
  return l.offers > 0 ? "teklif" : "aktif";
}

function Logo() {
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-yellow-400">
      <span className="font-black text-white" style={{ fontSize: 16, letterSpacing: -1 }}>H</span>
    </div>
  );
}

function ListingCard({ item, onClick }) {
  const st = STATUS_CONFIG[resolveStatus(item)] || STATUS_CONFIG.aktif;
  const isHafriyat = item.cat === "hafriyat";
  const price = item.priceType === "sabit" && item.price
    ? `₺${item.price.toLocaleString("tr-TR")}` : "Teklife açık";

  return (
    <motion.button onClick={onClick} whileTap={{ scale: 0.98 }}
      className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left shadow-sm transition-shadow hover:shadow-md dark:bg-navy-card">
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${isHafriyat ? "bg-yellow-100" : "bg-sky-100"}`}>
        {isHafriyat ? <Truck size={20} className="text-amber-600" /> : <Package size={20} className="text-sky-600" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-bold text-slate-900 dark:text-slate-100">{item.title}</span>
          <span className="flex-shrink-0 text-[13px] font-extrabold text-yellow-500">{price}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1">
          <MapPin size={10} className="flex-shrink-0 text-gray-400" />
          <span className="truncate text-[11px] text-gray-500 dark:text-slate-400">
            {item.il}{item.ilce ? `, ${item.ilce}` : ""}{item.amount ? ` · ${item.amount} ${item.unit || ""}` : ""}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.bg} ${st.text}`}>
            {st.icon}{st.label}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Clock size={9} />{item.createdText || "Bugün"}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function NakliyeHome({ listings = LISTINGS, user, pendingOffersCount = 0, unreadCount = 0, onLoginClick }) {
  const navigate = useNavigate();

  const myListings = user ? listings.filter((l) => String(l.ownerId) === String(user?.id)) : [];
  const myActiveCount = myListings.filter((l) => l.status === "aktif" || l.status === "eslesti").length;
  const recentListings = listings.filter((l) => l.status !== "kapali").slice(0, 4);
  const backhaulCount = listings.filter((l) => l.status === "aktif" && l.type === "is").length;
  const firstName = user ? (String(user.name || "").split(" ")[0] || "Kullanıcı") : null;

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col pb-24 text-slate-900 dark:text-slate-100">
      <SEO title="Ana Sayfa" description="Hafriyat ve silobas iş ilanları. Nakliyecilerden teklif alın, komisyonsuz eşleşin." />

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <div>
            <div className="text-[16px] font-extrabold leading-tight text-slate-900 dark:text-slate-100">
              {user ? `Merhaba, ${firstName} 👋` : "HamTed"}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400">
              <MapPin size={10} className="text-yellow-400" />
              {user ? (user.role === "nakliyeci" ? "Nakliyeci" : user.role === "tedarikci" ? "Tedarikçi" : "Müteahhit") : "Yük & Nakliye Platformu"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/mesajlar")} className="relative" aria-label="Bildirimler">
            <Bell size={22} className="text-slate-900 dark:text-slate-100" />
            {(unreadCount > 0 || pendingOffersCount > 0) && (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-gray-100 bg-red-500 dark:border-navy-card" />
            )}
          </button>
          <button onClick={() => navigate(user ? "/profil" : "/")} aria-label="Profil">
            <User size={22} className="text-slate-900 dark:text-slate-100" />
          </button>
        </div>
      </div>

      {/* ARAMA */}
      <div className="px-5 pt-4">
        <button onClick={() => navigate("/ilanlar")}
          className="flex w-full items-center gap-2.5 rounded-full bg-white px-4 py-3 shadow-sm dark:bg-navy-card">
          <Search size={16} className="flex-shrink-0 text-gray-400" />
          <span className="text-[13px] text-gray-400">İl, malzeme veya güzergah ara…</span>
        </button>
      </div>

      {/* İSTATİSTİK ŞERIDI */}
      <div className="grid grid-cols-3 gap-2.5 px-5 pt-3.5">
        {[
          { label: "Aktif ilan", value: user ? String(myActiveCount) : `${listings.filter((l) => l.status === "aktif").length}+`, icon: <List size={14} className="text-yellow-500" />, onClick: () => navigate(user ? "/ilanlarim" : "/ilanlar") },
          { label: "Bekleyen teklif", value: user ? String(pendingOffersCount) : "—", icon: <TrendingUp size={14} className="text-yellow-500" />, onClick: () => navigate(user ? "/ilanlarim" : "/") },
          { label: "Cüzdan", value: user ? "₺—" : "—", icon: <Wallet size={14} className="text-yellow-500" />, onClick: () => navigate(user ? "/cuzdan" : "/") },
        ].map((s) => (
          <motion.button key={s.label} onClick={s.onClick} whileTap={{ scale: 0.96 }}
            className="flex flex-col items-center rounded-2xl bg-white px-2 py-3 text-center shadow-sm dark:bg-navy-card">
            <div className="mb-1">{s.icon}</div>
            <div className="text-[15px] font-extrabold text-slate-900 dark:text-slate-100">{s.value}</div>
            <div className="mt-0.5 text-[9px] font-semibold leading-tight text-gray-400">{s.label}</div>
          </motion.button>
        ))}
      </div>

      {/* PROMO KARTI */}
      <div className="px-5 pt-3.5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-3xl px-5 py-5"
          style={{ background: "linear-gradient(135deg,#FACC15 0%,#FDE68A 100%)", boxShadow: "0 4px 20px rgba(250,204,21,0.35)" }}>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-800">0 komisyon</div>
            <div className="mt-1 text-[18px] font-black leading-tight tracking-tight text-slate-950">İlanını ücretsiz aç</div>
            <div className="mt-1 text-[11px] leading-snug text-amber-900">Nakliyecilerden teklif al,<br />sefer başlat.</div>
            <button onClick={() => navigate("/ilan-ver")}
              className="mt-3.5 flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2 text-[12px] font-bold text-yellow-400">
              İlan ver <ArrowRight size={13} />
            </button>
          </div>
          <div className="select-none text-[56px] leading-none">🚛</div>
        </motion.div>
      </div>

      {/* DÖNÜŞ YÜKÜ WIDGET */}
      <div className="px-5 pt-3">
        <button onClick={() => navigate("/ilanlar?mode=backhaul")}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:bg-navy-card">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50">
            <RefreshCw size={18} className="text-emerald-600" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-[13px] font-bold text-slate-900 dark:text-slate-100">Dönüş yükü bul</div>
            <div className="mt-0.5 text-[11px] text-gray-500 dark:text-slate-400">Güzergahına uygun boş dönüş ilanları</div>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-600">{backhaulCount} ilan</div>
        </button>
      </div>

      {/* KATEGORİ KARTLARI */}
      <div className="px-5 pt-4">
        <div className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.8px] text-slate-900 dark:text-slate-100">Kategori</div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: "hafriyat", label: "Hafriyat", emoji: "🚛", active: true },
            { id: "silobas", label: "Silobas", emoji: "🏗️", active: false },
          ].map((c) => (
            <motion.button key={c.id} onClick={() => navigate(`/ilanlar?cat=${c.id}`)} whileTap={{ scale: 0.97 }}
              className={`flex flex-col items-center gap-1.5 rounded-2xl py-4 font-bold transition ${c.active ? "bg-yellow-400 text-slate-950 shadow-md" : "bg-white text-slate-900 shadow-sm hover:shadow-md dark:bg-navy-card dark:text-slate-100"}`}
              style={c.active ? { boxShadow: "0 4px 14px rgba(250,204,21,0.4)" } : {}}>
              <span className="text-[28px] leading-none">{c.emoji}</span>
              <span className="text-[12px]">{c.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* SON İLANLAR */}
      <div className="px-5 pt-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.8px] text-slate-900 dark:text-slate-100">Son ilanlar</span>
          <button onClick={() => navigate("/ilanlar")} className="flex items-center gap-0.5 text-[12px] font-bold text-amber-600">
            Tümü <ChevronRight size={13} />
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {recentListings.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.25 }}>
              <ListingCard item={item} onClick={() => navigate(`/ilan/${item.id}`)} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* GİRİŞ YAPMAMIŞ KULLANICI CTA */}
      {!user && (
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between rounded-2xl bg-slate-950 p-4 dark:bg-navy-soft">
            <div>
              <div className="text-[13px] font-extrabold text-white">Ücretsiz hesap aç</div>
              <div className="mt-0.5 text-[11px] text-slate-400">İlan ver, teklif al. Komisyon yok.</div>
            </div>
            <button onClick={() => onLoginClick?.()} className="rounded-full bg-yellow-400 px-4 py-2 text-[12px] font-extrabold text-slate-950">
              Giriş / Kayıt
            </button>
          </div>
        </div>
      )}

      {/* GÜVEN SAYILARI */}
      <div className="px-5 pb-4 pt-4">
        <div className="flex justify-around rounded-3xl bg-slate-950 px-6 py-5 dark:bg-navy-soft">
          {[{ value: "2.400+", label: "İlan" }, { value: "850+", label: "Nakliyeci" }, { value: "%0", label: "Komisyon" }].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[18px] font-black tracking-tight text-yellow-400">{s.value}</div>
              <div className="mt-0.5 text-[10px] font-semibold text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* DEĞERLENDİRME ŞERİDİ */}
      <div className="flex items-center justify-center gap-1 pb-2">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
        ))}
        <span className="ml-1.5 text-[11px] text-gray-500">4.8 · 1.200+ değerlendirme</span>
      </div>
    </div>
  );
}
