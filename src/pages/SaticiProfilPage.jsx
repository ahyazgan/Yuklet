import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, Star, MapPin, Clock, Building2, Package, Truck, ShieldCheck, ArrowLeft, ArrowRight, MessageCircle, AlertTriangle } from "lucide-react";
import SEO from "../components/SEO";
import Logo from "../components/Logo";
import ReportModal from "../components/ReportModal";
import { StarsDisplay } from "../components/Stars";
import { visibleReviewsFor } from "../utils/reviewGate";
import { computeReliability } from "../utils/reliability";
import { isSupabaseConfigured } from "../lib/supabase";
import { getProfile } from "../lib/api";

// ── SAHA herkese açık SATICI vitrini — bir MAĞAZA gibi kurgulanır.
//    Kahraman = fiyatlı ürün kataloğu (alıcının tek sorusu: ne satıyor, kaça,
//    stok var mı, kapıya getirir mi?). Mağaza künyesi (hakkında/konum/saat)
//    ikincildir. Salt-okunur; alanlar ProfilPage'te düzenlenir.

const C = {
  ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA", border: "#E3DDD0", line: "#F0ECE3",
  sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const ARCHIVO = "'Archivo', system-ui, sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const shell = {
  width: "100%", maxWidth: 460, margin: "0 auto", minHeight: "100vh",
  display: "flex", flexDirection: "column", background: C.bg, fontFamily: "inherit",
};
const cardSt = { background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 16, boxShadow: "6px 6px 0 rgba(10,10,10,.12)" };
const sectionTitle = { fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em", textTransform: "uppercase", margin: "0 0 12px" };

// Stok seviyesi rozet renkleri — vitrin sinyali (bol/orta/az).
const STOCK_BADGE = {
  bol:  { label: "Bol stok",  bg: "#E6F4EA", fg: "#16803C", bd: "#16803C" },
  orta: { label: "Orta stok", bg: "#FEF6E0", fg: "#92600A", bd: "#E0B400" },
  az:   { label: "Az stok",   bg: "#FDECEC", fg: "#DC2626", bd: "#DC2626" },
};

function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
function fmtRev(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return ""; }
}

export default function SaticiProfilPage({ user, users = [], listings = [], reviews = [], getUserRating, onReport }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Satıcıyı id ile çöz: önce kullanıcı listesinden / kendi profilimden.
  const localSeller = useMemo(() => {
    const fromUsers = users.find((u) => String(u.id) === String(id));
    if (fromUsers) return fromUsers;
    if (user && String(user.id) === String(id)) return user;
    return null;
  }, [users, user, id]);

  // Supabase modunda users state boş olur → profili DB'den çek.
  // fetched.for = hangi id için çözüldüğü; id değişince eski sonuç yok sayılır.
  const needsFetch = isSupabaseConfigured && !localSeller;
  const [fetched, setFetched] = useState({ for: null, profile: null });
  useEffect(() => {
    if (!needsFetch) return;
    let alive = true;
    getProfile(id)
      .then((p) => { if (alive) setFetched({ for: id, profile: p || null }); })
      .catch(() => { if (alive) setFetched({ for: id, profile: null }); });
    return () => { alive = false; };
  }, [id, needsFetch]);

  const resolved = String(fetched.for) === String(id);
  const seller = localSeller || (resolved ? fetched.profile : null);
  const loading = needsFetch && !resolved;

  // Satıcının kendi açtığı AKTİF ilanları (ürün/diğer).
  const sellerListings = useMemo(
    () => listings.filter((l) => String(l.ownerId) === String(id) && l.status !== "kapali"),
    [listings, id]
  );

  const rating = getUserRating?.(id);
  const sellerReviews = visibleReviewsFor(id, reviews).slice(0, 8);
  const rel = seller ? computeReliability(id, { listings, offers: [], reviews }) : null;
  const isMe = user && String(user.id) === String(id);
  const [showReport, setShowReport] = useState(false);

  // ── Yükleniyor (SB profil çekimi) ──
  if (loading) {
    return (
      <div style={shell}>
        <SEO title="Satıcı" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Yükleniyor…</span>
        </div>
      </div>
    );
  }

  // ── Satıcı bulunamadı ──
  if (!seller || seller.role !== "tedarikci") {
    return (
      <div style={shell}>
        <SEO title="Satıcı" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <Logo size="lg" />
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Satıcı bulunamadı</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: 0, maxWidth: 280 }}>Bu satıcı profili mevcut değil veya kaldırılmış olabilir.</p>
          <button onClick={() => navigate("/ilanlar")}
            style={{ marginTop: 4, background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 22px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
            İlanlara dön
          </button>
        </div>
      </div>
    );
  }

  const avgRating = rating ? rating.avg : (seller.rating ?? 5.0);
  const malzemeler = Array.isArray(seller.malzemeler) ? seller.malzemeler : [];
  const konum = [seller.ilce, seller.sehir].filter(Boolean).join(", ");

  // ── Vitrin türetimleri (katalog kahraman) ──
  const products = sellerListings;
  const withPrice = products.filter((l) => Number(l.price) > 0);
  const lowestPrice = withPrice.length ? Math.min(...withPrice.map((l) => Number(l.price))) : null;
  const anyDelivery = products.some((l) => l.deliveryIncluded);

  return (
    <div style={shell}>
      <SEO title={`${seller.name} — Satıcı`} description={seller.hakkinda || "Satıcı profili, ürün ilanları ve değerlendirmeler."} />

      {/* ── Üst kimlik bloğu (koyu header + hazard) ── */}
      <div style={{ background: C.ink, padding: "14px 20px 22px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 14, backgroundImage: HAZARD }} />

        {/* Geri */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 18 }}>
          <button onClick={() => navigate(-1)} aria-label="Geri"
            style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.25)", borderRadius: 6, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={18} color="#fff" strokeWidth={2} />
          </button>
          {isMe && (
            <button onClick={() => navigate("/profil")}
              style={{ background: "transparent", border: `2px solid ${C.yellow}`, color: C.yellow, borderRadius: 6, padding: "7px 11px", fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, cursor: "pointer" }}>
              Profili düzenle
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, paddingRight: 18 }}>
          <div style={{ width: 60, height: 60, borderRadius: 6, background: C.yellow, border: `2px solid ${C.ink}`, boxShadow: "0 0 0 2px #fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: ARCHIVO, fontSize: 22, fontWeight: 900, color: C.ink }}>{initials(seller.name)}</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: ARCHIVO, fontSize: 19, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seller.name}</span>
              {seller.verified && <BadgeCheck size={18} color={C.yellow} strokeWidth={2.2} style={{ flexShrink: 0 }} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.yellow, border: `2px solid ${C.yellow}`, padding: "2px 7px", borderRadius: 5, letterSpacing: 0.5 }}>SATICI</span>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.yellow, display: "flex", alignItems: "center", gap: 3 }}>
                <Star size={11} fill={C.yellow} color={C.yellow} /> {Number(avgRating).toFixed(1)}
              </span>
            </div>
            {seller.tesisTuru && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seller.tesisTuru}</div>
            )}
          </div>
        </div>

        {/* İstatistik bandı — mağaza odaklı: puan · ürün sayısı · güven */}
        <div style={{ display: "flex", marginTop: 18, marginRight: 18, border: "2px solid rgba(255,255,255,0.18)", borderRadius: 6, overflow: "hidden" }}>
          {[
            { v: Number(avgRating).toFixed(1), l: "PUAN", accent: true },
            { v: String(products.length), l: "ÜRÜN" },
            { v: rel?.score != null ? `%${rel.score}` : "—", l: "GÜVEN" },
          ].map((s, i) => (
            <div key={s.l} style={{ flex: 1, textAlign: "center", padding: "11px 4px", borderLeft: i > 0 ? "2px solid rgba(255,255,255,0.14)" : "none" }}>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: s.accent ? C.yellow : "#fff" }}>{s.v}</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 2, letterSpacing: 0.6 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 8, backgroundImage: HAZARD }} />

      {/* ── Gövde: MAĞAZA VİTRİNİ ── */}
      <div style={{ flex: 1, padding: "18px 16px 110px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ÜRÜN KATALOĞU — vitrinin kahramanı, en üstte */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={cardSt}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: products.length > 0 ? 12 : 0 }}>
            <h2 style={{ ...sectionTitle, margin: 0, display: "flex", alignItems: "center", gap: 7 }}>
              <Package size={16} strokeWidth={2.4} color={C.ink} /> Ürün kataloğu
            </h2>
            {products.length > 0 && (
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.ink, background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "2px 8px" }}>{products.length} ÜRÜN</span>
            )}
          </div>

          {/* vitrin özet bandı: en düşük fiyat + teslimat sinyali */}
          {products.length > 0 && (lowestPrice != null || anyDelivery) && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {lowestPrice != null && (
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.green, background: "#E6F4EA", border: `2px solid ${C.green}`, borderRadius: 5, padding: "5px 10px" }}>
                  En düşük {lowestPrice.toLocaleString("tr-TR")} ₺/ton
                </span>
              )}
              {anyDelivery && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink, background: C.stone, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "5px 10px" }}>
                  <Truck size={13} strokeWidth={2.4} /> Kapıya teslim var
                </span>
              )}
            </div>
          )}

          {products.length === 0 ? (
            <p style={{ fontFamily: MONO, fontSize: 11, color: C.faint, margin: "12px 0 0", lineHeight: 1.5 }}>Bu satıcının yayında ürünü yok.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {products.map((l) => {
                const sb = STOCK_BADGE[l.stock] || null;
                const price = Number(l.price) > 0 ? Number(l.price) : null;
                return (
                  <button key={l.id} onClick={() => { navigate(`/ilan/${l.id}`); window.scrollTo(0, 0); }}
                    style={{ textAlign: "left", width: "100%", border: `2px solid ${C.ink}`, borderRadius: 6, padding: 13, background: C.card, cursor: "pointer", boxShadow: "3px 3px 0 rgba(10,10,10,.08)" }}>
                    {/* üst rozet satırı: kategori + stok + nakliye */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: l.cat === "hafriyat" ? C.ink : C.yellow, background: l.cat === "hafriyat" ? C.yellow : C.ink, border: `2px solid ${C.ink}`, borderRadius: 4, padding: "2px 7px" }}>
                        {l.cat === "hafriyat" ? "HAFRİYAT" : "SİLOBAS"}
                      </span>
                      {sb && (
                        <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: sb.fg, background: sb.bg, border: `2px solid ${sb.bd}`, borderRadius: 4, padding: "2px 7px" }}>{sb.label}</span>
                      )}
                      {l.deliveryIncluded && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.green, background: "#E6F4EA", border: `2px solid ${C.green}`, borderRadius: 4, padding: "2px 7px" }}>
                          <Truck size={11} strokeWidth={2.4} /> Nakliye dahil
                        </span>
                      )}
                    </div>
                    {/* ürün adı */}
                    <div style={{ fontFamily: ARCHIVO, fontSize: 15, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.15 }}>{l.title}</div>
                    {/* konum + malzeme */}
                    <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.sub, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={12} strokeWidth={2.2} /> {[l.il, l.ilce].filter(Boolean).join(" / ")}{l.material ? ` · ${l.material}` : ""}
                    </div>
                    {/* fiyat + incele */}
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 10 }}>
                      <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: C.ink }}>
                        {price != null ? `${price.toLocaleString("tr-TR")} ₺` : "Fiyat sor"}
                        {price != null && <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}> /ton</span>}
                      </span>
                      <span style={{ fontFamily: ARCHIVO, fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: C.ink, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        İncele <ArrowRight size={13} strokeWidth={2.6} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Sattığı malzemeler — hızlı katalog taraması */}
        {malzemeler.length > 0 && (
          <section style={cardSt}>
            <h2 style={sectionTitle}>Sattığı malzemeler</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {malzemeler.map((m) => (
                <span key={m} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "6px 10px", borderRadius: 6, border: `2px solid ${C.ink}`, background: C.stone, color: C.ink }}>{m}</span>
              ))}
            </div>
          </section>
        )}

        {/* Mağaza bilgisi (künye) — hakkında + konum + saat, ikincil */}
        <section style={cardSt}>
          <h2 style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 7 }}>
            <Building2 size={16} strokeWidth={2.4} color={C.ink} /> Mağaza bilgisi
          </h2>
          {seller.hakkinda ? (
            <p style={{ fontSize: 13, color: C.sub, margin: "0 0 14px", lineHeight: 1.55 }}>{seller.hakkinda}</p>
          ) : (
            <p style={{ fontFamily: MONO, fontSize: 11, color: C.faint, margin: "0 0 14px", lineHeight: 1.5 }}>Satıcı henüz tanıtım eklemedi.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {konum && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: MONO, fontSize: 12, color: C.ink }}>
                <MapPin size={15} strokeWidth={2.2} color={C.sub} /> {konum}
              </div>
            )}
            {seller.calismaSaatleri && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: MONO, fontSize: 12, color: C.ink }}>
                <Clock size={15} strokeWidth={2.2} color={C.sub} /> {seller.calismaSaatleri}
              </div>
            )}
            {seller.verified && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: MONO, fontSize: 12, color: C.green, fontWeight: 700 }}>
                <ShieldCheck size={15} strokeWidth={2.4} color={C.green} /> Belgeleri doğrulanmış satıcı
              </div>
            )}
          </div>
        </section>

        {/* Değerlendirmeler */}
        {(rating || sellerReviews.length > 0) && (
          <section style={cardSt}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ ...sectionTitle, margin: 0 }}>Değerlendirmeler</h2>
              {rating && <StarsDisplay value={rating.avg} count={rating.count} className="text-sm" />}
            </div>
            {sellerReviews.length === 0 ? (
              <p style={{ fontFamily: MONO, fontSize: 11, color: C.faint, margin: 0, lineHeight: 1.5 }}>Henüz değerlendirme yok.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sellerReviews.map((r) => (
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

        {/* Mesaj CTA (kendi profilimde gizli) — vitrin dili: fiyat sor */}
        {!isMe && (
          <button type="button" onClick={() => navigate("/mesajlar")}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.yellow, border: `2px solid ${C.ink}`, color: C.ink, borderRadius: 6, padding: "15px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
            <MessageCircle size={18} strokeWidth={2.4} /> Satıcıya yaz — fiyat sor
          </button>
        )}

        {/* Şikayet et (kendi profilimde gizli) */}
        {!isMe && (
          <button type="button" onClick={() => setShowReport(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
            <AlertTriangle size={15} strokeWidth={2.4} color={C.red} /> Şikayet et
          </button>
        )}
      </div>

      {/* ── REPORT MODAL ── */}
      {showReport && (
        <ReportModal
          targetLabel={`Kullanıcı: ${seller.name}`}
          onClose={() => setShowReport(false)}
          onSubmit={(p) => onReport?.({ type: "user", targetId: id, listingId: null, fromId: user?.id || null, fromName: user?.name || "misafir", ...p })}
        />
      )}
    </div>
  );
}
