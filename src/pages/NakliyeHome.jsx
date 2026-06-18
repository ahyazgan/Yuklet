// HamTed — Ana Sayfa (Zengin · Kurumsal yön)
// Figma/önizleme tasarımından React/Tailwind uyarlaması.
// Marka dili: antrasit header + hazard sarısı aksan + manila zemin (mavi yok).
// Alt tab bar App.jsx'teki global <MobileTabBar> tarafından sağlanır (burada YOK).
//
// Prop sözleşmesi mevcut NakliyeHome ile aynıdır; doğrudan değiştirilebilir.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell, Search, SlidersHorizontal, MapPin, RefreshCw, Truck,
  Package, Star, ArrowRight, MessageSquare, BadgeCheck,
} from "lucide-react";
import SEO from "../components/SEO";

/* ── HamTed marka paleti (tek doğruluk kaynağı: DESIGN.md) ───────────── */
const C = {
  ink: "#0A0A0A",        // siyah / başlık / birincil
  header: "#1C1A17",     // antrasit header alanı
  yellow: "#FACC15",     // hazard sarısı — yalnızca aksiyon/aksan
  yellowDeep: "#E0B400",
  green: "#16803C",      // aktif / onay / para
  red: "#DC2626",        // acil / bildirim
  bg: "#E4DED2",         // manila gövde zemini
  card: "#FAF9F6",       // kırık beyaz kart
  stone: "#EFEBE2",      // nötr dolgu
  border: "#D6CEBD",     // kart kenarlığı
  line: "#EAE5DB",       // ince ayraç
  sub: "#5A5852",        // ikincil metin
  muted: "#9A968D",      // header üstü soluk metin
  faint: "#A8A39A",      // pasif ikon
};

const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";

/* Rol -> içerik haritası. Tasarımdaki üç varyant tek bileşende. */
const ROLE = {
  muteahhit: { badge: "MÜTEAHHİT", place: "📍 Ümraniye, İstanbul" },
  nakliyeci: { badge: "NAKLİYECİ", place: "Silobas 30t · Bursa" },
  tedarikci: { badge: "TEDARİKÇİ", place: "📍 Aliağa, İzmir" },
};

/* ── Küçük yardımcı bileşenler ──────────────────────────────────────── */

function SectionTitle({ children, right }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="flex items-center gap-2.5 text-[16px] font-extrabold tracking-tight" style={{ color: C.ink }}>
        <span className="inline-block h-[15px] w-1 rounded-sm" style={{ background: C.yellow }} />
        {children}
      </span>
      {right}
    </div>
  );
}

function Stat({ value, label, money, dot }) {
  return (
    <div className="relative flex-1 px-2.5 py-3.5 text-center">
      <div className="leading-none" style={{ fontFamily: MONO, fontSize: 23, fontWeight: 700, color: money ? C.green : C.ink }}>
        {value}
      </div>
      <div className="mt-[5px] text-[10px] font-semibold" style={{ color: C.sub }}>{label}</div>
      {dot && (
        <span className="absolute right-3.5 top-2.5 h-[7px] w-[7px] rounded-full"
          style={{ background: C.yellow, boxShadow: "0 0 0 3px rgba(250,204,21,.30)" }} />
      )}
    </div>
  );
}

function Avatar({ text, dark }) {
  return (
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-[15px] font-bold"
      style={{ background: dark ? "linear-gradient(145deg,#3A3733,#22201C)" : C.stone, color: dark ? "#FAF9F6" : C.sub }}>
      {text}
    </div>
  );
}

/* ── ÜST: antrasit header (logo + rol + bildirim + arama) ───────────── */
function Header({ name, role, unread, onBell, onSearch }) {
  const r = ROLE[role] || ROLE.muteahhit;
  return (
    <div className="relative overflow-hidden px-5 pb-[70px] pt-1" style={{ background: C.header }}>
      {/* topo doku */}
      <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" style={{ opacity: 0.1 }}>
        <path d="M-20 60 Q 100 30 200 70 T 420 60" stroke={C.yellow} strokeWidth="1.5" fill="none" />
        <path d="M-20 95 Q 110 60 220 100 T 420 95" stroke={C.yellow} strokeWidth="1.5" fill="none" />
        <path d="M-20 130 Q 90 100 210 140 T 420 130" stroke={C.yellow} strokeWidth="1.5" fill="none" />
      </svg>

      <div className="relative">
        <div className="mb-5 flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl text-[21px] font-black"
              style={{ background: C.yellow, color: C.ink }}>H</div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] font-extrabold tracking-tight" style={{ color: "#FAF9F6" }}>{name}</span>
                <BadgeCheck size={15} style={{ color: C.green }} fill={C.green} stroke="#FAF9F6" />
              </div>
              <div className="mt-[3px] flex items-center gap-1.5">
                <span className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider" style={{ background: C.yellow, color: C.ink }}>{r.badge}</span>
                <span className="text-[11px] font-medium" style={{ color: C.muted }}>{r.place}</span>
              </div>
            </div>
          </div>
          <button onClick={onBell} aria-label="Bildirimler"
            className="relative flex h-[42px] w-[42px] items-center justify-center rounded-xl"
            style={{ background: "rgba(255,255,255,.10)" }}>
            <Bell size={20} style={{ color: "#C9C7C0" }} />
            {unread > 0 && (
              <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-extrabold text-white"
                style={{ background: C.red, border: `2px solid ${C.header}` }}>{unread}</span>
            )}
          </button>
        </div>

        <button onClick={onSearch}
          className="flex h-[50px] w-full items-center gap-2.5 rounded-2xl px-4"
          style={{ background: "rgba(255,255,255,.97)", boxShadow: "0 6px 16px -8px rgba(0,0,0,.4)" }}>
          <Search size={18} style={{ color: C.sub }} />
          <span className="flex-1 text-left text-[13.5px] font-medium" style={{ color: C.sub }}>İl, malzeme veya güzergah ara</span>
          <SlidersHorizontal size={18} style={{ color: C.ink }} />
        </button>
      </div>
    </div>
  );
}

/* ── MÜTEAHHİT: aktif proje + gelen teklifler ───────────────────────── */
function MuteahhitBody({ nav }) {
  return (
    <>
      <SectionTitle right={<span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: C.green }}><span className="h-[7px] w-[7px] rounded-full" style={{ background: C.green }} />Devam ediyor</span>}>
        Aktif projem
      </SectionTitle>

      <div className="mb-6 overflow-hidden rounded-[20px]" style={{ boxShadow: "0 14px 34px -16px rgba(16,42,67,.35)" }}>
        <div className="relative h-[120px] overflow-hidden" style={{ background: "linear-gradient(135deg,#2A2722 0%,#1A1815 100%)" }}>
          <Truck size={54} className="absolute right-4 top-3.5" style={{ color: "#FAF9F6", opacity: 0.34 }} />
          <div className="absolute left-4 top-3.5 flex gap-1.5">
            <span className="rounded-md px-2.5 py-1 text-[9.5px] font-extrabold tracking-wide" style={{ background: C.ink, color: C.yellow }}>HAFRİYAT</span>
            <span className="rounded-md px-2.5 py-1 text-[9.5px] font-bold" style={{ background: "rgba(0,0,0,.28)", color: "#FAF9F6" }}>5 GÜN · GÜNDE ~20 SEFER</span>
          </div>
          <div className="absolute inset-x-4 bottom-3.5 text-[18px] font-extrabold tracking-tight" style={{ color: "#FAF9F6" }}>
            Dudullu şantiye hafriyat taşıma
          </div>
        </div>
        <div className="px-4 pb-4 pt-3.5" style={{ background: C.card }}>
          <div className="mb-3.5 flex items-center gap-2.5 text-[12.5px] font-semibold" style={{ color: C.sub }}>
            <span className="h-2 w-2 rounded-full" style={{ background: C.yellow }} />Dudullu OSB
            <span className="h-0 flex-1" style={{ borderTop: `1.5px dashed ${C.border}` }} />
            <ArrowRight size={16} style={{ color: C.faint }} />
            <span className="h-0 flex-1" style={{ borderTop: `1.5px dashed ${C.border}` }} />
            Samandıra<span className="h-2 w-2 rounded-full" style={{ border: `2px solid ${C.faint}` }} />
          </div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11.5px] font-semibold" style={{ color: C.sub }}>Sefer ilerlemesi</span>
            <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: C.ink }}>47 / 100 sefer</span>
          </div>
          <div className="mb-3.5 h-2 overflow-hidden rounded-md" style={{ background: C.stone }}>
            <div className="h-full rounded-md" style={{ width: "47%", background: `linear-gradient(90deg,${C.yellow},${C.yellowDeep})` }} />
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => nav("/ilanlarim")} className="flex h-11 flex-1 items-center justify-center rounded-xl text-[13px] font-bold text-white" style={{ background: C.ink }}>İlanı yönet</button>
            <button onClick={() => nav("/mesajlar")} className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: C.stone, border: `1px solid ${C.border}` }}>
              <MessageSquare size={20} style={{ color: C.ink }} />
            </button>
          </div>
        </div>
      </div>

      <SectionTitle right={<span className="rounded-full px-2.5 py-[3px] text-[11.5px] font-bold" style={{ background: C.yellow, color: C.ink }}>17 yeni</span>}>
        Gelen teklifler
      </SectionTitle>
      <div className="mb-6 flex flex-col gap-2.5">
        <div className="rounded-2xl p-3.5" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 4px 14px -8px rgba(16,42,67,.18)" }}>
          <div className="mb-3 flex items-center gap-2.5">
            <Avatar text="DN" dark />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-bold" style={{ color: C.ink }}>Demir Nakliyat</span>
                <BadgeCheck size={13} style={{ color: C.green }} fill={C.green} stroke="#FAF9F6" />
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Star size={12} fill={C.yellow} stroke="none" />
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.sub }}>4.8</span>
                <span className="text-[11px] font-medium" style={{ color: C.sub }}>· Silobas 30t · 142 sefer</span>
              </div>
            </div>
            <div className="text-right">
              <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: C.ink }}>₺128.000</div>
              <div className="mt-px text-[10px] font-bold" style={{ color: C.green }}>En düşük</div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button className="flex h-10 flex-1 items-center justify-center rounded-[10px] text-[12.5px] font-bold text-white" style={{ background: C.green }}>Kabul et</button>
            <button className="flex h-10 flex-1 items-center justify-center rounded-[10px] text-[12.5px] font-bold" style={{ background: C.stone, border: `1px solid ${C.border}`, color: C.sub }}>Mesaj</button>
          </div>
        </div>

        <button className="flex items-center gap-2.5 rounded-2xl p-3.5 text-left" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <Avatar text="MK" />
          <div className="flex-1">
            <div className="text-[13.5px] font-bold" style={{ color: C.ink }}>Murat K.</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Star size={11} fill={C.yellow} stroke="none" />
              <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.sub }}>4.9</span>
              <span className="text-[10.5px] font-medium" style={{ color: C.sub }}>· Damperli 18t</span>
            </div>
          </div>
          <div className="text-right">
            <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.ink }}>₺134.500</div>
            <div className="mt-px text-[11.5px] font-bold" style={{ color: C.ink }}>İncele →</div>
          </div>
        </button>
      </div>

      <BackhaulPromo nav={nav} />
      <NewListingCategories nav={nav} />
    </>
  );
}

/* ── NAKLİYECİ: haritalı dönüş yükü + sana uygun işler ──────────────── */
function NakliyeciBody({ nav, available, setAvailable }) {
  return (
    <>
      {/* müsaitlik anahtarı */}
      <div className="mb-5 flex items-center gap-2.5 rounded-2xl p-3.5" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 4px 14px -8px rgba(16,42,67,.18)" }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: available ? C.green : C.faint, boxShadow: available ? "0 0 0 4px rgba(22,128,60,.16)" : "none" }} />
        <div className="flex-1">
          <span className="text-[13.5px] font-bold" style={{ color: C.ink }}>Aracım müsait</span>
          <span className="text-[11.5px] font-medium" style={{ color: C.sub }}> · iş teklifi al</span>
        </div>
        <button onClick={() => setAvailable((v) => !v)} className="relative h-7 w-[46px] rounded-full transition-colors" style={{ background: available ? C.green : C.faint }} aria-label="Müsaitlik">
          <span className="absolute top-[3px] h-[22px] w-[22px] rounded-full transition-all" style={{ background: C.card, right: available ? 3 : 21 }} />
        </button>
      </div>

      <SectionTitle right={<span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: C.green }}><span className="h-[7px] w-[7px] rounded-full" style={{ background: C.green }} />3 eşleşme</span>}>
        Dönüş yükü
      </SectionTitle>
      <div className="mb-6 overflow-hidden rounded-[20px]" style={{ background: C.ink, boxShadow: "0 14px 34px -16px rgba(12,58,46,.5)" }}>
        <div className="relative h-[120px] overflow-hidden" style={{ background: "#141414" }}>
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(#262626 1px,transparent 1px),linear-gradient(90deg,#262626 1px,transparent 1px)", backgroundSize: "26px 26px", opacity: 0.6 }} />
          <svg viewBox="0 0 392 120" className="absolute inset-0 h-full w-full">
            <path d="M44 92 C 130 92, 160 40, 240 46 S 340 36, 356 26" stroke={C.yellow} strokeWidth="2.5" fill="none" strokeDasharray="2 7" strokeLinecap="round" />
            <circle cx="44" cy="92" r="7" fill={C.yellow} />
            <circle cx="356" cy="26" r="7" fill="none" stroke={C.yellow} strokeWidth="2.5" />
            <circle cx="240" cy="46" r="5" fill={C.yellow} />
          </svg>
          <span className="absolute bottom-3.5 left-9 text-[9.5px] font-bold" style={{ fontFamily: MONO, color: C.muted }}>BURSA</span>
          <span className="absolute right-6 top-9 text-[9.5px] font-bold" style={{ fontFamily: MONO, color: C.muted }}>İSTANBUL</span>
          <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-md px-2 py-[3px] text-[9px] font-bold" style={{ fontFamily: MONO, color: C.yellow, background: "rgba(0,0,0,.35)" }}>412 KM · BOŞ DÖNÜŞ</span>
        </div>
        <div className="px-4 pb-4 pt-3.5">
          <div className="mb-1 text-[16px] font-extrabold" style={{ color: "#FAF9F6" }}>Boş dönme — yolda yük al</div>
          <div className="mb-3.5 text-[12.5px] font-medium" style={{ color: "#C9C7C0" }}>
            Güzergahında <strong style={{ color: C.yellow }}>3 uygun dökme yük</strong> · en yakın 12 km sapma
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => nav("/ilanlar?mode=backhaul")} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-extrabold" style={{ background: C.yellow, color: C.ink }}>
              Yükleri gör <ArrowRight size={15} />
            </button>
            <button onClick={() => nav("/ilanlar?mode=backhaul")} className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,.12)" }} aria-label="Harita">
              <MapPin size={20} style={{ color: "#C9C7C0" }} />
            </button>
          </div>
        </div>
      </div>

      <SectionTitle right={<button onClick={() => nav("/ilanlar")} className="text-[12px] font-bold" style={{ color: C.ink }}>Tümü</button>}>
        Sana uygun işler
      </SectionTitle>
      <div className="mb-6 flex flex-col gap-2.5">
        <div className="rounded-2xl p-3.5" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 4px 14px -8px rgba(16,42,67,.18)" }}>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="rounded-md px-2 py-[3px] text-[9.5px] font-bold tracking-wide" style={{ background: C.stone, color: C.ink }}>SİLOBAS · SANA UYGUN</span>
            <span className="text-[10px]" style={{ fontFamily: MONO, color: C.sub }}>5 sa önce</span>
          </div>
          <div className="mb-2.5 text-[14.5px] font-bold" style={{ color: C.ink }}>Fabrikadan şantiyeye dökme çimento</div>
          <div className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: C.sub }}>
            <span className="h-2 w-2 rounded-full" style={{ background: C.ink }} />Gebze
            <span className="h-0 flex-1" style={{ borderTop: `1.5px dashed ${C.border}` }} />Çayırova
            <span className="h-2 w-2 rounded-full" style={{ border: `2px solid ${C.faint}` }} />
          </div>
          <div className="flex items-center justify-between pt-2.5" style={{ borderTop: `1px solid ${C.line}` }}>
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.ink }}>28 ton · ₺4.500</span>
            <button onClick={() => nav("/ilanlar")} className="rounded-[10px] px-3.5 py-[7px] text-[12px] font-bold text-white" style={{ background: C.ink }}>Teklif ver</button>
          </div>
        </div>

        <button onClick={() => nav("/ilanlar")} className="flex items-center gap-3 rounded-2xl p-3.5 text-left" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl" style={{ background: C.stone }}>
            <Package size={22} style={{ color: C.ink }} />
          </div>
          <div className="flex-1">
            <div className="text-[13.5px] font-bold" style={{ color: C.ink }}>Limandan fabrikaya dökme mıcır</div>
            <div className="mt-0.5 text-[11.5px] font-medium" style={{ color: C.sub }}>Aliağa → Kemalpaşa · İzmir</div>
          </div>
          <div className="text-right">
            <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.ink }}>120 t</div>
            <div className="mt-px text-[11.5px] font-bold" style={{ color: C.ink }}>Teklif →</div>
          </div>
        </button>
      </div>
    </>
  );
}

/* ── TEDARİKÇİ: büyük talep + nakliye eşleştirme + katalog ──────────── */
function TedarikciBody({ nav }) {
  return (
    <>
      <SectionTitle right={<span className="rounded-full px-2.5 py-[3px] text-[11.5px] font-bold text-white" style={{ background: C.green }}>11 yeni</span>}>
        Gelen talep
      </SectionTitle>
      <div className="mb-6 overflow-hidden rounded-[20px]" style={{ background: C.ink, boxShadow: "0 14px 34px -16px rgba(12,58,46,.5)" }}>
        <div className="relative h-[120px] overflow-hidden" style={{ background: "linear-gradient(135deg,#16803C 0%,#0f5f2c 100%)" }}>
          <Package size={50} className="absolute right-4 top-3.5" style={{ color: "#FAF9F6", opacity: 0.9 }} />
          <div className="absolute left-4 top-3.5">
            <span className="rounded-md px-2.5 py-1 text-[9.5px] font-extrabold tracking-wide" style={{ background: "rgba(255,255,255,.92)", color: "#0f5f2c" }}>BÜYÜK SİPARİŞ</span>
          </div>
          <div className="absolute inset-x-4 bottom-3.5 text-[18px] font-extrabold tracking-tight" style={{ color: "#FAF9F6", textShadow: "0 1px 4px rgba(0,0,0,.3)" }}>
            120 ton mıcır talebi
          </div>
        </div>
        <div className="px-4 pb-4 pt-3.5">
          <div className="mb-3.5 flex items-center gap-2.5 text-[12.5px] font-semibold" style={{ color: "#C9C7C0" }}>
            <MapPin size={15} style={{ color: C.yellow }} />Kemalpaşa sanayi · 18 km · Mehmet Yapı
          </div>
          <div className="mb-3.5 flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: "rgba(250,204,21,.12)", border: "1px solid rgba(250,204,21,.3)" }}>
            <Truck size={22} style={{ color: C.yellow }} />
            <div className="flex-1">
              <div className="text-[12px] font-bold" style={{ color: "#FAF9F6" }}>Nakliye eşleştirme hazır</div>
              <div className="text-[11px] font-medium" style={{ color: "#C9C7C0" }}>Teslimat için 5 nakliyeci uygun</div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => nav("/ilan-ver")} className="flex h-11 flex-1 items-center justify-center rounded-xl text-[13px] font-extrabold" style={{ background: C.yellow, color: C.ink }}>Teklif gönder</button>
            <button onClick={() => nav("/ilanlar")} className="flex h-11 flex-1 items-center justify-center rounded-xl text-[13px] font-bold" style={{ background: "rgba(255,255,255,.12)", color: "#FAF9F6" }}>Nakliyeci bul</button>
          </div>
        </div>
      </div>

      <SectionTitle right={<button onClick={() => nav("/ilanlarim")} className="text-[12px] font-bold" style={{ color: C.ink }}>Düzenle</button>}>
        Ürün kataloğum
      </SectionTitle>
      <div className="mb-6 flex flex-col gap-2.5">
        {[
          { t: "Mıcır (16–32 mm)", s: "Stok bol · agrega", dot: C.green, p: "₺480" },
          { t: "Kum (0–3 mm)", s: "Stok orta · yıkanmış", dot: C.yellow, p: "₺350" },
        ].map((p) => (
          <div key={p.t} className="flex items-center gap-3 rounded-2xl p-3.5" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 4px 14px -8px rgba(16,42,67,.18)" }}>
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: C.stone }}>
              <Package size={23} style={{ color: C.ink }} />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-bold" style={{ color: C.ink }}>{p.t}</div>
              <div className="mt-[3px] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.dot }} />
                <span className="text-[11px] font-medium" style={{ color: C.sub }}>{p.s}</span>
              </div>
            </div>
            <div className="text-right">
              <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.ink }}>{p.p}</div>
              <div className="text-[10px] font-medium" style={{ color: C.sub }}>/ ton</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Ortak alt bloklar ──────────────────────────────────────────────── */
function BackhaulPromo({ nav }) {
  return (
    <div className="mb-6 overflow-hidden rounded-[18px]" style={{ background: C.ink }}>
      <div className="px-4 pb-3.5 pt-3.5">
        <div className="mb-3 flex items-center gap-1.5">
          <RefreshCw size={15} style={{ color: C.yellow }} />
          <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: C.yellow }}>Dönüş yükü fırsatı</span>
        </div>
        <div className="mb-1 text-[15.5px] font-extrabold" style={{ color: "#FAF9F6" }}>Boş dönen araçlara yük ver</div>
        <div className="text-[12px] font-medium" style={{ color: "#C9C7C0" }}>
          Ankara'dan dönen <strong style={{ color: C.yellow }}>8 araç</strong> güzergahında — daha uygun fiyat al
        </div>
      </div>
      <div className="relative h-24 overflow-hidden" style={{ background: "#141414" }}>
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(#262626 1px,transparent 1px),linear-gradient(90deg,#262626 1px,transparent 1px)", backgroundSize: "24px 24px", opacity: 0.6 }} />
        <svg viewBox="0 0 392 96" className="absolute inset-0 h-full w-full">
          <path d="M40 70 C 120 70, 150 28, 230 34 S 340 30, 360 22" stroke={C.yellow} strokeWidth="2.5" fill="none" strokeDasharray="2 7" strokeLinecap="round" />
          <circle cx="40" cy="70" r="6" fill={C.yellow} />
          <circle cx="360" cy="22" r="6" fill="none" stroke={C.yellow} strokeWidth="2.5" />
        </svg>
        <button onClick={() => nav("/ilanlar?mode=backhaul")} className="absolute bottom-3 right-3.5 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: C.yellow }} aria-label="Dönüş yükü">
          <ArrowRight size={18} style={{ color: C.ink }} />
        </button>
      </div>
    </div>
  );
}

function NewListingCategories({ nav }) {
  return (
    <>
      <SectionTitle>Yeni ilan aç</SectionTitle>
      <div className="flex gap-2.5">
        {[
          { id: "hafriyat", t: "Hafriyat", s: "Toprak · moloz · kaya", Icon: Truck, chip: "#FEF3C7" },
          { id: "silobas", t: "Silobas", s: "Çimento · kum · mıcır", Icon: Package, chip: C.stone },
        ].map(({ id, t, s, Icon, chip }) => (
          <button key={id} onClick={() => nav(`/ilan-ver?cat=${id}`)} className="flex-1 rounded-2xl p-3.5 text-left" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: chip }}>
              <Icon size={24} style={{ color: C.ink }} />
            </div>
            <div className="text-[14px] font-extrabold" style={{ color: C.ink }}>{t}</div>
            <div className="mt-0.5 text-[11px] font-medium" style={{ color: C.sub }}>{s}</div>
          </button>
        ))}
      </div>
    </>
  );
}

/* ── Ana bileşen ────────────────────────────────────────────────────── */
export default function NakliyeHome({
  user, pendingOffersCount = 0, unreadCount = 0, onLoginClick,
}) {
  const navigate = useNavigate();
  const role = user?.role || "muteahhit";

  // istatistik şeridi rol başlıkları (değerler repo verisinden türetilebilir)
  const STAT = {
    muteahhit: [
      { value: user ? "3" : "—", label: "Aktif ilan" },
      { value: user ? String(pendingOffersCount || 17) : "—", label: "Yeni teklif", dot: true },
      { value: "₺48B", label: "Cüzdan", money: true },
    ],
    nakliyeci: [
      { value: "8", label: "Açık teklifim" },
      { value: "3", label: "Kazanılan iş" },
      { value: "₺22B", label: "Hakediş", money: true },
    ],
    tedarikci: [
      { value: "6", label: "Yayında ürün" },
      { value: "11", label: "Yeni talep", dot: true },
      { value: "₺96B", label: "Cüzdan", money: true },
    ],
  }[role];

  const name = user?.name || (role === "nakliyeci" ? "Demir Nakliyat" : role === "tedarikci" ? "Aliağa Mıcır Ocağı" : "Yıldızlar İnşaat");
  const unread = unreadCount || pendingOffersCount;

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col pb-24" style={{ background: C.bg, color: C.ink }}>
      <SEO title="Ana Sayfa" description="Hafriyat ve silobas iş ilanları. Nakliyecilerden teklif alın, komisyonsuz eşleşin." />

      <Header
        name={name}
        role={role}
        unread={unread}
        onBell={() => navigate("/mesajlar")}
        onSearch={() => navigate("/ilanlar")}
      />

      {/* yüzen istatistik bandı (header'a biner) */}
      <div className="-mt-[52px] px-[18px]">
        <div className="flex rounded-[18px] p-1" style={{ background: C.card, boxShadow: "0 12px 30px -12px rgba(16,42,67,.28)" }}>
          {STAT.map((s, i) => (
            <div key={s.label} className="flex flex-1">
              {i > 0 && <span className="my-3 w-px" style={{ background: C.line }} />}
              <Stat {...s} />
            </div>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="px-[18px] pt-5">
        {role === "nakliyeci" ? (
          <NakliyeciStateful navigate={navigate} />
        ) : role === "tedarikci" ? (
          <TedarikciBody nav={navigate} />
        ) : (
          <MuteahhitBody nav={navigate} />
        )}

        {/* GİRİŞ YAPMAMIŞ KULLANICI CTA */}
        {!user && (
          <div className="mb-2 flex items-center justify-between rounded-2xl p-4" style={{ background: C.ink }}>
            <div>
              <div className="text-[13px] font-extrabold" style={{ color: "#FAF9F6" }}>Ücretsiz hesap aç</div>
              <div className="mt-0.5 text-[11px] font-medium" style={{ color: "#C9C7C0" }}>İlan ver, teklif al. Komisyon yok.</div>
            </div>
            <button onClick={() => onLoginClick?.()} className="rounded-xl px-4 py-2 text-[12px] font-extrabold" style={{ background: C.yellow, color: C.ink }}>
              Giriş / Kayıt
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* müsaitlik state'i için ince sarmalayıcı (hook kuralları) */
function NakliyeciStateful({ navigate }) {
  const [available, setAvailable] = useState(true);
  return <NakliyeciBody nav={navigate} available={available} setAvailable={setAvailable} />;
}
