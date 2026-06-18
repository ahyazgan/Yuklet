// HamTed — Ilan Detay (SAHA visual language).
// Visual: SAHA palette + Space Mono + inline-style shell.
// Functionality preserved 1:1:
// offer submit, owner/closed/guest states, price estimate, backhaul,
// incoming offers list, report modal, share. Bottom tab bar is GLOBAL
// (App.jsx <MobileTabBar>) — this page only leaves bottom padding.

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Share2, Star, BadgeCheck, MessageSquare, ArrowRight, X, Send } from "lucide-react";
import { LISTINGS } from "../data/listings";
import { CATS } from "../data/categories";
import { backhaulForJob, loadsForVehicle, vehicleClassOf } from "../utils/backhaul";
import { estimatePrice, fmtTL } from "../utils/priceEstimate";
import { newId, nowIso } from "../utils/id";
import { useToast } from "../components/Toast";
import ReportModal from "../components/ReportModal";
import SEO from "../components/SEO";

// ── SAHA tokens (inline) ──────────────────────────────────────────
const C = {
  ink: "#0A0A0A", header: "#EAE3D6", yellow: "#FACC15", yellowDeep: "#E0B400",
  green: "#16803C", bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA",
  border: "#E3DDD0", line: "#F0ECE3", sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";
const SANS = "'Plus Jakarta Sans',system-ui,sans-serif";

const shell = {
  position: "relative", margin: "0 auto", width: "100%", maxWidth: 460,
  minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: SANS,
  display: "flex", flexDirection: "column",
};

const ilanNo = (id) => "HMT-" + String(id).padStart(4, "0");

const CAT_TAG = {
  hafriyat: { label: "HAFRİYAT", fg: C.yellow },
  silobas: { label: "SİLOBAS", fg: "#7DD3FC" },
};
const OFFER_STATUS = {
  beklemede: { label: "BEKLEMEDE", fg: "#92710A", bg: "#FEF3C7" },
  kabul: { label: "KABUL", fg: "#FFFFFF", bg: C.green },
  ret: { label: "RED", fg: "#FFFFFF", bg: "#9A968D" },
};

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

// ── Mini map SVG (decorative route line; km label only if real) ────
function MiniMap({ km }) {
  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, background: C.stone }}>
      <svg viewBox="0 0 420 150" width="100%" height="120" style={{ display: "block" }} aria-hidden="true">
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="#E3DDD0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="420" height="150" fill="#F4F1EA" />
        <rect width="420" height="150" fill="url(#grid)" />
        <path d="M48 112 C 150 112, 150 40, 372 40" fill="none" stroke={C.ink} strokeWidth="3" strokeLinecap="round" strokeDasharray="2 9" />
        <circle cx="48" cy="112" r="9" fill={C.yellow} stroke={C.ink} strokeWidth="2.5" />
        <rect x="365" y="33" width="14" height="14" fill={C.green} stroke={C.ink} strokeWidth="2.5" transform="rotate(45 372 40)" />
      </svg>
      {km != null && (
        <span style={{ position: "absolute", top: 10, right: 10, fontFamily: MONO, fontSize: 11, fontWeight: 700, background: C.card, border: `1.5px solid ${C.ink}`, borderRadius: 6, padding: "3px 8px" }}>
          ~{km} KM
        </span>
      )}
    </div>
  );
}

// ── 2x2 spec grid cell ────────────────────────────────────────────
function SpecCell({ label, value }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: C.ink, lineHeight: 1.25 }}>{value}</div>
    </div>
  );
}

// ── full-width detail row (overflow specs that don't fit the grid) ─
function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "11px 14px", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function IlanDetayPage({ listings = LISTINGS, user, onRequireAuth, offers = [], onAddOffer, onReport }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sent, setSent] = useState(false);

  const l = listings.find((x) => String(x.id) === String(id));

  // ── empty state ──────────────────────────────────────────────────
  if (!l) {
    return (
      <div style={{ ...shell, paddingBottom: 96, alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px 96px" }}>
        <SEO title="İlan bulunamadı" description="Aradığınız ilan bulunamadı." />
        <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "0.08em" }}>404 · KAYIT YOK</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>İlan bulunamadı</h1>
        <p style={{ fontSize: 13, color: C.sub, marginTop: 6, maxWidth: 280 }}>
          Bu ilan kaldırılmış veya hiç var olmamış olabilir.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={() => navigate(-1)} style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 8, padding: "10px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            Geri
          </button>
          <button onClick={() => navigate("/ilanlar")} style={{ background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 8, padding: "10px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            Tüm ilanlar
          </button>
        </div>
      </div>
    );
  }

  // ── derived state (real listing fields) ──────────────────────────
  const cat = CATS.find((c) => c.id === l.cat);
  const tag = CAT_TAG[l.cat] || CAT_TAG.hafriyat;
  const listingOffers = offers.filter((o) => String(o.listingId) === String(l.id));
  const isOwner = user && l.ownerId && l.ownerId === user.id;
  const isFixed = l.priceType === "sabit" && l.price;
  const closed = l.status === "kapali" || l.status === "eslesti";
  const backhaul = l.type === "arac" ? loadsForVehicle(l, listings) : backhaulForJob(l, listings);
  const est = !isFixed && l.type === "is" && l.amount
    ? estimatePrice({ cat: l.cat, amount: l.amount, unit: l.unit, fromIl: l.il, toIl: l.varisIl, kmOverride: l.km })
    : null;

  // lowest offer for the sticky bar
  const offerPrices = listingOffers.map((o) => o.price).filter((p) => p != null);
  const lowest = offerPrices.length ? Math.min(...offerPrices) : null;

  // ── offer submit (identical logic) ──────────────────────────────
  const submitOffer = () => {
    if (!user) { onRequireAuth?.(); return; }
    if (!price && !message.trim()) { toast("Fiyat veya mesaj girin", "error"); return; }
    onAddOffer?.({
      id: newId(), listingId: l.id, fromUser: user.name, fromUserId: user.id,
      price: price ? Number(price) : null, message: message.trim(),
      status: "beklemede", createdAt: nowIso(),
    });
    setPrice(""); setMessage("");
    setSent(true);
    toast("Teklifiniz iletildi", "success");
  };

  // open the offer sheet OR route to auth, depending on user
  const openSheet = () => {
    if (!user) { onRequireAuth?.(); return; }
    setSent(false);
    setShowSheet(true);
  };

  const closeSheet = () => { setShowSheet(false); setSent(false); };

  // native share (visual share button; no-op when unsupported)
  const onShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: l.title, url }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => toast("Bağlantı kopyalandı", "success")).catch(() => {});
    }
  };

  const sheetInput = {
    width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 12, background: C.stone,
    padding: "12px 14px", fontSize: 14, color: C.ink, fontFamily: SANS, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ ...shell, paddingBottom: 96 }}>
      <SEO title={l.title} description={l.desc || `${cat?.name || ""} ilanı - ${l.il}${l.ilce ? " / " + l.ilce : ""}`} />

      {/* ── APP BAR ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 12px" }}>
        <button onClick={() => navigate(-1)} aria-label="Geri"
          style={{ width: 40, height: 40, border: `2px solid ${C.ink}`, borderRadius: 8, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={20} strokeWidth={2.6} color={C.ink} />
        </button>
        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.sub, letterSpacing: "0.06em" }}>{ilanNo(l.id)}</span>
        <button onClick={onShare} aria-label="Paylaş"
          style={{ width: 40, height: 40, border: `2px solid ${C.ink}`, borderRadius: 8, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Share2 size={18} strokeWidth={2.4} color={C.ink} />
        </button>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "4px 16px 0" }}>

        {/* category + type + status row */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span style={{ background: C.ink, color: tag.fg, fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", padding: "4px 9px", borderRadius: 6 }}>
            {tag.label}
          </span>
          <span style={{ background: C.card, color: C.ink, border: `1.5px solid ${C.ink}`, fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 6 }}>
            {l.type === "is" ? "İŞ İLANI" : "ARAÇ İLANI"}
          </span>
          {l.status === "eslesti" && (
            <span style={{ background: C.green, color: "#fff", fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>✓ EŞLEŞTİ</span>
          )}
          {l.status === "kapali" && (
            <span style={{ background: C.muted, color: "#fff", fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>KAPALI</span>
          )}
          {l.createdText && (
            <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, color: C.faint }}>{l.createdText}</span>
          )}
        </div>

        {/* title + location */}
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 800, lineHeight: 1.22, letterSpacing: "-0.01em", margin: 0 }}>{l.title}</h1>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.sub, marginTop: 8, letterSpacing: "0.02em" }}>
            ⌖ {l.il}{l.ilce ? `, ${l.ilce}` : ""}
            {l.type === "is" && l.varisIl ? `  →  ${l.varisIl}` : ""}
          </div>
        </div>

        {/* mini map */}
        <MiniMap km={l.km != null ? l.km : null} />

        {/* price estimate badge (teklife açık iş ilanı) */}
        {est && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start", background: C.yellow, border: `1.5px solid ${C.ink}`, borderRadius: 8, padding: "7px 12px" }}>
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>TAHMİNİ BÜTÇE</span>
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700 }}>{fmtTL(est.min)} – {fmtTL(est.max)}</span>
          </div>
        )}

        {/* 2x2 spec grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <SpecCell label="MALZEME" value={l.material || (cat?.name || "—")} />
          <SpecCell label="MİKTAR" value={l.amount ? `${l.amount} ${l.unit || ""}`.trim() : "—"} />
          <SpecCell label="ARAÇ" value={l.vehicle || vehicleClassOf(l)} />
          <SpecCell label="TARİH" value={l.dateText || "Belirtilmedi"} />
        </div>

        {/* overflow details (only render rows that exist) */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <DetailRow label="KONUM" value={`${l.il}${l.ilce ? " / " + l.ilce : ""}`} />
          <DetailRow label="YÜKLEME" value={l.yukleme} />
          <DetailRow label="BOŞALTMA" value={l.bosaltma} />
          {l.type === "is" && <DetailRow label="VARIŞ İLİ" value={l.varisIl} />}
          {l.km != null && <DetailRow label="MESAFE" value={`~${l.km} km`} />}
          <DetailRow label="KAPASİTE" value={l.capacity} />
          {l.recurring && <DetailRow label="TEKRAR" value={l.recurringText} />}
        </div>

        {/* description */}
        {l.desc && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 16px" }}>
            <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", marginBottom: 8 }}>AÇIKLAMA</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: C.sub, margin: 0 }}>{l.desc}</p>
          </div>
        )}

        {/* ── İLAN SAHİBİ ────────────────────────────────────────── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", marginBottom: 12 }}>İLAN SAHİBİ</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 10, background: C.ink, color: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, flexShrink: 0 }}>
              {String(l.owner || "?").charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.owner || "—"}</span>
                {l.ownerVerified && <BadgeCheck size={17} strokeWidth={2.4} color={C.green} fill="none" />}
              </div>
              {l.ownerRating != null && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                  <Star size={13} strokeWidth={2.4} color={C.yellowDeep} fill={C.yellow} />
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.sub }}>{l.ownerRating}</span>
                </div>
              )}
            </div>
            <button onClick={() => navigate("/mesajlar")} aria-label="Mesaj gönder"
              style={{ width: 42, height: 42, border: `2px solid ${C.ink}`, borderRadius: 10, background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
              <MessageSquare size={18} strokeWidth={2.4} color={C.ink} />
            </button>
          </div>
        </div>

        {/* ── Backhaul / dönüş yükü ──────────────────────────────── */}
        {backhaul.length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: C.ink }}>
                {l.type === "arac" ? "BU ARACA UYGUN YÜKLER" : "DÖNÜŞ YÜKÜ FIRSATI"}
              </span>
              <span style={{ background: C.yellow, border: `1.5px solid ${C.ink}`, fontFamily: MONO, fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>YENİ</span>
            </div>
            <p style={{ fontSize: 12, color: C.sub, margin: "0 0 12px", lineHeight: 1.5 }}>
              {l.type === "arac"
                ? `${vehicleClassOf(l)} aracınıza uygun yakın işler (sefer tahmini dahil).`
                : "Bu işi alan araç dönüşte boş gitmesin — güzergaha uygun yükler."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {backhaul.map((m) => (
                <button key={m.listing.id} onClick={() => navigate(`/ilan/${m.listing.id}`)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 12, background: C.stone, textAlign: "left", cursor: "pointer", width: "100%" }}>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, background: C.card, border: `1.5px solid ${C.ink}`, padding: "1px 6px", borderRadius: 4 }}>
                        {(m.fromIl || "—")} → {(m.toIl || "—")}
                      </span>
                      {m.roundTrip && (
                        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, background: C.green, color: "#fff", padding: "1px 6px", borderRadius: 4 }}>TAM TUR ↺</span>
                      )}
                    </span>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.listing.title}</span>
                    <span style={{ display: "block", fontFamily: MONO, fontSize: 10, color: C.sub, marginTop: 3 }}>
                      ⌖ {m.listing.il}{m.listing.amount ? ` · ${m.listing.amount} ${m.listing.unit || ""}` : ""}{m.trips ? ` · ~${m.trips} sefer` : ""}
                    </span>
                  </span>
                  <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 9, fontWeight: 700, background: C.yellow, border: `1.5px solid ${C.ink}`, padding: "4px 8px", borderRadius: 6 }}>{m.fit}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Owner / closed banner (in-flow; replaces sticky CTA logic) ── */}
        {isOwner && (
          <div style={{ background: "#EEF6FF", border: "1.5px solid #BFDBFE", borderRadius: 14, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1E40AF" }}>Bu sizin ilanınız.</div>
            <button onClick={() => navigate("/ilanlarim")}
              style={{ marginTop: 10, background: "#1E40AF", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
              Teklifleri yönet
            </button>
          </div>
        )}
        {!isOwner && closed && (
          <div style={{ background: C.stone, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, textAlign: "center", fontSize: 13, fontWeight: 700, color: C.sub }}>
            {l.status === "eslesti" ? "Bu ilan eşleşti, yeni teklif alınmıyor." : "Bu ilan kapatıldı, yeni teklif alınmıyor."}
          </div>
        )}

        {/* ── Gelen teklifler ────────────────────────────────────── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", marginBottom: 12 }}>
            GELEN TEKLİFLER ({listingOffers.length})
          </div>
          {listingOffers.length === 0 ? (
            <p style={{ fontSize: 13, color: C.faint, margin: 0 }}>Henüz teklif yok. İlk teklifi siz verin.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {listingOffers.map((o) => {
                const s = OFFER_STATUS[o.status] || OFFER_STATUS.beklemede;
                return (
                  <div key={o.id} style={{ border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 13, background: C.stone }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{o.fromUser}</span>
                      <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, background: s.bg, color: s.fg, padding: "2px 7px", borderRadius: 5 }}>{s.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontSize: 13, color: C.sub, minWidth: 0 }}>{o.message || "—"}</span>
                      {o.price != null && (
                        <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>₺{o.price.toLocaleString("tr-TR")}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 6 }}>{fmtDate(o.createdAt)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* report link */}
        <button onClick={() => setShowReport(true)}
          style={{ alignSelf: "center", marginTop: 2, background: "none", border: "none", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: "0.04em", cursor: "pointer" }}>
          ⚠ BU İLANI ŞİKAYET ET
        </button>
      </div>

      {/* ── STICKY BOTTOM "Teklif ver" BAR ───────────────────────── */}
      {/* sits above the global tab bar; only shown when an offer is possible */}
      {!isOwner && !closed && (
        <div style={{ position: "sticky", bottom: 12, marginTop: 16, padding: "0 16px", zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.ink, borderRadius: 14, padding: "12px 14px", boxShadow: "0 10px 30px rgba(10,10,10,0.25)" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: "0.06em" }}>
                {isFixed ? "SABİT FİYAT" : lowest != null ? "EN DÜŞÜK TEKLİF" : "FİYAT"}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.yellow }}>
                  {isFixed ? `₺${l.price.toLocaleString("tr-TR")}` : lowest != null ? `₺${lowest.toLocaleString("tr-TR")}` : "Teklife açık"}
                </span>
                {listingOffers.length > 0 && (
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{listingOffers.length} teklif</span>
                )}
              </div>
            </div>
            <button onClick={openSheet}
              style={{ display: "flex", alignItems: "center", gap: 7, background: C.yellow, color: C.ink, border: "none", borderRadius: 10, padding: "11px 16px", fontWeight: 800, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
              {user ? "Teklif ver" : "Giriş yap"} <ArrowRight size={16} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      )}

      {/* ── OFFER SHEET (bottom sheet) ───────────────────────────── */}
      {showSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(10,10,10,0.45)", backdropFilter: "blur(2px)" }} onClick={closeSheet}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 460, background: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, border: `2px solid ${C.ink}`, borderBottom: "none", padding: "18px 18px 28px", maxHeight: "88vh", overflowY: "auto" }}>

            {sent ? (
              // ── Sent confirmation screen ──
              <div style={{ textAlign: "center", padding: "20px 8px 8px" }}>
                <div style={{ width: 64, height: 64, margin: "0 auto", borderRadius: 14, background: C.green, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Send size={28} strokeWidth={2.4} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>Teklif gönderildi</div>
                <p style={{ fontSize: 13, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>
                  Teklifiniz ilan sahibine iletildi. Yanıt geldiğinde mesajlardan haberdar olursunuz.
                </p>
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button onClick={() => navigate("/mesajlar")}
                    style={{ flex: 1, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 10, padding: "12px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                    Mesajlar
                  </button>
                  <button onClick={closeSheet}
                    style={{ flex: 1, background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 10, padding: "12px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                    Kapat
                  </button>
                </div>
              </div>
            ) : (
              // ── Offer form ──
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.06em" }}>{ilanNo(l.id)} · TEKLİF VER</div>
                  <button onClick={closeSheet} aria-label="Kapat"
                    style={{ width: 34, height: 34, border: `2px solid ${C.ink}`, borderRadius: 8, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={16} strokeWidth={2.6} color={C.ink} />
                  </button>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: "6px 0 2px", lineHeight: 1.25 }}>{l.title}</h2>
                <div style={{ fontFamily: MONO, fontSize: 11, color: C.sub }}>⌖ {l.il}{l.ilce ? `, ${l.ilce}` : ""}</div>

                {est && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12, background: C.yellow, border: `1.5px solid ${C.ink}`, borderRadius: 8, padding: "6px 11px" }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.05em" }}>TAHMİNİ</span>
                    <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>{fmtTL(est.min)} – {fmtTL(est.max)}</span>
                  </div>
                )}

                {/* price input */}
                <label style={{ display: "block", fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", margin: "18px 0 7px" }}>TEKLİF FİYATINIZ (₺)</label>
                <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="örn. 18.000" style={{ ...sheetInput, fontFamily: MONO, fontWeight: 700, fontSize: 16 }} />

                {/* listing price type chip (informational, real l.priceType) */}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, padding: "4px 9px", borderRadius: 6, border: `1.5px solid ${C.ink}`, background: l.priceType === "sabit" ? C.yellow : C.card }}>
                    {l.priceType === "sabit" ? "SABİT FİYAT İLANI" : "TEKLİFE AÇIK İLAN"}
                  </span>
                  {isFixed && (
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.sub, alignSelf: "center" }}>İlan fiyatı: ₺{l.price.toLocaleString("tr-TR")}</span>
                  )}
                </div>

                {/* message */}
                <label style={{ display: "block", fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", margin: "16px 0 7px" }}>MESAJINIZ</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Müsaitlik, araç, koşullar…" rows={3}
                  style={{ ...sheetInput, minHeight: 84, resize: "vertical" }} />

                {/* submit */}
                <button onClick={submitOffer}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 18, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 12, padding: "14px", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                  <Send size={17} strokeWidth={2.4} /> Teklif gönder
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── REPORT MODAL ─────────────────────────────────────────── */}
      {showReport && (
        <ReportModal
          targetLabel={`İlan: ${l.title}`}
          onClose={() => setShowReport(false)}
          onSubmit={(p) => { onReport?.({ type: "listing", targetId: l.id, listingId: l.id, fromId: user?.id || null, fromName: user?.name || "misafir", ...p }); }}
        />
      )}
    </div>
  );
}
