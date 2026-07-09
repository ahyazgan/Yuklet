// YÜKLET — Ana Sayfa (SAHA tasarım sistemi)
// Keskin endüstriyel dil: 2px ink çerçeve · hazard şeritleri · sert offset gölge ·
// Archivo uppercase başlıklar · Space Mono veriler · koyu header blokları · lucide stroke ikonlar.
// 3 rol gövdesi tek bileşende (muteahhit / nakliyeci / tedarikci).
//
// Prop sözleşmesi DEĞİŞMEDİ: NakliyeHome({ user, pendingOffersCount, unreadCount, onLoginClick }).

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  Bell, Search, MapPin, RefreshCw, Truck, Package,
  ArrowRight, MessageCircle, ChevronRight, Activity, TrendingUp,
} from "lucide-react";
import SEO from "../components/SEO";
import Logo from "../components/Logo";
import { LISTINGS } from "../data/listings";
import { loadListings, loadOffers } from "../utils/storage";
import { marketPulse, haversineKm } from "../utils/priceEstimate";
import { loadsNearCity } from "../utils/backhaul";
import { IL_COORDS } from "../data/ilCoords";

/* ── SAHA paleti (kesin değerler — _DESIGN_SYSTEM.md) ────────────────── */
const C = {
  ink: "#0A0A0A",        // siyah / çerçeve / birincil
  header: "#EAE3D6",     // açık manila header (kullanılmıyor — koyu bloklar tercih)
  yellow: "#FACC15",     // hazard sarısı — aksiyon/aksan
  green: "#16803C",      // eşleşti / onay / para
  red: "#DC2626",        // acil / bildirim
  bg: "#F1EDE5",         // manila gövde zemini
  card: "#FFFFFF",       // beyaz kart
  stone: "#F4F1EA",      // nötr dolgu
  sub: "#5A5852",        // ikincil metin
  muted: "#9A968D",      // soluk metin
  faint: "#A8A39A",      // pasif ikon
};

const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";
const ARCH = "'Archivo',system-ui,sans-serif";

/* SAHA imza yardımcıları */
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";
const SHADOW = "6px 6px 0 rgba(10,10,10,.12)";        // büyük kart sert gölge
const SHADOW_SM = "3px 3px 0 #0A0A0A";                 // küçük öğe sert gölge
const FRAME = `2px solid ${C.ink}`;

/* Rol -> header rozet metni (konum gerçek profilden gelir, bkz. `place`) */
const ROLE = {
  muteahhit: { badge: "ALICI" },
  nakliyeci: { badge: "NAKLİYECİ" },
  tedarikci: { badge: "SATICI" },
};

/* ── İmza parçaları ─────────────────────────────────────────────────── */

// Sarı-siyah çapraz hazard şeridi (yatay 8px varsayılan / dikey kart-içi)
function Hazard({ vertical, h = 8, w = 22, className = "", style = {} }) {
  return (
    <div
      className={className}
      style={{
        backgroundImage: HAZARD,
        height: vertical ? "100%" : h,
        width: vertical ? w : "100%",
        ...style,
      }}
    />
  );
}

// Bölüm başlığı: Archivo uppercase + solda 4x14 sarı bar
function SectionTitle({ children, right }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span
        className="flex items-center gap-2.5 text-[12px] font-extrabold uppercase"
        style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}
      >
        <span className="inline-block" style={{ width: 4, height: 14, background: C.yellow }} />
        {children}
      </span>
      {right}
    </div>
  );
}

// Mono durum rozeti (2px ink çerçeve)
function StatusBadge({ children, bg = C.yellow, fg = C.ink }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-[3px] text-[9px] font-bold uppercase"
      style={{ background: bg, color: fg, border: FRAME, borderRadius: 5, fontFamily: MONO }}
    >
      <span className="h-[5px] w-[5px] rounded-full" style={{ background: fg }} />
      {children}
    </span>
  );
}

// Stat kutusu: beyaz + 2px çerçeve + sert gölge, mono değer
function StatBox({ value, label, money, dot }) {
  return (
    <div
      className="relative px-2.5 py-3 text-center"
      style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: SHADOW_SM }}
    >
      <div className="leading-none" style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: money ? C.green : C.ink }}>
        {value}
      </div>
      <div className="mt-1.5 text-[8px] font-bold uppercase" style={{ color: C.sub, fontFamily: MONO, letterSpacing: "0.04em" }}>
        {label}
      </div>
      {dot && (
        <span
          className="absolute right-1.5 top-1.5 h-[8px] w-[8px] rounded-full"
          style={{ background: C.yellow, boxShadow: "0 0 0 3px rgba(250,204,21,.35)" }}
        />
      )}
    </div>
  );
}

/* ── ÜST: koyu header bloğu yok — açık üst (hazard şerit App'te değil burada) ─ */
function Header({ name, role, place, unread, onBell, onProfile, onSearch }) {
  const r = ROLE[role] || ROLE.muteahhit;
  const initial = (name || "D").trim().charAt(0).toUpperCase();
  return (
    <div className="px-[18px] pt-3">
      {/* logo — iki yanı hazard şeritli, ortalanmış marka kilidi */}
      <div className="mb-2 flex justify-center">
        <Logo size="lg" style={{ height: 72 }} />
      </div>
      {/* isim + aksiyonlar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <div className="text-[16px] font-extrabold uppercase leading-none" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>
              Merhaba, {name}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className="px-1.5 py-[2px] text-[9px] font-bold uppercase"
                style={{ background: C.yellow, color: C.ink, border: `1.5px solid ${C.ink}`, borderRadius: 4, fontFamily: MONO }}
              >
                {r.badge}
              </span>
              {place && (
                <span className="text-[9.5px] font-bold uppercase" style={{ color: C.sub, fontFamily: MONO, letterSpacing: "0.02em" }}>
                  {place}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBell}
            aria-label="Bildirimler"
            className="relative flex h-10 w-10 items-center justify-center"
            style={{ background: C.card, border: FRAME, borderRadius: 6 }}
          >
            <Bell size={19} strokeWidth={2} style={{ color: C.ink }} />
            {unread > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center px-1 text-[9px] font-bold text-white"
                style={{ background: C.red, border: `1.5px solid ${C.bg}`, borderRadius: 9, fontFamily: MONO }}
              >
                {unread}
              </span>
            )}
          </button>
          <button
            onClick={onProfile}
            aria-label="Profil"
            className="flex h-10 w-10 items-center justify-center text-[15px] font-black"
            style={{ background: C.yellow, color: C.ink, border: FRAME, borderRadius: 6, fontFamily: ARCH }}
          >
            {initial}
          </button>
        </div>
      </div>

      {/* arama: tam genişlik beyaz buton, 2px çerçeve */}
      <button
        onClick={onSearch}
        className="flex h-12 w-full items-center gap-2.5 px-3.5"
        style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: SHADOW_SM }}
      >
        <Search size={18} strokeWidth={2} style={{ color: C.ink }} />
        <span className="flex-1 text-left text-[10.5px] font-bold uppercase" style={{ color: C.sub, fontFamily: MONO, letterSpacing: "0.02em" }}>
          İl · Malzeme · Güzergah Ara
        </span>
      </button>
    </div>
  );
}

/* ── İlan kartı: solda 6px renkli şerit + 2px çerçeve ───────────────── */
function ListingCard({ code, status, statusBg, statusFg, title, from, to, cat, catColor, price, owner, ownerLogo, ownerVerified, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative flex w-full overflow-hidden text-left"
      style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: SHADOW_SM }}
    >
      {/* sol renkli dikey şerit */}
      <span className="flex-shrink-0" style={{ width: 6, background: catColor }} />
      <div className="flex-1 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9.5px] font-bold uppercase" style={{ color: C.muted, fontFamily: MONO }}>{code}</span>
          <StatusBadge bg={statusBg} fg={statusFg}>{status}</StatusBadge>
        </div>
        <div className="mb-1.5 text-[14px] font-extrabold uppercase leading-tight" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>
          {title}
        </div>
        {/* firma logosu + adı */}
        {owner && (
          <div className="mb-2 flex items-center gap-2">
            {ownerLogo && (
              <img src={ownerLogo} alt="" style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover", border: `1.5px solid ${C.ink}`, flexShrink: 0 }} />
            )}
            <span className="truncate text-[12px] font-extrabold" style={{ color: C.ink, fontFamily: MONO }}>{owner}</span>
            {ownerVerified && (
              <span className="flex-shrink-0 text-[9px] font-bold uppercase" style={{ color: C.green, fontFamily: MONO }}>● ONAYLI</span>
            )}
          </div>
        )}
        <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase" style={{ color: C.sub, fontFamily: MONO }}>
          {from}<ArrowRight size={12} strokeWidth={2.5} style={{ color: C.faint }} />{to}
        </div>
        <div className="flex items-center justify-between pt-2.5" style={{ borderTop: `1.5px solid ${C.stone}` }}>
          <span className="px-2 py-[3px] text-[9px] font-bold uppercase" style={{ color: C.ink, border: `1.5px solid ${C.ink}`, borderRadius: 4, fontFamily: MONO }}>{cat}</span>
          <span className="text-[15px] font-extrabold" style={{ fontFamily: MONO, color: C.green, letterSpacing: "-0.02em" }}>{price}</span>
        </div>
      </div>
    </button>
  );
}

/* ── Dönüş yükü satır butonu ────────────────────────────────────────── */
function BackhaulRow({ nav, count = 3 }) {
  return (
    <button
      onClick={() => nav("/ilanlar?mode=backhaul")}
      className="mb-6 flex w-full items-center gap-3 p-3 text-left"
      style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: SHADOW_SM }}
    >
      <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center" style={{ border: `2px solid ${C.green}`, borderRadius: 6 }}>
        <RefreshCw size={20} strokeWidth={2.2} style={{ color: C.green }} />
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>Dönüş Yükü</div>
        <div className="mt-0.5 text-[10px] font-bold uppercase" style={{ color: C.sub, fontFamily: MONO }}>Boş Dönme — Yolda Yük Al</div>
      </div>
      <span
        className="flex h-7 min-w-[28px] items-center justify-center px-2 text-[12px] font-bold"
        style={{ background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 5, fontFamily: MONO }}
      >
        {count}
      </span>
    </button>
  );
}

/* ── Sarı CTA kartı (ilan aç / teklif al) ───────────────────────────── */
function YellowCTA({ nav, eyebrow = "%0 KOMİSYON", title, action = "İlan Ver", to = "/ilan-ver" }) {
  return (
    <div className="relative mb-6 overflow-hidden" style={{ background: C.yellow, border: FRAME, borderRadius: 6, boxShadow: SHADOW }}>
      <Hazard vertical w={20} className="absolute right-0 top-0" />
      <div className="py-4 pl-4 pr-9">
        <div className="mb-1.5 text-[9.5px] font-bold uppercase" style={{ color: C.ink, fontFamily: MONO, letterSpacing: "0.06em" }}>{eyebrow}</div>
        <div className="mb-3.5 text-[25px] font-black uppercase leading-[0.95]" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.02em" }}>
          {title}
        </div>
        <button
          onClick={() => nav(to)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-extrabold uppercase"
          style={{ background: C.ink, color: C.yellow, border: FRAME, borderRadius: 5, fontFamily: ARCH }}
        >
          {action} <ArrowRight size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/* ── Güven şeridi: koyu kart, 3 sütun ───────────────────────────────── */
function TrustStrip() {
  // Uydurma sayı yok — platformun gerçek/tasarımsal değer önermeleri.
  const items = [
    { v: "%0", l: "KOMİSYON" },
    { v: "✓", l: "GÜVENLİ EŞLEŞME" },
    { v: "★", l: "PUANLI ÜYELER" },
  ];
  return (
    <div className="mb-6 grid grid-cols-3 overflow-hidden" style={{ background: C.ink, border: FRAME, borderRadius: 6 }}>
      {items.map((it, i) => (
        <div key={it.l} className="px-2 py-4 text-center" style={i > 0 ? { borderLeft: "1.5px solid #222" } : undefined}>
          <div style={{ fontFamily: MONO, fontSize: 19, fontWeight: 700, color: C.yellow }}>{it.v}</div>
          <div className="mt-1 text-[8px] font-bold uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: "0.06em" }}>{it.l}</div>
        </div>
      ))}
    </div>
  );
}

/* ── MÜTEAHHİT gövdesi ──────────────────────────────────────────────── */
function MuteahhitBody({ nav, user, active, offersOnMine, recentJobs }) {
  return (
    <>
      {/* Aktif İşim — gerçek aktif ilan VEYA boş-durum */}
      <SectionTitle>Aktif İşim</SectionTitle>
      {active ? (
        <ActiveJobCard nav={nav} job={active} offersOnMine={offersOnMine} />
      ) : (
        <EmptyActiveJob nav={nav} user={user} />
      )}

      <YellowCTA nav={nav} title="İlanını Aç / Doğrudan Eşleş" action="İlan Ver" to="/ilan-ver" />
      <RecentListings nav={nav} jobs={recentJobs} />
    </>
  );
}

/* Aktif iş kartı — gerçek ilan verisinden */
function ActiveJobCard({ nav, job, offersOnMine }) {
  const code = "YKL-" + String(job.id).padStart(4, "0").slice(-4);
  const statusLabel = job.status === "eslesti" ? "Eşleşti" : "Aktif";
  const from = (job.il || job.yukleme || "—").toUpperCase();
  const to = (job.varisIl || job.bosaltma || job.ilce || "—").toUpperCase();
  const offerCount = job.offers != null ? job.offers : offersOnMine;
  return (
    <div className="relative mb-6 overflow-hidden" style={{ border: FRAME, borderRadius: 6, boxShadow: SHADOW }}>
      <div className="relative overflow-hidden px-4 py-3.5" style={{ background: "#0A0A0A" }}>
        <Hazard vertical w={18} className="absolute right-0 top-0" />
        <div className="pr-7">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-[9.5px] font-bold uppercase" style={{ color: C.muted, fontFamily: MONO }}>{code}</span>
            <StatusBadge bg={job.status === "eslesti" ? C.green : C.yellow} fg={job.status === "eslesti" ? "#FFFFFF" : C.ink}>{statusLabel}</StatusBadge>
          </div>
          <div className="mb-2 text-[18px] font-extrabold uppercase leading-tight" style={{ color: "#FFFFFF", fontFamily: ARCH, letterSpacing: "-0.01em" }}>
            {job.title}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase" style={{ color: C.yellow, fontFamily: MONO }}>
            {from} <ArrowRight size={12} strokeWidth={2.5} /> {to}
          </div>
        </div>
      </div>
      <div className="px-4 py-3.5" style={{ background: C.card }}>
        <div className="mb-3 flex items-center justify-between text-[10.5px] font-bold uppercase" style={{ color: C.sub, fontFamily: MONO }}>
          <span>{job.amount ? `${job.amount} ${job.unit || "TON"}` : (job.material || "—")}</span>
          <span style={{ color: C.green }}>{offerCount} TEKLİF</span>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => nav(`/ilan/${job.id}`)}
            className="flex h-[42px] flex-1 items-center justify-center text-[12.5px] font-extrabold uppercase"
            style={{ background: C.ink, color: C.yellow, border: FRAME, borderRadius: 5, fontFamily: ARCH }}
          >
            İlanı Yönet
          </button>
          <button
            onClick={() => nav("/mesajlar")}
            aria-label="Mesajlar"
            className="flex h-[42px] w-[42px] items-center justify-center"
            style={{ background: C.card, border: FRAME, borderRadius: 5 }}
          >
            <MessageCircle size={20} strokeWidth={2} style={{ color: C.ink }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* Boş-durum: henüz aktif iş yok → ilan açmaya yönlendir */
function EmptyActiveJob({ nav, user }) {
  return (
    <div className="relative mb-6 overflow-hidden" style={{ border: FRAME, borderRadius: 6, boxShadow: SHADOW_SM, background: C.card }}>
      <div className="flex flex-col items-center gap-3 px-5 py-7 text-center">
        <div className="flex h-12 w-12 items-center justify-center" style={{ border: `2px dashed ${C.ink}`, borderRadius: 8, background: C.stone }}>
          <Package size={24} strokeWidth={2} style={{ color: C.ink }} />
        </div>
        <div>
          <div className="text-[15px] font-extrabold uppercase leading-tight" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>
            Henüz aktif işin yok
          </div>
          <div className="mt-1.5 text-[10.5px] font-bold uppercase leading-snug" style={{ color: C.sub, fontFamily: MONO }}>
            {user ? "İlk iş ilanını aç, nakliyecilerden teklif al" : "Giriş yap, ilanını aç, teklif al"}
          </div>
        </div>
        <button
          onClick={() => nav("/ilan-ver")}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[12.5px] font-extrabold uppercase"
          style={{ background: C.yellow, color: C.ink, border: FRAME, borderRadius: 5, fontFamily: ARCH, boxShadow: SHADOW_SM }}
        >
          İlan Ver <ArrowRight size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/* ── NAKLİYECİ gövdesi ──────────────────────────────────────────────── */
function NakliyeciBody({ nav, available, setAvailable, carrier }) {
  const backhaulCount = carrier?.backhaulCount || 0;
  const suitableJobs = carrier?.suitableJobs || [];
  // Dönüş yükü kartı — gerçek veri (sabit "Bursa→İstanbul 412km" yerine).
  const originCity = (carrier?.backhaulCity || "").toLocaleUpperCase("tr-TR");
  const destCity = (carrier?.backhaulTo || "").toLocaleUpperCase("tr-TR");
  const backhaulKm = carrier?.backhaulKm || null;
  return (
    <>
      {/* müsaitlik anahtarı */}
      <div className="mb-5 flex items-center gap-2.5 p-3" style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: SHADOW_SM }}>
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: available ? C.green : C.faint, boxShadow: available ? "0 0 0 4px rgba(22,128,60,.18)" : "none" }}
        />
        <div className="flex-1 text-[11px] font-bold uppercase" style={{ color: C.ink, fontFamily: MONO }}>
          Aracım Müsait · İş Teklifi Al
        </div>
        <button
          onClick={() => setAvailable((v) => !v)}
          aria-label="Müsaitlik"
          className="relative h-7 w-[48px]"
          style={{ background: available ? C.green : C.faint, border: FRAME, borderRadius: 14, transition: "background .15s" }}
        >
          <span
            className="absolute top-[2px] h-[20px] w-[20px]"
            style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 10, right: available ? 2 : 22, transition: "right .15s" }}
          />
        </button>
      </div>

      {/* Dönüş yükü — koyu map kartı */}
      <SectionTitle right={backhaulCount > 0 ? <StatusBadge bg={C.green} fg="#FFFFFF">{backhaulCount} Eşleşme</StatusBadge> : null}>Dönüş Yükü</SectionTitle>
      <div className="relative mb-6 overflow-hidden" style={{ border: FRAME, borderRadius: 6, boxShadow: SHADOW }}>
        <div className="relative h-[120px] overflow-hidden" style={{ background: "#141414" }}>
          {/* ızgara zemin — radar hissi */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(#2c2c2c 1px,transparent 1px),linear-gradient(90deg,#2c2c2c 1px,transparent 1px)",
              backgroundSize: "26px 26px", opacity: 0.55,
            }}
          />
          {/* şematik güzergah — canlı harita değil, güzergah önizlemesi */}
          <svg viewBox="0 0 392 120" className="absolute inset-0 h-full w-full">
            <path d="M44 92 C 130 92, 160 40, 240 46 S 340 36, 356 26" stroke={C.yellow} strokeWidth="3" fill="none" strokeDasharray="1 9" strokeLinecap="round" />
            <circle cx="240" cy="46" r="4" fill={C.yellow} opacity="0.65" />
            {/* başlangıç: senin ilin (dolu nokta) */}
            <circle cx="44" cy="92" r="8" fill={C.yellow} stroke="#141414" strokeWidth="2" />
            {/* hedef: yük ili (halka) */}
            <circle cx="356" cy="26" r="7" fill="#141414" stroke={C.yellow} strokeWidth="3" />
          </svg>

          {/* başlangıç ili chip'i — gerçek merkez ilin */}
          {originCity && (
            <span
              className="absolute bottom-2.5 left-6 flex items-center gap-1.5 px-2 py-[3px] text-[9px] font-bold uppercase"
              style={{ fontFamily: MONO, color: "#fff", background: "rgba(0,0,0,.6)", border: `1.5px solid ${C.yellow}`, borderRadius: 4, letterSpacing: "0.04em" }}
            >
              <span className="h-[6px] w-[6px] rounded-full" style={{ background: C.yellow }} /> {originCity}
            </span>
          )}

          {/* hedef ili chip'i — en yakın gerçek yükün ili (varsa) */}
          {destCity && (
            <span
              className="absolute right-3 top-8 flex items-center gap-1.5 px-2 py-[3px] text-[9px] font-bold uppercase"
              style={{ fontFamily: MONO, color: "#fff", background: "rgba(0,0,0,.6)", border: "1.5px solid rgba(255,255,255,.55)", borderRadius: 4, letterSpacing: "0.04em" }}
            >
              <span className="h-[6px] w-[6px] rounded-full" style={{ border: `1.5px solid ${C.yellow}` }} /> {destCity}
            </span>
          )}

          {/* orta rozet — gerçek yaklaşık km ya da durum */}
          <span
            className="absolute left-1/2 top-3 -translate-x-1/2 px-2 py-[3px] text-[9px] font-bold uppercase"
            style={{ fontFamily: MONO, color: C.yellow, background: "rgba(0,0,0,.55)", border: `1.5px solid ${C.yellow}`, borderRadius: 4, letterSpacing: "0.04em" }}
          >
            {backhaulKm ? `~${backhaulKm} KM · BOŞ DÖNÜŞ` : backhaulCount > 0 ? `${backhaulCount} UYGUN YÜK` : "BOŞ DÖNÜŞ"}
          </span>
        </div>
        <div className="relative overflow-hidden px-4 py-3.5" style={{ background: C.ink }}>
          <Hazard vertical w={16} className="absolute right-0 top-0" />
          <div className="pr-6">
            <div className="mb-1 text-[16px] font-extrabold uppercase" style={{ color: "#FFFFFF", fontFamily: ARCH, letterSpacing: "-0.01em" }}>
              Boş Dönme — Yolda Yük Al
            </div>
            <div className="mb-3.5 text-[10px] font-bold uppercase" style={{ color: C.muted, fontFamily: MONO }}>
              {backhaulCount > 0 ? `Güzergahında ${backhaulCount} Uygun Dökme Yük` : "Güzergahına uygun yük çıkınca burada listelenir"}
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => nav("/ilanlar?mode=backhaul")}
                className="flex h-[42px] flex-1 items-center justify-center gap-1.5 text-[12.5px] font-extrabold uppercase"
                style={{ background: C.yellow, color: C.ink, border: FRAME, borderRadius: 5, fontFamily: ARCH }}
              >
                Yükleri Gör <ArrowRight size={15} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => nav("/ilanlar?mode=backhaul")}
                aria-label="Harita"
                className="flex h-[42px] w-[42px] items-center justify-center"
                style={{ background: "transparent", border: `2px solid ${C.yellow}`, borderRadius: 5 }}
              >
                <MapPin size={20} strokeWidth={2} style={{ color: C.yellow }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SectionTitle right={<TumuLink nav={nav} />}>Sana Uygun İşler</SectionTitle>
      {suitableJobs.length === 0 ? (
        <button
          onClick={() => nav("/ilanlar")}
          className="mb-6 flex w-full items-center justify-center gap-1.5 px-4 py-5 text-[11px] font-bold uppercase"
          style={{ background: C.card, border: `2px dashed ${C.ink}`, borderRadius: 6, color: C.sub, fontFamily: MONO }}
        >
          Şu an açık iş yok — panoya göz at <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      ) : (
        <div className="mb-6 flex flex-col gap-2.5">
          {suitableJobs.map((l) => {
            const code = "YKL-" + String(l.id).padStart(4, "0").slice(-4);
            const from = (l.il || l.yukleme || "—").toUpperCase();
            const to = (l.varisIl || l.bosaltma || l.ilce || "—").toUpperCase();
            const isHafriyat = l.cat === "hafriyat";
            const amount = l.amount ? `${l.amount}${(l.unit || "T").charAt(0).toUpperCase()}` : "";
            const price = l.priceType === "sabit" && l.price != null
              ? `${amount ? amount + " · " : ""}₺${Number(l.price).toLocaleString("tr-TR")}`
              : `${amount ? amount + " · " : ""}TEKLİF`;
            return (
              <ListingCard
                key={l.id}
                code={code} status="Açık" statusBg={C.yellow} statusFg={C.ink}
                title={l.title} from={from} to={to}
                cat={isHafriyat ? "HAFRİYAT" : "SİLOBAS"} catColor={isHafriyat ? C.yellow : C.ink}
                price={price} owner={l.owner} ownerLogo={l.ownerLogo} ownerVerified={l.ownerVerified}
                onClick={() => nav(`/ilan/${l.id}`)}
              />
            );
          })}
        </div>
      )}

      {backhaulCount > 0 && <BackhaulRow nav={nav} count={backhaulCount} />}
    </>
  );
}

/* ── TEDARİKÇİ gövdesi ──────────────────────────────────────────────── */
// Stok seviyesi → etiket + nokta rengi.
const STOCK_INFO = {
  bol: { label: "STOK BOL", dot: C.green },
  orta: { label: "STOK ORTA", dot: C.yellow },
  az: { label: "STOK AZ", dot: C.red },
};

function TedarikciBody({ nav, seller }) {
  const products = seller?.products || [];
  const demand = seller?.demand || 0;
  return (
    <>
      {/* Gelen talep — gerçek talep varsa özet, yoksa boş-durum */}
      <SectionTitle right={demand > 0 ? <StatusBadge bg={C.green} fg="#FFFFFF">{demand} Yeni</StatusBadge> : null}>Gelen Talep</SectionTitle>
      {demand > 0 ? (
        <div className="relative mb-6 overflow-hidden" style={{ border: FRAME, borderRadius: 6, boxShadow: SHADOW }}>
          <div className="relative overflow-hidden px-4 py-3.5" style={{ background: "#0A0A0A" }}>
            <Hazard vertical w={18} className="absolute right-0 top-0" />
            <div className="pr-7">
              <div className="mb-2.5"><StatusBadge bg={C.green} fg="#FFFFFF">Sipariş Talebi</StatusBadge></div>
              <div className="mb-2 text-[20px] font-black uppercase leading-tight" style={{ color: "#FFFFFF", fontFamily: ARCH, letterSpacing: "-0.02em" }}>
                {demand} Yeni Talep / Teklif
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase" style={{ color: C.yellow, fontFamily: MONO }}>
                <MapPin size={12} strokeWidth={2.5} /> Ürün ilanlarına gelen siparişler
              </div>
            </div>
          </div>
          <div className="px-4 py-3.5" style={{ background: C.card }}>
            <button
              onClick={() => nav("/tekliflerim")}
              className="flex h-[42px] w-full items-center justify-center gap-1.5 text-[12.5px] font-extrabold uppercase"
              style={{ background: C.ink, color: C.yellow, border: FRAME, borderRadius: 5, fontFamily: ARCH }}
            >
              Talepleri Gör <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative mb-6 overflow-hidden" style={{ border: FRAME, borderRadius: 6, boxShadow: SHADOW_SM, background: C.card }}>
          <div className="flex flex-col items-center gap-3 px-5 py-7 text-center">
            <div className="flex h-12 w-12 items-center justify-center" style={{ border: `2px dashed ${C.ink}`, borderRadius: 8, background: C.stone }}>
              <Truck size={24} strokeWidth={2} style={{ color: C.ink }} />
            </div>
            <div>
              <div className="text-[15px] font-extrabold uppercase leading-tight" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>Henüz talep yok</div>
              <div className="mt-1.5 text-[10.5px] font-bold uppercase leading-snug" style={{ color: C.sub, fontFamily: MONO }}>
                Ürün ekledikçe alıcılar sana ulaşır
              </div>
            </div>
          </div>
        </div>
      )}

      <YellowCTA nav={nav} eyebrow="STOKTAN SAT" title="Ürün İlanı Aç" action="İlan Ver" to="/ilan-ver" />

      <SectionTitle right={products.length > 0 ? <button onClick={() => nav("/ilanlarim")} className="text-[10px] font-bold uppercase" style={{ color: C.ink, fontFamily: MONO, textDecoration: "underline" }}>Düzenle</button> : null}>
        Ürün Kataloğum
      </SectionTitle>
      {products.length === 0 ? (
        <button
          onClick={() => nav("/ilan-ver")}
          className="mb-6 flex w-full items-center justify-center gap-1.5 px-4 py-5 text-[11px] font-bold uppercase"
          style={{ background: C.card, border: `2px dashed ${C.ink}`, borderRadius: 6, color: C.sub, fontFamily: MONO }}
        >
          Henüz ürün yok — ilk ürününü ekle <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      ) : (
        <div className="mb-6 flex flex-col gap-2.5">
          {products.map((p) => {
            const st = STOCK_INFO[p.stock] || { label: p.material || "ÜRÜN", dot: C.faint };
            const price = p.priceType === "sabit" && p.price != null ? `₺${Number(p.price).toLocaleString("tr-TR")}` : "TEKLİF";
            return (
              <button
                key={p.id}
                onClick={() => nav(`/ilan/${p.id}`)}
                className="flex w-full items-center gap-3 p-3 text-left"
                style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: SHADOW_SM }}
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center" style={{ border: FRAME, borderRadius: 6, background: C.stone }}>
                  <Package size={22} strokeWidth={2} style={{ color: C.ink }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>{p.material || p.title}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: st.dot }} />
                    <span className="truncate text-[9.5px] font-bold uppercase" style={{ color: C.sub, fontFamily: MONO }}>{st.label}{p.il ? ` · ${p.il}` : ""}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.ink }}>{price}</div>
                  {p.priceType === "sabit" && <div className="text-[8px] font-bold uppercase" style={{ color: C.muted, fontFamily: MONO }}>/ {p.unit || "TON"}</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ── Son ilanlar (müteahhit) — DB'deki gerçek son iş ilanları ────────── */
function RecentListings({ nav, jobs = [] }) {
  return (
    <>
      <SectionTitle right={<TumuLink nav={nav} />}>Son İlanlar</SectionTitle>
      {jobs.length === 0 ? (
        <button
          onClick={() => nav("/ilanlar")}
          className="mb-6 flex w-full items-center justify-center gap-1.5 px-4 py-5 text-[11px] font-bold uppercase"
          style={{ background: C.card, border: `2px dashed ${C.ink}`, borderRadius: 6, color: C.sub, fontFamily: MONO }}
        >
          Henüz ilan yok — panoya göz at <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      ) : (
        <div className="mb-6 flex flex-col gap-2.5">
          {jobs.map((l) => {
            const code = "YKL-" + String(l.id).padStart(4, "0").slice(-4);
            const from = (l.il || l.yukleme || "—").toUpperCase();
            const to = (l.varisIl || l.bosaltma || l.ilce || "—").toUpperCase();
            const isHafriyat = l.cat === "hafriyat";
            const amount = l.amount ? `${l.amount}${(l.unit || "T").charAt(0).toUpperCase()}` : "";
            const price = l.priceType === "sabit" && l.price != null
              ? `${amount ? amount + " · " : ""}₺${Number(l.price).toLocaleString("tr-TR")}`
              : `${amount ? amount + " · " : ""}TEKLİF`;
            return (
              <ListingCard
                key={l.id}
                code={code} status="Açık" statusBg={C.yellow} statusFg={C.ink}
                title={l.title}
                from={from} to={to}
                cat={isHafriyat ? "HAFRİYAT" : "SİLOBAS"}
                catColor={isHafriyat ? C.yellow : C.ink}
                price={price}
                owner={l.owner} ownerLogo={l.ownerLogo} ownerVerified={l.ownerVerified}
                onClick={() => nav(`/ilan/${l.id}`)}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

// "Tümü →" mono underline link
function TumuLink({ nav }) {
  return (
    <button
      onClick={() => nav("/ilanlar")}
      className="flex items-center gap-0.5 text-[10px] font-bold uppercase"
      style={{ color: C.ink, fontFamily: MONO, textDecoration: "underline" }}
    >
      Tümü <ChevronRight size={13} strokeWidth={2.5} />
    </button>
  );
}

/* ── Ana bileşen ────────────────────────────────────────────────────── */
// ── Piyasa Nabzı mini widget: bu dönem öne çıkan güzergah + ₺/ton-km ──
const fmtRate = (r) => "₺" + Number(r).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function PiyasaWidget({ nav }) {
  const pulse = useMemo(() => marketPulse({ listings: [...loadListings(), ...LISTINGS], offers: loadOffers() }), []);
  const lane = pulse.lanes[0];
  const cat = pulse.byCat.hafriyat || pulse.byCat.silobas;
  if (!lane && !cat) return null;
  return (
    <button
      onClick={() => nav("/piyasa")}
      className="relative mb-6 flex w-full items-center gap-3 overflow-hidden p-3 text-left"
      style={{ background: C.ink, border: FRAME, borderRadius: 6, boxShadow: SHADOW_SM }}
    >
      <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center" style={{ border: `2px solid ${C.yellow}`, borderRadius: 6 }}>
        <Activity size={20} color={C.yellow} strokeWidth={2.4} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: "0.04em" }}>
          <TrendingUp size={11} color={C.yellow} /> Piyasa Nabzı
        </div>
        {lane ? (
          <div className="mt-1 truncate text-[13px] font-extrabold uppercase" style={{ color: "#FFFFFF", fontFamily: ARCH, letterSpacing: "-0.01em" }}>
            {lane.from} → {lane.to} · {fmtRate(lane.rate)}<span style={{ color: C.muted }}>/tkm</span>
          </div>
        ) : (
          <div className="mt-1 text-[13px] font-extrabold uppercase" style={{ color: "#FFFFFF", fontFamily: ARCH, letterSpacing: "-0.01em" }}>
            Ortalama {fmtRate(cat.rate)}<span style={{ color: C.muted }}>/tkm</span>
          </div>
        )}
      </div>
      <ChevronRight size={18} color={C.yellow} className="flex-shrink-0" />
      <Hazard vertical w={7} className="absolute right-0 top-0" />
    </button>
  );
}

export default function NakliyeHome({
  user, listings = [], offers = [], pendingOffersCount = 0, notifUnread = 0, onLoginClick, announcement,
}) {
  const navigate = useNavigate();
  const [annDismissed, setAnnDismissed] = useState(false);
  const ann = announcement?.active && announcement?.text && !annDismissed ? announcement : null;
  const annStyle = ann ? ({
    promo: { bg: C.ink, fg: C.yellow, mark: "★" },
    info: { bg: C.yellow, fg: C.ink, mark: "i" },
    warn: { bg: C.red, fg: "#fff", mark: "!" },
  }[ann.tone] || { bg: C.ink, fg: C.yellow, mark: "★" }) : null;
  // Gerçek rol id'si "isveren" — bu sayfanın içsel anahtarı "muteahhit". Eşle.
  const role = (user?.role === "isveren" ? "muteahhit" : user?.role) || "muteahhit";

  // ── Alıcı (müteahhit) için gerçek veri türetimleri ──
  // myListings: kullanıcının açtığı ilanlar. Aktif iş: eşleşmiş > en yeni aktif.
  const buyer = useMemo(() => {
    if (!user) return { mine: [], active: null, activeCount: 0, done: 0, offersOnMine: 0 };
    const mine = listings.filter((l) => String(l.ownerId) === String(user.id));
    const isJobs = mine.filter((l) => l.type === "is");
    // Aktif iş: önce eşleşmiş/yolda olan, yoksa en son açılan aktif ilan.
    const active =
      isJobs.find((l) => l.status === "eslesti" || l.phase) ||
      isJobs.find((l) => l.status === "aktif") ||
      null;
    const activeCount = mine.filter((l) => l.status === "aktif" || l.status === "eslesti").length;
    const done = mine.filter((l) => l.status === "kapali").length;
    // Kullanıcının ilanlarına gelen toplam teklif sayısı.
    const mineIds = new Set(mine.map((l) => String(l.id)));
    const offersOnMine = offers.filter((o) => mineIds.has(String(o.listingId))).length;
    return { mine, active, activeCount, done, offersOnMine };
  }, [user, listings, offers]);

  // Son ilanlar: en yeni iş ilanları (kendi ilanların hariç değil — piyasa görünümü).
  const recentJobs = useMemo(
    () => listings.filter((l) => l.type === "is" && l.status === "aktif").slice(0, 3),
    [listings]
  );

  // ── Satıcı (tedarikçi) için gerçek veri türetimleri ──
  const seller = useMemo(() => {
    if (!user) return { products: [], live: 0, demand: 0, done: 0 };
    const mine = listings.filter((l) => String(l.ownerId) === String(user.id));
    const products = mine.filter((l) => l.type === "urun");
    const live = products.filter((l) => l.status === "aktif").length;
    const done = mine.filter((l) => l.status === "kapali" || l.delivered).length;
    // Gelen talep: ürün ilanlarına gelen teklif/sipariş sayısı.
    const myIds = new Set(mine.map((l) => String(l.id)));
    const demand = offers.filter((o) => myIds.has(String(o.listingId))).length;
    return { products: products.slice(0, 4), live, demand, done };
  }, [user, listings, offers]);

  // ── Nakliyeci için gerçek veri türetimleri ──
  const carrier = useMemo(() => {
    if (!user) return { suitableJobs: [], openOffers: 0, won: 0, backhaulCount: 0 };
    // Verdiğim teklifler (açık + kazanılan).
    const myOffers = offers.filter((o) => String(o.fromUserId) === String(user.id));
    const openOffers = myOffers.filter((o) => o.status === "beklemede").length;
    const won = myOffers.filter((o) => o.status === "kabul").length;
    // Sana uygun işler: açık iş ilanları (başkalarının), en yeni 2.
    const suitableJobs = listings
      .filter((l) => l.type === "is" && l.status === "aktif" && String(l.ownerId) !== String(user.id))
      .slice(0, 2);
    // Dönüş yükü: kullanıcının ilinden çıkan uygun yükler (gerçek eşleşme).
    const city = user.sehir || user.il || "";
    const nearLoads = city ? loadsNearCity(city, listings, { limit: 20 }) : [];
    const backhaulCount = nearLoads.length;
    // En yakın uygun yükün ili → karttaki gerçek güzergah ucu + yaklaşık km.
    const near = nearLoads[0] || null;
    const backhaulTo = near ? (near.fromIl || near.toIl) : null;
    const backhaulKm =
      city && backhaulTo && IL_COORDS[city] && IL_COORDS[backhaulTo]
        ? haversineKm(IL_COORDS[city], IL_COORDS[backhaulTo])
        : null;
    return { suitableJobs, openOffers, won, backhaulCount, backhaulCity: city, backhaulTo, backhaulKm };
  }, [user, listings, offers]);

  // istatistik şeridi (rol başına 3 kutu) — alıcı gerçek veriye bağlı.
  const STAT = {
    muteahhit: [
      { value: user ? String(buyer.activeCount) : "—", label: "Aktif İlan" },
      { value: user ? String(pendingOffersCount || buyer.offersOnMine) : "—", label: "Gelen Teklif", dot: (pendingOffersCount || buyer.offersOnMine) > 0 },
      { value: user ? String(buyer.done) : "—", label: "Tamamlanan" },
    ],
    nakliyeci: [
      { value: user ? String(carrier.openOffers) : "—", label: "Açık Teklif" },
      { value: user ? String(carrier.won) : "—", label: "Kazanılan", dot: carrier.won > 0 },
      { value: user ? String(carrier.backhaulCount) : "—", label: "Dönüş Yükü" },
    ],
    tedarikci: [
      { value: user ? String(seller.live) : "—", label: "Yayında Ürün" },
      { value: user ? String(seller.demand) : "—", label: "Gelen Talep", dot: seller.demand > 0 },
      { value: user ? String(seller.done) : "—", label: "Tamamlanan" },
    ],
  }[role];

  const name = user?.name || (role === "nakliyeci" ? "Demir Nakliyat" : role === "tedarikci" ? "Aliağa Mıcır" : "Yıldızlar İnşaat");
  // Gerçek konum (profil) — yoksa gösterme (sabit placeholder yerine).
  const place = user
    ? [user.ilce, user.sehir || user.il].filter(Boolean).join(" · ").toLocaleUpperCase("tr-TR")
    : "";

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col pb-24" style={{ background: C.bg, color: C.ink }}>
      <SEO title="Ana Sayfa" description="Hafriyat ve silobas iş ilanları. Sabit fiyatını yaz, nakliyeci doğrudan kabul etsin — komisyonsuz eşleş." />

      {/* üst hazard şeridi */}
      <Hazard h={8} />

      <Header
        name={name}
        role={role}
        place={place}
        unread={notifUnread}
        onBell={() => navigate("/bildirimler")}
        onProfile={() => navigate("/profil")}
        onSearch={() => navigate("/ilanlar")}
      />

      {/* duyuru / kampanya bandı (admin yönetir) */}
      {ann && (
        <div className="px-[18px] pt-3">
          <div className="relative flex items-center gap-2.5 overflow-hidden" style={{ background: annStyle.bg, border: FRAME, borderRadius: 6, padding: "10px 12px", boxShadow: SHADOW_SM }}>
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-[13px] font-black" style={{ background: annStyle.fg, color: annStyle.bg, borderRadius: 5, fontFamily: ARCH }}>{annStyle.mark}</span>
            <span className="min-w-0 flex-1 text-[12px] font-bold leading-snug" style={{ color: annStyle.fg, fontFamily: MONO }}>{ann.text}</span>
            <button onClick={() => setAnnDismissed(true)} aria-label="Kapat" className="flex-shrink-0 px-1 text-[16px] font-black leading-none" style={{ color: annStyle.fg, opacity: 0.7 }}>×</button>
          </div>
        </div>
      )}

      {/* stat şeridi: 3 kutu grid */}
      <div className="px-[18px] pt-4">
        <div className="grid grid-cols-3 gap-2.5">
          {STAT.map((s) => (
            <StatBox key={s.label} {...s} />
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-[18px] pt-6"
      >
        {/* Piyasa Nabzı — sistem henüz buna uygun değil, gizlendi (geri açmak için yorumu kaldır) */}
        {/* <PiyasaWidget nav={navigate} /> */}

        {role === "nakliyeci" ? (
          <NakliyeciStateful navigate={navigate} carrier={carrier} />
        ) : role === "tedarikci" ? (
          <TedarikciBody nav={navigate} seller={seller} />
        ) : (
          <MuteahhitBody nav={navigate} user={user} active={buyer.active} offersOnMine={buyer.offersOnMine} recentJobs={recentJobs} />
        )}

        {/* güven şeridi */}
        <TrustStrip />

        {/* GİRİŞ YAPMAMIŞ KULLANICI CTA */}
        {!user && (
          <div className="relative mb-2 overflow-hidden" style={{ background: C.ink, border: FRAME, borderRadius: 6, boxShadow: SHADOW }}>
            <Hazard vertical w={16} className="absolute right-0 top-0" />
            <div className="flex items-center justify-between py-3.5 pl-4 pr-7">
              <div>
                <div className="text-[14px] font-extrabold uppercase" style={{ color: "#FFFFFF", fontFamily: ARCH, letterSpacing: "-0.01em" }}>Ücretsiz Hesap Aç</div>
                <div className="mt-0.5 text-[9.5px] font-bold uppercase" style={{ color: C.muted, fontFamily: MONO }}>İlan Ver · Doğrudan Eşleş · Komisyon Yok</div>
              </div>
              <button
                onClick={() => onLoginClick?.()}
                className="flex-shrink-0 px-3.5 py-2.5 text-[11px] font-extrabold uppercase"
                style={{ background: C.yellow, color: C.ink, border: FRAME, borderRadius: 5, fontFamily: ARCH }}
              >
                Giriş
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* alt hazard şeridi */}
      <Hazard h={8} className="mt-2" />
    </div>
  );
}

/* müsaitlik state'i için ince sarmalayıcı (hook kuralları) */
function NakliyeciStateful({ navigate, carrier }) {
  const [available, setAvailable] = useState(true);
  return <NakliyeciBody nav={navigate} available={available} setAvailable={setAvailable} carrier={carrier} />;
}
