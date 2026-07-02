import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, Star, MapPin, Globe, Building2, Briefcase, ShieldCheck, ArrowLeft, MessageCircle, AlertTriangle } from "lucide-react";
import SEO from "../components/SEO";
import Logo from "../components/Logo";
import ReportModal from "../components/ReportModal";
import { StarsDisplay } from "../components/Stars";
import { visibleReviewsFor } from "../utils/reviewGate";
import { computeReliability } from "../utils/reliability";
import { isSupabaseConfigured } from "../lib/supabase";
import { getProfile } from "../lib/api";

// ── SAHA herkese açık ALICI (işveren) vitrini — nakliyeciler bir alıcıyı buradan görür.
//    Salt-okunur: firma bilgileri (ProfilPage'te düzenlenir), açık iş ilanları,
//    aldığı değerlendirmeler. Görsel dil = SaticiProfilPage ile aynı.

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
// Web adresini güvenli http linkine çevir (kullanıcı "ornek.com" yazmış olabilir).
function webHref(w) {
  const s = String(w || "").trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

export default function AliciProfilPage({ user, users = [], listings = [], reviews = [], getUserRating, onReport }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Alıcıyı id ile çöz: önce kullanıcı listesinden / kendi profilimden.
  const localBuyer = useMemo(() => {
    const fromUsers = users.find((u) => String(u.id) === String(id));
    if (fromUsers) return fromUsers;
    if (user && String(user.id) === String(id)) return user;
    return null;
  }, [users, user, id]);

  // Supabase modunda users state boş olur → profili DB'den çek.
  const needsFetch = isSupabaseConfigured && !localBuyer;
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
  const buyer = localBuyer || (resolved ? fetched.profile : null);
  const loading = needsFetch && !resolved;

  // Alıcının açtığı AKTİF iş ilanları.
  const buyerListings = useMemo(
    () => listings.filter((l) => String(l.ownerId) === String(id) && l.type === "is" && l.status !== "kapali"),
    [listings, id]
  );

  const rating = getUserRating?.(id);
  const buyerReviews = visibleReviewsFor(id, reviews).slice(0, 8);
  const rel = buyer ? computeReliability(id, { listings, offers: [], reviews }) : null;
  const isMe = user && String(user.id) === String(id);
  const [showReport, setShowReport] = useState(false);

  // ── Yükleniyor ──
  if (loading) {
    return (
      <div style={shell}>
        <SEO title="Firma" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Yükleniyor…</span>
        </div>
      </div>
    );
  }

  // ── Alıcı bulunamadı ──
  if (!buyer || buyer.role !== "isveren") {
    return (
      <div style={shell}>
        <SEO title="Firma" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <Logo size="lg" />
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Firma bulunamadı</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: 0, maxWidth: 280 }}>Bu firma profili mevcut değil veya kaldırılmış olabilir.</p>
          <button onClick={() => navigate("/ilanlar")}
            style={{ marginTop: 4, background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 22px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
            İlanlara dön
          </button>
        </div>
      </div>
    );
  }

  const avgRating = rating ? rating.avg : (buyer.rating ?? 5.0);
  const faaliyet = Array.isArray(buyer.faaliyetAlani) ? buyer.faaliyetAlani : [];
  const konum = [buyer.ilce, buyer.sehir].filter(Boolean).join(", ");
  const web = webHref(buyer.web);

  return (
    <div style={shell}>
      <SEO title={`${buyer.name} — Firma`} description={buyer.hakkinda || "Firma profili, iş ilanları ve değerlendirmeler."} />

      {/* ── Üst kimlik bloğu (koyu header + hazard) ── */}
      <div style={{ background: C.ink, padding: "14px 20px 22px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 14, backgroundImage: HAZARD }} />

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
            <span style={{ fontFamily: ARCHIVO, fontSize: 22, fontWeight: 900, color: C.ink }}>{initials(buyer.name)}</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: ARCHIVO, fontSize: 19, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{buyer.name}</span>
              {buyer.verified && <BadgeCheck size={18} color={C.yellow} strokeWidth={2.2} style={{ flexShrink: 0 }} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.yellow, border: `2px solid ${C.yellow}`, padding: "2px 7px", borderRadius: 5, letterSpacing: 0.5 }}>ALICI</span>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.yellow, display: "flex", alignItems: "center", gap: 3 }}>
                <Star size={11} fill={C.yellow} color={C.yellow} /> {Number(avgRating).toFixed(1)}
              </span>
            </div>
            {buyer.firmaTuru && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{buyer.firmaTuru}</div>
            )}
          </div>
        </div>

        {/* İstatistik bandı */}
        <div style={{ display: "flex", marginTop: 18, marginRight: 18, border: "2px solid rgba(255,255,255,0.18)", borderRadius: 6, overflow: "hidden" }}>
          {[
            { v: Number(avgRating).toFixed(1), l: "PUAN", accent: true },
            { v: String(buyerListings.length), l: "İLAN" },
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

      {/* ── Gövde ── */}
      <div style={{ flex: 1, padding: "18px 16px 110px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Hakkında + künye */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={cardSt}>
          <h2 style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 7 }}>
            <Building2 size={16} strokeWidth={2.4} color={C.ink} /> Hakkında
          </h2>
          {buyer.hakkinda ? (
            <p style={{ fontSize: 13, color: C.sub, margin: "0 0 14px", lineHeight: 1.55 }}>{buyer.hakkinda}</p>
          ) : (
            <p style={{ fontFamily: MONO, fontSize: 11, color: C.faint, margin: "0 0 14px", lineHeight: 1.5 }}>Firma henüz tanıtım eklemedi.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {konum && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: MONO, fontSize: 12, color: C.ink }}>
                <MapPin size={15} strokeWidth={2.2} color={C.sub} /> {konum}
              </div>
            )}
            {web && (
              <a href={web} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: MONO, fontSize: 12, color: C.ink, textDecoration: "underline" }}>
                <Globe size={15} strokeWidth={2.2} color={C.sub} /> {buyer.web}
              </a>
            )}
            {buyer.verified && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: MONO, fontSize: 12, color: C.green, fontWeight: 700 }}>
                <ShieldCheck size={15} strokeWidth={2.4} color={C.green} /> Belgeleri doğrulanmış firma
              </div>
            )}
          </div>
        </motion.section>

        {/* Faaliyet alanı */}
        {faaliyet.length > 0 && (
          <section style={cardSt}>
            <h2 style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 7 }}>
              <Briefcase size={16} strokeWidth={2.4} color={C.ink} /> Faaliyet alanı
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {faaliyet.map((m) => (
                <span key={m} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "6px 10px", borderRadius: 6, border: `2px solid ${C.ink}`, background: C.stone, color: C.ink }}>{m}</span>
              ))}
            </div>
          </section>
        )}

        {/* Açık iş ilanları */}
        <section style={cardSt}>
          <h2 style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 7 }}>
            <Briefcase size={16} strokeWidth={2.4} color={C.ink} /> İş ilanları
          </h2>
          {buyerListings.length === 0 ? (
            <p style={{ fontFamily: MONO, fontSize: 11, color: C.faint, margin: 0, lineHeight: 1.5 }}>Bu firmanın yayında ilanı yok.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {buyerListings.map((l) => (
                <button key={l.id} onClick={() => { navigate(`/ilan/${l.id}`); window.scrollTo(0, 0); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", width: "100%", border: `2px solid ${C.ink}`, borderRadius: 6, padding: 11, background: C.card, cursor: "pointer" }}>
                  <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 5, background: C.stone, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Briefcase size={18} color={C.ink} strokeWidth={2} />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</span>
                    <span style={{ display: "block", fontFamily: MONO, fontSize: 10, color: C.sub, marginTop: 2 }}>
                      {[l.il, l.material, l.amount ? `${l.amount} ${l.unit || ""}`.trim() : ""].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {l.priceType === "sabit" && l.price != null && (
                    <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.green, whiteSpace: "nowrap" }}>{Number(l.price).toLocaleString("tr-TR")} ₺</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Değerlendirmeler */}
        {(rating || buyerReviews.length > 0) && (
          <section style={cardSt}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ ...sectionTitle, margin: 0 }}>Değerlendirmeler</h2>
              {rating && <StarsDisplay value={rating.avg} count={rating.count} className="text-sm" />}
            </div>
            {buyerReviews.length === 0 ? (
              <p style={{ fontFamily: MONO, fontSize: 11, color: C.faint, margin: 0, lineHeight: 1.5 }}>Henüz değerlendirme yok.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {buyerReviews.map((r) => (
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

        {/* Mesaj CTA (kendi profilimde gizli) */}
        {!isMe && (
          <button type="button" onClick={() => navigate("/mesajlar")}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.yellow, border: `2px solid ${C.ink}`, color: C.ink, borderRadius: 6, padding: "15px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
            <MessageCircle size={18} strokeWidth={2.4} /> Firmaya mesaj gönder
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
          targetLabel={`Kullanıcı: ${buyer.name}`}
          onClose={() => setShowReport(false)}
          onSubmit={(p) => onReport?.({ type: "user", targetId: id, listingId: null, fromId: user?.id || null, fromName: user?.name || "misafir", ...p })}
        />
      )}
    </div>
  );
}
