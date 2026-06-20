// HamTed — ÖNİZLEME: "SAHA" marka dili ana sayfa
// Endüstriyel/şantiye · açık manila/beton tema · siyah çerçeve · hazard sarısı
// · mono rakamlar · condensed başlıklar · "sevk fişi" karakteri.
// Mevcut ana sayfaya DOKUNMAZ — /saha rotasında denenir.

import { useNavigate } from "react-router-dom";
import { LISTINGS } from "../data/listings";
import SEO from "../components/SEO";

// ── SAHA token'ları (inline — önizleme izole olsun) ──
const C = {
  bg: "#E8E4DC",        // manila/beton zemin
  card: "#FAF9F6",      // kırık beyaz kart
  ink: "#0A0A0A",       // siyah çerçeve/metin
  sub: "#5A5852",       // ikincil metin
  yellow: "#FACC15",    // hazard sarısı
  line: "#0A0A0A",
};
const mono = { fontFamily: "'Space Mono', monospace" };
const head = { fontFamily: "'Archivo', sans-serif", letterSpacing: "-0.02em" };

// Hazard şerit (sarı-siyah diagonal)
const hazard = {
  backgroundImage:
    "repeating-linear-gradient(45deg,#0A0A0A 0 10px,#FACC15 10px 20px)",
};

const ilanNo = (id) => "HMT-" + String(id).padStart(4, "0");
const fmtPrice = (l) =>
  l.priceType === "sabit" && l.price ? `₺${l.price.toLocaleString("tr-TR")}` : "TEKLİFE AÇIK";

function Card({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, textAlign: "left", width: "100%", ...style }}>
      {children}
    </button>
  );
}

function StatusTag({ l }) {
  const map = {
    aktif: ["● AKTİF", "#0A0A0A", "#FACC15"],
    eslesti: ["● EŞLEŞTİ", "#FFFFFF", "#16803C"],
    kapali: ["● KAPALI", "#FFFFFF", "#5A5852"],
  };
  const [label, fg, bg] = map[l.status] || map.aktif;
  return (
    <span style={{ ...mono, background: bg, color: fg, fontSize: 9, fontWeight: 700, padding: "2px 6px", border: "1.5px solid #0A0A0A" }}>
      {label}
    </span>
  );
}

export default function SahaHome({ listings = LISTINGS, user, pendingOffersCount = 0 }) {
  const navigate = useNavigate();
  const recent = listings.filter((l) => l.status !== "kapali").slice(0, 4);
  const activeCount = listings.filter((l) => l.status === "aktif").length;
  const backhaul = listings.filter((l) => l.status === "aktif" && l.type === "is").length;
  const firstName = user ? String(user.name || "").split(" ")[0] : "MİSAFİR";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.ink }} className="mx-auto w-full max-w-[460px] pb-28">
      <SEO title="SAHA (önizleme)" description="HamTed SAHA marka dili önizleme." />

      {/* Hazard şerit üst */}
      <div style={{ ...hazard, height: 8 }} />

      {/* ÜST BAR */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2.5">
          <div style={{ background: C.ink, width: 40, height: 40, borderRadius: 6 }} className="flex items-center justify-center">
            <span style={{ ...head, color: C.yellow, fontSize: 22, fontWeight: 900 }}>H</span>
          </div>
          <div>
            <div style={{ ...head, fontSize: 17, fontWeight: 800, textTransform: "uppercase", lineHeight: 1 }}>
              MERHABA, {firstName}
            </div>
            <div style={{ ...mono, fontSize: 10, color: C.sub, marginTop: 3 }}>
              {user ? (user.role === "nakliyeci" ? "NAKLİYECİ" : user.role === "tedarikci" ? "TEDARİKÇİ" : "MÜTEAHHİT") : "GİRİŞ YAPILMADI"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/mesajlar")} aria-label="Bildirim"
            style={{ width: 38, height: 38, border: `2px solid ${C.ink}`, borderRadius: 6, background: C.card }} className="relative flex items-center justify-center">
            <span style={{ fontSize: 16 }}>🔔</span>
            {pendingOffersCount > 0 && <span style={{ position: "absolute", top: -5, right: -5, background: "#DC2626", color: "#fff", ...mono, fontSize: 9, fontWeight: 700, border: "1.5px solid #0A0A0A", borderRadius: 3, padding: "0 3px" }}>{pendingOffersCount}</span>}
          </button>
          <button onClick={() => navigate(user ? "/profil" : "/")} aria-label="Profil"
            style={{ width: 38, height: 38, border: `2px solid ${C.ink}`, borderRadius: 6, background: C.yellow }} className="flex items-center justify-center">
            <span style={{ ...head, fontWeight: 900, fontSize: 16 }}>{(user?.name || "H").charAt(0).toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* ARAMA */}
      <div className="px-4 pt-4">
        <button onClick={() => navigate("/ilanlar")}
          style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, width: "100%" }}
          className="flex items-center gap-2.5 px-3.5 py-3">
          <span style={{ fontSize: 15 }}>🔍</span>
          <span style={{ ...mono, fontSize: 11, color: C.sub, textTransform: "uppercase" }}>İL · MALZEME · GÜZERGAH ARA</span>
        </button>
      </div>

      {/* HIZLI DURUM ŞERİDİ (mono rakamlar) */}
      <div className="grid grid-cols-3 gap-2.5 px-4 pt-3">
        {[
          ["AKTİF İLAN", user ? activeCount : `${activeCount}+`],
          ["BEKLEYEN", user ? pendingOffersCount : "—"],
          ["CÜZDAN", user ? "₺0" : "—"],
        ].map(([label, val], i) => (
          <div key={label} onClick={() => navigate(user ? (i === 2 ? "/cuzdan" : "/ilanlarim") : "/ilanlar")}
            style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, cursor: "pointer" }} className="px-2 py-2.5 text-center">
            <div style={{ ...mono, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{val}</div>
            <div style={{ ...mono, fontSize: 8, color: C.sub, marginTop: 4, letterSpacing: "0.05em" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ÖNE ÇIKAN AKSİYON — sarı blok */}
      <div className="px-4 pt-3">
        <div style={{ background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, position: "relative", overflow: "hidden" }} className="p-4">
          <div style={{ ...mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }}>%0 KOMİSYON</div>
          <div style={{ ...head, fontSize: 24, fontWeight: 900, textTransform: "uppercase", lineHeight: 0.95, marginTop: 4 }}>
            İLANINI AÇ<br />TEKLİF AL
          </div>
          <div style={{ ...mono, fontSize: 10, marginTop: 6, color: "#3A3A2A" }}>NAKLİYECİDEN TEKLİF, HEMEN SEFER.</div>
          <button onClick={() => navigate("/ilan-ver")}
            style={{ background: C.ink, color: C.yellow, ...head, fontSize: 12, fontWeight: 800, border: "none", borderRadius: 5, marginTop: 12, padding: "8px 16px", textTransform: "uppercase" }}>
            İLAN VER →
          </button>
          {/* hazard köşe */}
          <div style={{ ...hazard, position: "absolute", top: 0, right: 0, width: 28, height: "100%" }} />
        </div>
      </div>

      {/* DÖNÜŞ YÜKÜ */}
      <div className="px-4 pt-3">
        <Card onClick={() => navigate("/ilanlar?mode=backhaul")} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12 }}>
          <div style={{ background: "#16803C", border: `2px solid ${C.ink}`, borderRadius: 5, width: 40, height: 40 }} className="flex flex-shrink-0 items-center justify-center">
            <span style={{ fontSize: 18 }}>🔄</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...head, fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>BOŞ DÖNME — YOLDA YÜK AL</div>
            <div style={{ ...mono, fontSize: 9, color: C.sub, marginTop: 2 }}>GÜZERGAHINA UYGUN DÖNÜŞ YÜKÜ</div>
          </div>
          <div style={{ ...mono, fontSize: 13, fontWeight: 700, background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 4, padding: "2px 8px" }}>{backhaul}</div>
        </Card>
      </div>

      {/* KATEGORİLER */}
      <div className="px-4 pt-4">
        <div style={{ ...head, fontSize: 12, fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>KATEGORİ</div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            ["hafriyat", "HAFRİYAT", "🚛", C.yellow],
            ["silobas", "SİLOBAS", "🏗️", C.card],
          ].map(([id, label, emoji, bg]) => (
            <button key={id} onClick={() => navigate(`/ilanlar?cat=${id}`)}
              style={{ background: bg, border: `2px solid ${C.ink}`, borderRadius: 6 }} className="flex flex-col items-center gap-1.5 py-4">
              <span style={{ fontSize: 30 }}>{emoji}</span>
              <span style={{ ...head, fontSize: 13, fontWeight: 800 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SON İLANLAR */}
      <div className="px-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span style={{ ...head, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>SON İLANLAR</span>
          <button onClick={() => navigate("/ilanlar")} style={{ ...mono, fontSize: 10, fontWeight: 700, textDecoration: "underline" }}>TÜMÜ →</button>
        </div>
        <div className="flex flex-col gap-2.5">
          {recent.map((l) => {
            const isH = l.cat === "hafriyat";
            return (
              <Card key={l.id} onClick={() => navigate(`/ilan/${l.id}`)} style={{ display: "flex", alignItems: "stretch", overflow: "hidden" }}>
                {/* sol renk şeridi */}
                <div style={{ width: 6, background: isH ? C.yellow : C.ink, borderRight: `2px solid ${C.ink}` }} />
                <div style={{ flex: 1, padding: 12, minWidth: 0 }}>
                  <div className="flex items-center justify-between gap-2">
                    <span style={{ ...mono, fontSize: 9, color: C.sub }}>{ilanNo(l.id)}</span>
                    <StatusTag l={l} />
                  </div>
                  <div style={{ ...head, fontSize: 14, fontWeight: 700, marginTop: 3, lineHeight: 1.15 }} className="truncate">{l.title}</div>
                  <div style={{ ...mono, fontSize: 10, color: C.sub, marginTop: 4 }} className="truncate">
                    📍 {l.il}{l.ilce ? ` / ${l.ilce}` : ""}{l.amount ? ` · ${l.amount} ${(l.unit || "").toUpperCase()}` : ""}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span style={{ ...mono, fontSize: 9, fontWeight: 700, color: isH ? C.ink : C.card, background: isH ? "#FEF3C7" : C.ink, border: `1.5px solid ${C.ink}`, padding: "1px 6px" }}>
                      {isH ? "HAFRİYAT" : "SİLOBAS"}
                    </span>
                    <span style={{ ...mono, fontSize: 13, fontWeight: 700 }}>{fmtPrice(l)}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* GÜVEN SAYILARI — koyu blok */}
      <div className="px-4 pt-4">
        <div style={{ background: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6 }} className="flex justify-around px-4 py-4">
          {[["2.400+", "İLAN"], ["850+", "NAKLİYECİ"], ["%0", "KOMİSYON"]].map(([v, l]) => (
            <div key={l} className="text-center">
              <div style={{ ...mono, fontSize: 20, fontWeight: 700, color: C.yellow }}>{v}</div>
              <div style={{ ...mono, fontSize: 8, color: "#9A988E", marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hazard şerit alt */}
      <div style={{ ...hazard, height: 8, marginTop: 16 }} />
    </div>
  );
}
