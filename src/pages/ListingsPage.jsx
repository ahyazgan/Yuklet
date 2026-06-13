import { useState, useMemo, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { LISTINGS, IL_LIST } from "../data/listings";
import { CATS, MATERIALS } from "../data/categories";
import { loadsNearCity } from "../utils/backhaul";
import SEO from "../components/SEO";

const ListingsMap = lazy(() => import("../components/ListingsMap"));

// ── MoveIQ LIGHT "Orders" tasarimi (Tailwind).

const CAT_TAG = {
  hafriyat: { label: "HAFRİYAT", cls: "text-amber-700 bg-amber-100" },
  silobas: { label: "SİLOBAS", cls: "text-sky-700 bg-sky-100" },
};

function ListingCard({ l, onClick }) {
  const tag = CAT_TAG[l.cat] || CAT_TAG.hafriyat;
  const isFixed = l.priceType === "sabit" && l.price;
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
      className="flex w-full flex-col gap-2 rounded-3xl bg-white dark:bg-navy-card p-5 text-left shadow-sm transition hover:-translate-y-0.5"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${tag.cls}`}>{tag.label}</span>
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${l.type === "is" ? "text-amber-700 bg-amber-100" : "text-sky-700 bg-sky-100"}`}>
          {l.type === "is" ? "İŞ İLANI" : "ARAÇ"}
        </span>
        {l.status === "eslesti" && <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700">EŞLEŞTİ</span>}
        <span className="text-[11px] text-gray-400 dark:text-navy-muted">• {l.createdText}</span>
      </div>
      <div className="text-base font-bold leading-snug text-slate-950 dark:text-slate-100">{l.title}</div>
      <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-slate-400">📍 {l.il}{l.ilce ? `, ${l.ilce}` : ""}{l.amount ? ` • ${l.amount} ${l.unit || ""}` : ""}</div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-100">{l.owner}</span>
        {l.ownerVerified && <span className="font-bold text-emerald-600">✓ Onaylı</span>}
        {l.ownerRating && <span className="text-amber-600">★ {l.ownerRating}</span>}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-navy-line pt-3">
        <span>
          <span className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">{isFixed ? `₺${l.price.toLocaleString("tr-TR")}` : "Teklif"}</span>
          <span className="text-[11px] text-gray-400 dark:text-navy-muted"> {isFixed ? (l.unit ? `/${l.unit}` : "") : "usulü"}</span>
        </span>
        <span className="whitespace-nowrap rounded-full bg-yellow-400 px-4 py-2 text-xs font-extrabold text-slate-950">Teklif ver</span>
      </div>
    </motion.button>
  );
}

export default function ListingsPage({ listings = LISTINGS }) {
  const navigate = useNavigate();
  const [type, setType] = useState("all");
  const [cat, setCat] = useState("all");
  const [il, setIl] = useState("all");
  const [q, setQ] = useState("");
  const [sp] = useSearchParams();
  const [mode, setMode] = useState(sp.get("mode") === "backhaul" ? "backhaul" : "normal"); // normal | backhaul
  const [material, setMaterial] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("yeni"); // yeni | teklif | ucuz | pahali
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState(sp.get("view") === "map" ? "map" : "list"); // list | map

  const materialOpts = cat === "all"
    ? [...(MATERIALS.hafriyat || []), ...(MATERIALS.silobas || [])]
    : (MATERIALS[cat] || []);

  const filtered = useMemo(() => {
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    let out = listings.filter((l) =>
      l.status !== "kapali" &&
      (type === "all" || l.type === type) &&
      (cat === "all" || l.cat === cat) &&
      (il === "all" || l.il === il) &&
      (material === "all" || l.material === material) &&
      (min == null || (l.price != null && l.price >= min)) &&
      (max == null || (l.price != null && l.price <= max)) &&
      (q === "" || l.title.toLowerCase().includes(q.toLowerCase()) || (l.ilce || "").toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === "teklif") out = [...out].sort((a, b) => (b.offers || 0) - (a.offers || 0));
    else if (sort === "ucuz") out = [...out].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    else if (sort === "pahali") out = [...out].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    return out;
  }, [listings, type, cat, il, q, material, priceMin, priceMax, sort]);

  const activeFilters = (material !== "all" ? 1 : 0) + (priceMin || priceMax ? 1 : 0) + (sort !== "yeni" ? 1 : 0);

  // Donus yuku: referans il'e yakin acik is yukleri
  const backhaul = useMemo(() => {
    if (mode !== "backhaul" || il === "all") return [];
    return loadsNearCity(il, listings, { cat: cat === "all" ? null : cat, limit: 30 });
  }, [mode, il, cat, listings]);

  const segBtn = (active) =>
    `flex-1 rounded-xl py-2.5 text-sm font-bold transition ${active ? "bg-slate-950 text-white dark:bg-navy-soft dark:text-slate-100 shadow" : "text-gray-500 dark:text-slate-400"}`;
  const chip = (active) =>
    `flex-shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition ${active ? "bg-slate-950 text-white dark:bg-navy-soft dark:text-slate-100 shadow" : "bg-white dark:bg-navy-card text-gray-500 dark:text-slate-400 shadow-sm"}`;

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-4 px-4 pb-24 pt-2 text-slate-900 dark:text-slate-100">
      <SEO title="İlanlar" description="Hafriyat ve silobas iş ve araç ilanları. Konuma, kategoriye ve türüne göre filtreleyin." />

      {/* Baslik */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">İlanlar</h1>
          <span className="rounded-full bg-white dark:bg-navy-card px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm">{mode === "backhaul" ? backhaul.length : filtered.length}</span>
        </div>
        {mode === "normal" && (
          <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm dark:bg-navy-card">
            <button onClick={() => setView("list")} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === "list" ? "bg-slate-950 text-white dark:bg-navy-soft dark:text-slate-100" : "text-gray-500 dark:text-slate-400"}`}>Liste</button>
            <button onClick={() => setView("map")} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === "map" ? "bg-slate-950 text-white dark:bg-navy-soft dark:text-slate-100" : "text-gray-500 dark:text-slate-400"}`}>🗺️ Harita</button>
          </div>
        )}
      </div>

      {/* Mod: Tum ilanlar / Donus yuku */}
      <div className="flex gap-1 rounded-2xl bg-white dark:bg-navy-card p-1 shadow-sm">
        <button className={segBtn(mode === "normal")} onClick={() => setMode("normal")}>Tüm ilanlar</button>
        <button className={segBtn(mode === "backhaul")} onClick={() => setMode("backhaul")}>🔄 Dönüş yükü</button>
      </div>

      {/* Arama + Filtre */}
      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-navy-muted">🔍</span>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="İl, malzeme veya güzergah ara…" aria-label="İlan ara"
            className="w-full rounded-2xl bg-white dark:bg-navy-card py-3 pl-11 pr-4 text-xs text-slate-900 dark:text-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        {mode === "normal" && (
          <button onClick={() => setShowFilters((s) => !s)} aria-label="Filtreler"
            className={`relative flex h-11 w-11 items-center justify-center rounded-2xl text-lg shadow-sm transition ${showFilters || activeFilters ? "bg-slate-950 text-white dark:bg-navy-soft dark:text-slate-100" : "bg-white text-slate-700 dark:bg-navy-card dark:text-slate-300"}`}>
            ⚙
            {activeFilters > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] font-extrabold text-slate-950">{activeFilters}</span>}
          </button>
        )}
      </div>

      {/* Gelismis filtre paneli */}
      {mode === "normal" && showFilters && (
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-navy-card">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Malzeme</label>
            <select value={material} onChange={(e) => setMaterial(e.target.value)} className="w-full rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none dark:bg-navy-soft dark:text-slate-100">
              <option value="all">Tümü</option>
              {materialOpts.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Fiyat aralığı (sabit fiyatlı ilanlar)</label>
            <div className="flex items-center gap-2">
              <input type="number" min="0" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Min ₺" className="w-full rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none dark:bg-navy-soft dark:text-slate-100" />
              <span className="text-gray-400">–</span>
              <input type="number" min="0" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Max ₺" className="w-full rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none dark:bg-navy-soft dark:text-slate-100" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Sıralama</label>
            <div className="flex flex-wrap gap-1.5">
              {[["yeni", "Yeni"], ["teklif", "En çok teklif"], ["ucuz", "Fiyat ↑"], ["pahali", "Fiyat ↓"]].map(([k, lbl]) => (
                <button key={k} onClick={() => setSort(k)} className={chip(sort === k)}>{lbl}</button>
              ))}
            </div>
          </div>
          {activeFilters > 0 && (
            <button onClick={() => { setMaterial("all"); setPriceMin(""); setPriceMax(""); setSort("yeni"); }}
              className="self-start text-xs font-bold text-amber-600">Filtreleri temizle</button>
          )}
        </div>
      )}

      {/* Segment Is/Arac — sadece normal modda */}
      {mode === "normal" && (
        <div className="flex gap-1 rounded-2xl bg-white dark:bg-navy-card p-1 shadow-sm">
          <button className={segBtn(type === "is" || type === "all")} onClick={() => setType("is")}>İş ilanları</button>
          <button className={segBtn(type === "arac")} onClick={() => setType("arac")}>Araç ilanları</button>
        </div>
      )}

      {mode === "backhaul" && (
        <p className="-mb-1 px-1 text-xs text-gray-500 dark:text-slate-400">
          Aracın <b className="text-slate-800 dark:text-slate-200">hangi ildeyse</b> aşağıdan seç — o ile yakın açık yükleri (boş dönmeyesin) sıralayalım.
        </p>
      )}

      {/* Kategori chip */}
      <div className="flex gap-1.5">
        <button className={chip(cat === "all")} onClick={() => setCat("all")}>Tümü</button>
        {CATS.map((c) => (
          <button key={c.id} className={chip(cat === c.id)} onClick={() => setCat(c.id)}>{c.name}</button>
        ))}
      </div>

      {/* Il chip (kaydirilabilir) */}
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <button className={chip(il === "all")} onClick={() => setIl("all")}>Tüm iller</button>
        {IL_LIST.map((i) => (
          <button key={i} className={chip(il === i)} onClick={() => setIl(i)}>{i}</button>
        ))}
      </div>

      {mode === "backhaul" ? (
        il === "all" ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-white dark:bg-navy-card py-12 text-center shadow-sm">
            <div className="text-4xl">🧭</div>
            <div className="text-base font-bold text-slate-950 dark:text-slate-100">Bir referans il seç</div>
            <div className="px-6 text-sm text-gray-500 dark:text-slate-400">Yukarıdaki illerden aracının bulunduğu ili seç; o ile yakın açık yükleri gösterelim.</div>
          </div>
        ) : backhaul.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-white dark:bg-navy-card py-12 text-center shadow-sm">
            <div className="text-4xl">📭</div>
            <div className="text-base font-bold text-slate-950 dark:text-slate-100">{il} çevresinde açık yük yok</div>
            <div className="text-sm text-gray-500 dark:text-slate-400">Komşu illeri de deneyebilirsin.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {backhaul.map((m) => (
              <div key={m.listing.id} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <span className="rounded-md bg-slate-100 dark:bg-navy-soft px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">📍 {m.fromIl || "—"} → {m.toIl || "—"}</span>
                  <span className="rounded-full bg-yellow-400 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-950">{m.fit}</span>
                </div>
                <ListingCard l={m.listing} onClick={() => navigate(`/ilan/${m.listing.id}`)} />
              </div>
            ))}
          </div>
        )
      ) : view === "map" ? (
        <Suspense fallback={<div className="flex h-[460px] items-center justify-center rounded-2xl bg-white text-sm text-gray-400 shadow-sm dark:bg-navy-card">Harita yükleniyor…</div>}>
          <ListingsMap listings={filtered} onPickIl={(picked) => { setIl(picked); setView("list"); }} />
        </Suspense>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-white dark:bg-navy-card py-14 text-center shadow-sm">
          <div className="text-4xl">🔍</div>
          <div className="text-base font-bold text-slate-950 dark:text-slate-100">İlan bulunamadı</div>
          <div className="text-sm text-gray-500 dark:text-slate-400">Filtreleri değiştirip tekrar dene.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((l) => (
            <ListingCard key={l.id} l={l} onClick={() => navigate(`/ilan/${l.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
