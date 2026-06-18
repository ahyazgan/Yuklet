// HamTed — İlanlar (SAHA marka dili)
// Endüstriyel/şantiye · manila zemin · siyah çerçeve · Space Mono rakamlar.
// TÜM filtreleme/işlevsellik korunur: URL params, kaydedilmiş aramalar,
// gelişmiş filtreler (malzeme/fiyat/sıralama), dönüş yükü (backhaul), harita.

import { useState, useMemo, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { LISTINGS, IL_LIST } from "../data/listings";
import { CATS, MATERIALS } from "../data/categories";
import { loadsNearCity } from "../utils/backhaul";
import { loadSavedSearches, saveSavedSearches } from "../utils/storage";
import SEO from "../components/SEO";

const ListingsMap = lazy(() => import("../components/ListingsMap"));

// ── SAHA token'ları (inline) ──
const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  green: "#16803C",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  line: "#F0ECE3",
  sub: "#5A5852",
  muted: "#9A968D",
  faint: "#A8A39A",
};
const MONO = { fontFamily: "'Space Mono', ui-monospace, monospace" };

const shell = {
  maxWidth: 460,
  margin: "0 auto",
  width: "100%",
  minHeight: "100vh",
  background: C.bg,
  color: C.ink,
  display: "flex",
  flexDirection: "column",
};

const fmtPrice = (l) =>
  l.priceType === "sabit" && l.price ? `₺${l.price.toLocaleString("tr-TR")}` : null;

// ── İlan kartı ──
function ListingCard({ l }) {
  const isH = l.cat === "hafriyat";
  const fixed = fmtPrice(l);
  const fromTxt = l.il || "—";
  const toTxt = l.bosaltma || l.ilce || "Belirtilmemiş";
  const chips = [];
  if (l.amount) chips.push(`${l.amount} ${(l.unit || "").toUpperCase()}`);
  if (l.vehicle) chips.push(l.vehicle);

  return (
    <div
      style={{
        background: C.card,
        border: `2px solid ${C.ink}`,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* üst satır: kategori rozeti + zaman */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "10px 12px 0 12px" }}
      >
        <span
          style={{
            ...MONO,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.06em",
            padding: "2px 7px",
            border: `1.5px solid ${C.ink}`,
            borderRadius: 4,
            background: isH ? C.ink : C.stone,
            color: isH ? C.yellow : C.ink,
          }}
        >
          {isH ? "HAFRİYAT" : "SİLOBAS"}
        </span>
        <div className="flex items-center gap-1.5">
          {l.status === "eslesti" && (
            <span
              style={{
                ...MONO,
                fontSize: 8.5,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
                background: C.green,
                color: "#fff",
                border: `1.5px solid ${C.ink}`,
              }}
            >
              ● EŞLEŞTİ
            </span>
          )}
          <span style={{ ...MONO, fontSize: 9.5, color: C.muted }}>
            {l.type === "arac" ? "ARAÇ" : "İŞ"} · {l.createdText}
          </span>
        </div>
      </div>

      {/* başlık */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
          padding: "8px 12px 0 12px",
        }}
      >
        {l.title}
      </div>

      {/* güzergah: from ● —— to ○ */}
      <div
        className="flex items-center gap-2"
        style={{ padding: "8px 12px 0 12px" }}
      >
        <span
          style={{ width: 8, height: 8, borderRadius: "50%", background: C.ink, flexShrink: 0 }}
        />
        <span style={{ ...MONO, fontSize: 10.5, fontWeight: 700 }}>{fromTxt}</span>
        <span style={{ flex: 1, height: 2, background: C.border, borderRadius: 1 }} />
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            border: `2px solid ${C.ink}`,
            background: C.card,
            flexShrink: 0,
          }}
        />
        <span
          style={{ ...MONO, fontSize: 10.5, fontWeight: 700, maxWidth: 130 }}
          className="truncate"
        >
          {toTxt}
        </span>
      </div>

      {/* sahip + onaylı + puan */}
      <div
        className="flex items-center gap-2"
        style={{ ...MONO, padding: "8px 12px 0 12px", fontSize: 9.5, color: C.sub }}
      >
        <span style={{ fontWeight: 700, color: C.ink }} className="truncate">
          {l.owner}
        </span>
        {l.ownerVerified && <span style={{ color: C.green, fontWeight: 700 }}>✓ ONAYLI</span>}
        {l.ownerRating && <span>★ {l.ownerRating}</span>}
      </div>

      {/* alt: etiket chip'leri + fiyat + aksiyon */}
      <div
        className="flex items-center justify-between gap-2"
        style={{ padding: "10px 12px 12px 12px", marginTop: 8 }}
      >
        <div className="flex flex-wrap items-center gap-1.5" style={{ minWidth: 0 }}>
          {chips.map((c) => (
            <span
              key={c}
              style={{
                ...MONO,
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
                background: C.stone,
                border: `1.5px solid ${C.border}`,
                color: C.sub,
                whiteSpace: "nowrap",
              }}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2.5">
          {fixed ? (
            <span style={{ ...MONO, fontSize: 14, fontWeight: 700, color: C.green }}>
              {fixed}
            </span>
          ) : (
            <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: C.sub }}>
              TEKLİFE AÇIK
            </span>
          )}
          <span
            style={{
              ...MONO,
              fontSize: 10,
              fontWeight: 700,
              color: C.ink,
              whiteSpace: "nowrap",
            }}
          >
            {l.offers > 0 ? `${l.offers} TEKLİF →` : "TEKLİF VER →"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Boş durum kutusu ──
function EmptyBox({ emoji, title, sub }) {
  return (
    <div
      className="flex flex-col items-center gap-2 text-center"
      style={{
        background: C.card,
        border: `2px dashed ${C.border}`,
        borderRadius: 8,
        padding: "44px 24px",
      }}
    >
      <div style={{ fontSize: 32 }}>{emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 800 }}>{title}</div>
      <div style={{ ...MONO, fontSize: 10.5, color: C.sub }}>{sub}</div>
    </div>
  );
}

export default function ListingsPage({ listings = LISTINGS }) {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [type, setType] = useState(sp.get("type") === "arac" ? "arac" : "all");
  const [cat, setCat] = useState(
    ["hafriyat", "silobas"].includes(sp.get("cat")) ? sp.get("cat") : "all"
  );
  const [il, setIl] = useState("all");
  const [q, setQ] = useState("");
  const [mode, setMode] = useState(sp.get("mode") === "backhaul" ? "backhaul" : "normal"); // normal | backhaul
  const [material, setMaterial] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("yeni"); // yeni | teklif | ucuz | pahali
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState(sp.get("view") === "map" ? "map" : "list"); // list | map

  // ── Kaydedilmiş aramalar (mantık birebir korunur) ──
  const [saved, setSaved] = useState(() => loadSavedSearches());
  const persistSaved = (next) => {
    setSaved(next);
    saveSavedSearches(next);
  };
  const currentSearch = { type, cat, il, q, material, priceMin, priceMax, sort };
  const isDefaultSearch =
    type === "all" &&
    cat === "all" &&
    il === "all" &&
    !q &&
    material === "all" &&
    !priceMin &&
    !priceMax &&
    sort === "yeni";
  const labelFor = (s) => {
    const parts = [];
    if (s.cat !== "all") parts.push(s.cat === "hafriyat" ? "Hafriyat" : "Silobas");
    if (s.type !== "all") parts.push(s.type === "arac" ? "Araç" : "İş");
    if (s.il !== "all") parts.push(s.il);
    if (s.material !== "all") parts.push(s.material);
    if (s.q) parts.push(`"${s.q}"`);
    return parts.join(" · ") || "Tüm ilanlar";
  };
  const saveCurrent = () => {
    const key = JSON.stringify(currentSearch);
    if (
      saved.some(
        (s) =>
          JSON.stringify({
            type: s.type,
            cat: s.cat,
            il: s.il,
            q: s.q,
            material: s.material,
            priceMin: s.priceMin,
            priceMax: s.priceMax,
            sort: s.sort,
          }) === key
      )
    )
      return;
    persistSaved([{ id: key, ...currentSearch, label: labelFor(currentSearch) }, ...saved].slice(0, 8));
  };
  const applySearch = (s) => {
    setType(s.type);
    setCat(s.cat);
    setIl(s.il);
    setQ(s.q);
    setMaterial(s.material);
    setPriceMin(s.priceMin);
    setPriceMax(s.priceMax);
    setSort(s.sort);
    setMode("normal");
  };
  const removeSearch = (id) => persistSaved(saved.filter((s) => s.id !== id));

  const materialOpts =
    cat === "all"
      ? [...(MATERIALS.hafriyat || []), ...(MATERIALS.silobas || [])]
      : MATERIALS[cat] || [];

  const filtered = useMemo(() => {
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    let out = listings.filter(
      (l) =>
        l.status !== "kapali" &&
        (type === "all" || l.type === type) &&
        (cat === "all" || l.cat === cat) &&
        (il === "all" || l.il === il) &&
        (material === "all" || l.material === material) &&
        (min == null || (l.price != null && l.price >= min)) &&
        (max == null || (l.price != null && l.price <= max)) &&
        (q === "" ||
          l.title.toLowerCase().includes(q.toLowerCase()) ||
          (l.ilce || "").toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === "teklif") out = [...out].sort((a, b) => (b.offers || 0) - (a.offers || 0));
    else if (sort === "ucuz") out = [...out].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    else if (sort === "pahali") out = [...out].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    return out;
  }, [listings, type, cat, il, q, material, priceMin, priceMax, sort]);

  const activeFilters =
    (material !== "all" ? 1 : 0) + (priceMin || priceMax ? 1 : 0) + (sort !== "yeni" ? 1 : 0);

  // Dönüş yükü: referans il'e yakın açık iş yükleri
  const backhaul = useMemo(() => {
    if (mode !== "backhaul" || il === "all") return [];
    return loadsNearCity(il, listings, { cat: cat === "all" ? null : cat, limit: 30 });
  }, [mode, il, cat, listings]);

  const openCount = mode === "backhaul" ? backhaul.length : filtered.length;

  // ── Sekme yardımcı: tab tasarımı ──
  const tabStyle = (active) => ({
    ...MONO,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.02em",
    padding: "8px 12px",
    borderRadius: 6,
    border: `2px solid ${C.ink}`,
    background: active ? C.ink : C.card,
    color: active ? C.yellow : C.ink,
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: 5,
  });

  const chip = (active) => ({
    ...MONO,
    fontSize: 10,
    fontWeight: 700,
    padding: "6px 11px",
    borderRadius: 5,
    border: `2px solid ${active ? C.ink : C.border}`,
    background: active ? C.ink : C.card,
    color: active ? C.yellow : C.sub,
    whiteSpace: "nowrap",
    flexShrink: 0,
  });

  return (
    <div style={shell}>
      <SEO
        title="İlanlar"
        description="Hafriyat ve silobas iş ve araç ilanları. Konuma, kategoriye ve türüne göre filtreleyin."
      />

      {/* ── HEADER ── */}
      <div style={{ background: C.header, borderBottom: `2px solid ${C.ink}` }}>
        <div style={{ padding: "14px 16px 12px 16px" }}>
          {/* başlık + sayaç */}
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2.5">
              <h1
                style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                İlanlar
              </h1>
              <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: C.sub }}>
                {openCount} AÇIK İŞ
              </span>
            </div>
            {/* Liste / Harita toggle — sadece normal modda */}
            {mode === "normal" && (
              <div className="flex" style={{ border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden" }}>
                <button
                  onClick={() => setView("list")}
                  style={{
                    ...MONO,
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: "5px 9px",
                    background: view === "list" ? C.ink : C.card,
                    color: view === "list" ? C.yellow : C.ink,
                  }}
                >
                  LİSTE
                </button>
                <button
                  onClick={() => setView("map")}
                  style={{
                    ...MONO,
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: "5px 9px",
                    borderLeft: `2px solid ${C.ink}`,
                    background: view === "map" ? C.ink : C.card,
                    color: view === "map" ? C.yellow : C.ink,
                  }}
                >
                  HARİTA
                </button>
              </div>
            )}
          </div>

          {/* arama + filtre */}
          <div className="flex items-center gap-2" style={{ marginTop: 12 }}>
            <div
              className="flex flex-1 items-center gap-2"
              style={{
                background: C.card,
                border: `2px solid ${C.ink}`,
                borderRadius: 6,
                padding: "0 11px",
                height: 42,
              }}
            >
              <Search size={16} color={C.sub} strokeWidth={2.5} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="İL · MALZEME · GÜZERGAH ARA"
                aria-label="İlan ara"
                style={{
                  ...MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  width: "100%",
                  color: C.ink,
                }}
              />
            </div>
            {mode === "normal" && (
              <button
                onClick={() => setShowFilters(true)}
                aria-label="Filtreler"
                style={{
                  position: "relative",
                  width: 42,
                  height: 42,
                  borderRadius: 6,
                  border: `2px solid ${C.ink}`,
                  background: activeFilters > 0 ? C.yellow : C.card,
                  flexShrink: 0,
                }}
                className="flex items-center justify-center"
              >
                <SlidersHorizontal size={17} color={C.ink} strokeWidth={2.5} />
                {activeFilters > 0 && (
                  <span
                    style={{
                      ...MONO,
                      position: "absolute",
                      top: -6,
                      right: -6,
                      background: C.ink,
                      color: C.yellow,
                      fontSize: 9,
                      fontWeight: 700,
                      border: `1.5px solid ${C.ink}`,
                      borderRadius: 4,
                      padding: "0 4px",
                      minWidth: 16,
                      textAlign: "center",
                    }}
                  >
                    {activeFilters}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* SEKMELER: Tümü / Hafriyat / Silobas / Dönüş */}
          <div className="flex gap-2 overflow-x-auto" style={{ marginTop: 12, paddingBottom: 2 }}>
            <button
              style={tabStyle(mode === "normal" && cat === "all")}
              onClick={() => {
                setMode("normal");
                setCat("all");
              }}
            >
              TÜMÜ
            </button>
            {CATS.map((c) => (
              <button
                key={c.id}
                style={tabStyle(mode === "normal" && cat === c.id)}
                onClick={() => {
                  setMode("normal");
                  setCat(c.id);
                }}
              >
                {c.id === "hafriyat" && (
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      background: C.yellow,
                      border: `1.5px solid ${mode === "normal" && cat === "hafriyat" ? C.yellow : C.ink}`,
                      borderRadius: 2,
                    }}
                  />
                )}
                {c.id === "hafriyat" ? "HAFRİYAT" : "SİLOBAS"}
              </button>
            ))}
            <button
              style={tabStyle(mode === "backhaul")}
              onClick={() => setMode("backhaul")}
            >
              🔄 DÖNÜŞ
            </button>
          </div>
        </div>
      </div>

      {/* ── GÖVDE ── */}
      <div
        style={{ flex: 1, padding: "12px 16px 110px 16px", display: "flex", flexDirection: "column", gap: 12 }}
      >
        {/* İL filtresi (kaydırılabilir chip'ler) */}
        <div className="flex gap-1.5 overflow-x-auto" style={{ paddingBottom: 2 }}>
          <button style={chip(il === "all")} onClick={() => setIl("all")}>
            TÜM İLLER
          </button>
          {IL_LIST.map((i) => (
            <button key={i} style={chip(il === i)} onClick={() => setIl(i)}>
              {i}
            </button>
          ))}
        </div>

        {/* İş / Araç türü (sadece normal modda) */}
        {mode === "normal" && (
          <div className="flex gap-1.5">
            {[
              ["all", "TÜMÜ"],
              ["is", "İŞ İLANLARI"],
              ["arac", "ARAÇ İLANLARI"],
            ].map(([k, lbl]) => (
              <button key={k} style={chip(type === k)} onClick={() => setType(k)}>
                {lbl}
              </button>
            ))}
          </div>
        )}

        {/* Kaydedilmiş aramalar */}
        {mode === "normal" && (saved.length > 0 || !isDefaultSearch) && (
          <div className="flex items-center gap-1.5 overflow-x-auto" style={{ paddingBottom: 2 }}>
            {!isDefaultSearch && (
              <button
                onClick={saveCurrent}
                style={{
                  ...MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "6px 10px",
                  borderRadius: 5,
                  border: `2px dashed ${C.ink}`,
                  background: C.yellow,
                  color: C.ink,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                ☆ ARAMAYI KAYDET
              </button>
            )}
            {saved.map((s) => (
              <span
                key={s.id}
                className="flex items-center gap-1.5"
                style={{
                  ...MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "6px 9px",
                  borderRadius: 5,
                  border: `2px solid ${C.border}`,
                  background: C.card,
                  color: C.ink,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <button onClick={() => applySearch(s)}>🔖 {s.label}</button>
                <button
                  onClick={() => removeSearch(s.id)}
                  aria-label="Kaldır"
                  style={{ color: C.muted, display: "flex" }}
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Dönüş yükü açıklaması */}
        {mode === "backhaul" && (
          <p style={{ ...MONO, fontSize: 10.5, color: C.sub, lineHeight: 1.5 }}>
            Aracın <b style={{ color: C.ink }}>hangi ildeyse</b> yukarıdan seç — o ile yakın açık
            yükleri (boş dönmeyesin) sıralayalım.
          </p>
        )}

        {/* ── İÇERİK ── */}
        {mode === "backhaul" ? (
          il === "all" ? (
            <EmptyBox
              emoji="🧭"
              title="Bir referans il seç"
              sub="Aracının bulunduğu ili seç; yakın açık yükleri gösterelim."
            />
          ) : backhaul.length === 0 ? (
            <EmptyBox
              emoji="📭"
              title={`${il} çevresinde açık yük yok`}
              sub="Komşu illeri de deneyebilirsin."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {backhaul.map((m) => (
                <div key={m.listing.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{
                        ...MONO,
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: C.stone,
                        border: `1.5px solid ${C.border}`,
                        color: C.sub,
                      }}
                    >
                      📍 {m.fromIl || "—"} → {m.toIl || "—"}
                    </span>
                    <span
                      style={{
                        ...MONO,
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: C.yellow,
                        border: `1.5px solid ${C.ink}`,
                        color: C.ink,
                      }}
                    >
                      {m.fit}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/ilan/${m.listing.id}`)}
                    style={{ display: "block", width: "100%", textAlign: "left" }}
                  >
                    <ListingCard l={m.listing} />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : view === "map" ? (
          <Suspense
            fallback={
              <div
                className="flex items-center justify-center"
                style={{
                  height: 460,
                  borderRadius: 8,
                  background: C.card,
                  border: `2px solid ${C.ink}`,
                  ...MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.sub,
                }}
              >
                HARİTA YÜKLENİYOR…
              </div>
            }
          >
            <ListingsMap
              listings={filtered}
              onPickIl={(picked) => {
                setIl(picked);
                setView("list");
              }}
            />
          </Suspense>
        ) : filtered.length === 0 ? (
          <EmptyBox
            emoji="🔍"
            title="İlan bulunamadı"
            sub="Filtreleri değiştirip tekrar dene."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((l) => (
              <button
                key={l.id}
                onClick={() => navigate(`/ilan/${l.id}`)}
                style={{ display: "block", width: "100%", textAlign: "left" }}
              >
                <ListingCard l={l} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── FİLTRE ALT SAYFASI ── */}
      {mode === "normal" && showFilters && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50 }}
          className="mx-auto flex flex-col justify-end"
        >
          {/* overlay */}
          <button
            onClick={() => setShowFilters(false)}
            aria-label="Kapat"
            style={{ position: "absolute", inset: 0, background: "rgba(10,10,10,0.45)" }}
          />
          {/* sheet */}
          <div
            style={{
              position: "relative",
              maxWidth: 460,
              width: "100%",
              margin: "0 auto",
              background: C.bg,
              borderTop: `3px solid ${C.ink}`,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            {/* başlık */}
            <div
              className="flex items-center justify-between"
              style={{ padding: "16px 16px 12px 16px", borderBottom: `2px solid ${C.line}` }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.01em" }}>FİLTRELER</h2>
              <button onClick={() => setShowFilters(false)} aria-label="Kapat" style={{ display: "flex" }}>
                <X size={22} strokeWidth={2.5} color={C.ink} />
              </button>
            </div>

            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Kategori */}
              <div>
                <div style={{ ...MONO, fontSize: 10, fontWeight: 700, color: C.sub, marginBottom: 8, letterSpacing: "0.06em" }}>
                  KATEGORİ
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button style={chip(cat === "all")} onClick={() => setCat("all")}>
                    TÜMÜ
                  </button>
                  {CATS.map((c) => (
                    <button key={c.id} style={chip(cat === c.id)} onClick={() => setCat(c.id)}>
                      {c.id === "hafriyat" ? "HAFRİYAT" : "SİLOBAS"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Araç / İş türü */}
              <div>
                <div style={{ ...MONO, fontSize: 10, fontWeight: 700, color: C.sub, marginBottom: 8, letterSpacing: "0.06em" }}>
                  TÜR
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ["all", "TÜMÜ"],
                    ["is", "İŞ İLANI"],
                    ["arac", "ARAÇ İLANI"],
                  ].map(([k, lbl]) => (
                    <button key={k} style={chip(type === k)} onClick={() => setType(k)}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Malzeme */}
              <div>
                <div style={{ ...MONO, fontSize: 10, fontWeight: 700, color: C.sub, marginBottom: 8, letterSpacing: "0.06em" }}>
                  MALZEME
                </div>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  style={{
                    ...MONO,
                    fontSize: 12,
                    fontWeight: 700,
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 6,
                    border: `2px solid ${C.ink}`,
                    background: C.card,
                    color: C.ink,
                    outline: "none",
                  }}
                >
                  <option value="all">TÜMÜ</option>
                  {materialOpts.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fiyat aralığı */}
              <div>
                <div style={{ ...MONO, fontSize: 10, fontWeight: 700, color: C.sub, marginBottom: 8, letterSpacing: "0.06em" }}>
                  FİYAT ARALIĞI (SABİT FİYATLI)
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="MIN ₺"
                    style={{
                      ...MONO,
                      fontSize: 12,
                      fontWeight: 700,
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: `2px solid ${C.ink}`,
                      background: C.card,
                      color: C.ink,
                      outline: "none",
                    }}
                  />
                  <span style={{ ...MONO, fontWeight: 700, color: C.muted }}>–</span>
                  <input
                    type="number"
                    min="0"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="MAX ₺"
                    style={{
                      ...MONO,
                      fontSize: 12,
                      fontWeight: 700,
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: `2px solid ${C.ink}`,
                      background: C.card,
                      color: C.ink,
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Sıralama */}
              <div>
                <div style={{ ...MONO, fontSize: 10, fontWeight: 700, color: C.sub, marginBottom: 8, letterSpacing: "0.06em" }}>
                  SIRALAMA
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ["yeni", "YENİ"],
                    ["teklif", "EN ÇOK TEKLİF"],
                    ["ucuz", "FİYAT ↑"],
                    ["pahali", "FİYAT ↓"],
                  ].map(([k, lbl]) => (
                    <button key={k} style={chip(sort === k)} onClick={() => setSort(k)}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtreleri temizle */}
              {activeFilters > 0 && (
                <button
                  onClick={() => {
                    setMaterial("all");
                    setPriceMin("");
                    setPriceMax("");
                    setSort("yeni");
                  }}
                  style={{ ...MONO, fontSize: 11, fontWeight: 700, color: C.sub, textDecoration: "underline", alignSelf: "flex-start" }}
                >
                  FİLTRELERİ TEMİZLE
                </button>
              )}
            </div>

            {/* Sonuç butonu */}
            <div style={{ padding: 16, borderTop: `2px solid ${C.line}`, background: C.bg, position: "sticky", bottom: 0 }}>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  width: "100%",
                  background: C.ink,
                  color: C.yellow,
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: "0.02em",
                  border: `2px solid ${C.ink}`,
                  borderRadius: 8,
                  padding: "14px 0",
                  textTransform: "uppercase",
                }}
              >
                {filtered.length} İLANI GÖSTER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
