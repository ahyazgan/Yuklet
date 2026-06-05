import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LISTINGS, IL_LIST } from "../data/listings";
import { CATS } from "../data/categories";
import SEO from "../components/SEO";

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

  const filtered = useMemo(() => {
    return listings.filter((l) =>
      l.status !== "kapali" &&
      (type === "all" || l.type === type) &&
      (cat === "all" || l.cat === cat) &&
      (il === "all" || l.il === il) &&
      (q === "" || l.title.toLowerCase().includes(q.toLowerCase()) || (l.ilce || "").toLowerCase().includes(q.toLowerCase()))
    );
  }, [listings, type, cat, il, q]);

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
          <span className="rounded-full bg-white dark:bg-navy-card px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm">{filtered.length}</span>
        </div>
      </div>

      {/* Arama */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-navy-muted">🔍</span>
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="İl, malzeme veya güzergah ara…" aria-label="İlan ara"
          className="w-full rounded-2xl bg-white dark:bg-navy-card py-3 pl-11 pr-4 text-xs text-slate-900 dark:text-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      {/* Segment Is/Arac */}
      <div className="flex gap-1 rounded-2xl bg-white dark:bg-navy-card p-1 shadow-sm">
        <button className={segBtn(type === "is" || type === "all")} onClick={() => setType("is")}>İş ilanları</button>
        <button className={segBtn(type === "arac")} onClick={() => setType("arac")}>Araç ilanları</button>
      </div>

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

      {filtered.length === 0 ? (
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
