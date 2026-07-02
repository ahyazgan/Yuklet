import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Coffee, MapPin, Phone, MessageCircle, ShieldCheck, Trash2, ChevronRight, ChevronLeft as ChevLeft, User, AlertTriangle } from "lucide-react";
import { useToast } from "../components/Toast";
import SEO from "../components/SEO";
import ReportModal from "../components/ReportModal";
import { catOf } from "../data/molaCats";

// ── Mola ilan DETAY sayfası — galeri + tüm bilgiler + sahip künyesi (profile git) +
//    Mesaj/Ara + sahibinin diğer ilanları. Karttan tıklayınca buraya gelinir.

const C = {
  ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA", border: "#E3DDD0", line: "#F0ECE3",
  sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const ARCHIVO = "'Archivo', system-ui, sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const shell = { width: "100%", maxWidth: 460, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: C.bg };
const cardSt = { background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 14, boxShadow: "3px 3px 0 rgba(10,10,10,.12)" };

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return ""; }
}
function initials(n) { return (n || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?"; }

export default function MolaDetayPage({ user, posts = [], onFetchPost, onRemovePost, onReport, onRequireAuth }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [idx, setIdx] = useState(0);          // galeri aktif foto
  const [confirmDel, setConfirmDel] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Listeden bul; yoksa (cold-launch/deep link) id ile tek tek çek.
  const listPost = useMemo(() => posts.find((p) => String(p.id) === String(id)), [posts, id]);
  const [fetched, setFetched] = useState(undefined); // undefined=yükleniyor, null=yok
  useEffect(() => {
    if (listPost || !onFetchPost) return;
    let alive = true;
    onFetchPost(id).then((p) => { if (alive) setFetched(p || null); }).catch(() => { if (alive) setFetched(null); });
    return () => { alive = false; };
  }, [id, listPost, onFetchPost]);
  const post = listPost || fetched || null;
  const loading = !listPost && onFetchPost && fetched === undefined;

  // ── Gate: giriş yok ──
  if (!user) {
    return (
      <div style={shell}>
        <SEO title="Mola — İlan" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Coffee size={30} color={C.yellow} strokeWidth={2.2} />
          </div>
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Giriş gerekli</h1>
          <button onClick={() => onRequireAuth?.()} style={{ marginTop: 4, background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 22px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>Giriş yap</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={shell}>
        <SEO title="Mola — İlan" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontFamily: ARCHIVO, fontSize: 14, fontWeight: 700, color: C.sub }}>İlan yükleniyor…</p>
        </div>
      </div>
    );
  }

  // ── Not found / nakliyeci değil ──
  if (user.role !== "nakliyeci" || !post) {
    return (
      <div style={shell}>
        <SEO title="Mola — İlan" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Coffee size={30} color={C.yellow} strokeWidth={2.2} />
          </div>
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>{user.role !== "nakliyeci" ? "Nakliyecilere özel" : "İlan bulunamadı"}</h1>
          <button onClick={() => navigate("/mola")} style={{ marginTop: 4, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 20px", fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>Mola Yeri</button>
        </div>
      </div>
    );
  }

  const c = catOf(post.category);
  const CatIcon = c.Icon;
  const images = Array.isArray(post.images) ? post.images : [];
  const mine = String(post.ownerId) === String(user.id);
  const activeIdx = Math.min(idx, Math.max(0, images.length - 1));

  // Sahibinin diğer aktif ilanları (bu hariç).
  const otherPosts = posts.filter((p) => String(p.ownerId) === String(post.ownerId) && String(p.id) !== String(post.id));

  const doRemove = async () => {
    setConfirmDel(false);
    const res = await onRemovePost?.(post.id);
    if (res && res.ok === false) { toast(res.error || "Silinemedi", "error"); return; }
    toast("Gönderi silindi", "info");
    navigate("/mola");
  };

  return (
    <div style={shell}>
      <SEO title={`${post.title} — Mola`} description={post.body || "Nakliyeci topluluk ilanı"} />

      {/* Header */}
      <div style={{ background: C.ink, padding: "14px 18px", color: "#fff", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 14, backgroundImage: HAZARD }} />
        <button onClick={() => navigate("/mola")} aria-label="Geri" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: "transparent", border: "2px solid rgba(255,255,255,0.25)", borderRadius: 6, color: "#fff", cursor: "pointer", flexShrink: 0 }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 16, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</h1>
          <div style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>Mola Yeri · {c.short}</div>
        </div>
      </div>
      <div style={{ height: 8, backgroundImage: HAZARD }} />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, padding: "16px 16px 120px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Galeri ── */}
        {images.length > 0 ? (
          <div>
            <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", borderRadius: 6, border: `2px solid ${C.ink}`, overflow: "hidden", background: C.stone }}>
              <img src={images[activeIdx]} alt={`${post.title} ${activeIdx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {images.length > 1 && (
                <>
                  <button onClick={() => setIdx((activeIdx - 1 + images.length) % images.length)} aria-label="Önceki"
                    style={{ position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)", width: 34, height: 34, borderRadius: 6, background: "rgba(10,10,10,.6)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <ChevLeft size={20} strokeWidth={2.6} />
                  </button>
                  <button onClick={() => setIdx((activeIdx + 1) % images.length)} aria-label="Sonraki"
                    style={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", width: 34, height: 34, borderRadius: 6, background: "rgba(10,10,10,.6)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <ChevronRight size={20} strokeWidth={2.6} />
                  </button>
                  <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
                    {images.map((_, i) => (
                      <span key={i} style={{ width: 7, height: 7, borderRadius: 4, background: i === activeIdx ? C.yellow : "rgba(255,255,255,.6)", border: "1px solid rgba(10,10,10,.4)" }} />
                    ))}
                  </div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto" }}>
                {images.map((src, i) => (
                  <button key={i} onClick={() => setIdx(i)} style={{ width: 54, height: 54, flexShrink: 0, borderRadius: 5, border: `2px solid ${i === activeIdx ? C.yellow : C.ink}`, overflow: "hidden", padding: 0, cursor: "pointer", background: C.stone }}>
                    <img src={src} alt={`küçük ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: "100%", aspectRatio: "16 / 7", borderRadius: 6, border: `2px dashed ${C.border}`, background: C.stone, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <CatIcon size={30} strokeWidth={2} color={C.muted} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted, textTransform: "uppercase" }}>Fotoğraf yok</span>
          </div>
        )}

        {/* ── Başlık + fiyat + künye ── */}
        <div style={cardSt}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9.5, fontWeight: 700, padding: "4px 8px", borderRadius: 5, border: `2px solid ${C.ink}`, background: C.stone, color: C.ink, textTransform: "uppercase" }}>
              <CatIcon size={12} strokeWidth={2.4} /> {c.short}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{fmtDate(post.createdAt)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <h2 style={{ fontFamily: ARCHIVO, fontSize: 18, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.01em", margin: 0, lineHeight: 1.2 }}>{post.title}</h2>
            {post.price != null && (
              <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 17, fontWeight: 700, color: C.green }}>{Number(post.price).toLocaleString("tr-TR")} ₺</span>
            )}
          </div>
          {post.il && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 11.5, color: C.sub, marginTop: 10 }}>
              <MapPin size={14} strokeWidth={2.2} color={C.muted} /> {post.il}
            </div>
          )}
          {post.body && <p style={{ fontSize: 13.5, color: C.sub, margin: "12px 0 0", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{post.body}</p>}
        </div>

        {/* ── Sahip künyesi → profil sayfasına git ── */}
        <button onClick={() => navigate(`/nakliyeci-profil/${post.ownerId}`)}
          style={{ ...cardSt, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
          <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 6, background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ARCHIVO, fontSize: 15, fontWeight: 800 }}>{initials(post.ownerName)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontFamily: ARCHIVO, fontSize: 15, fontWeight: 800, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.ownerName || "Nakliyeci"}</span>
              {post.ownerVerified && <ShieldCheck size={15} strokeWidth={2.6} color={C.green} style={{ flexShrink: 0 }} />}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.02em" }}>Profili gör</div>
          </div>
          <ChevronRight size={20} color={C.ink} strokeWidth={2.2} style={{ flexShrink: 0 }} />
        </button>

        {/* ── Aksiyonlar ── */}
        {mine ? (
          confirmDel ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDel(false)} style={{ flex: 1, background: C.card, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px", fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>Vazgeç</button>
              <button onClick={doRemove} style={{ flex: 1, background: C.red, color: "#fff", border: `2px solid ${C.red}`, borderRadius: 6, padding: "12px", fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>Sil</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.card, color: C.red, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px", fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>
              <Trash2 size={14} strokeWidth={2.4} /> Gönderimi sil
            </button>
          )
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("/mesajlar")} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px", fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
              <MessageCircle size={16} strokeWidth={2.4} /> Mesaj
            </button>
            {post.phone && (
              <a href={`tel:${post.phone}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.card, color: C.green, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 18px", fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, textTransform: "uppercase", textDecoration: "none" }}>
                <Phone size={16} strokeWidth={2.4} /> Ara
              </a>
            )}
          </div>
        )}

        {/* ── Şikayet et ── */}
        {!mine && (
          <button onClick={() => setShowReport(true)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
            <AlertTriangle size={15} strokeWidth={2.4} color={C.red} /> Şikayet et
          </button>
        )}

        {/* ── Sahibinin diğer ilanları ── */}
        {otherPosts.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <User size={14} strokeWidth={2.4} color={C.ink} />
              <span style={{ fontFamily: ARCHIVO, fontSize: 12.5, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.01em" }}>Sahibinin diğer ilanları</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {otherPosts.map((p) => {
                const pc = catOf(p.category);
                const cover = Array.isArray(p.images) && p.images[0];
                return (
                  <button key={p.id} onClick={() => { setIdx(0); navigate(`/mola/${p.id}`); window.scrollTo(0, 0); }}
                    style={{ ...cardSt, padding: 10, display: "flex", alignItems: "center", gap: 11, cursor: "pointer", textAlign: "left" }}>
                    <span style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 5, border: `2px solid ${C.ink}`, overflow: "hidden", background: C.stone, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {cover ? <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <pc.Icon size={20} strokeWidth={2} color={C.muted} />}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, marginTop: 2 }}>{pc.short}{p.price != null ? ` · ${Number(p.price).toLocaleString("tr-TR")} ₺` : ""}</div>
                    </div>
                    <ChevronRight size={16} color={C.ink} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── REPORT MODAL ── */}
      {showReport && (
        <ReportModal
          targetLabel={`Mola ilanı: ${post.title}`}
          onClose={() => setShowReport(false)}
          onSubmit={(p) => onReport?.({ type: "mola", targetId: post.id, listingId: null, fromId: user?.id || null, fromName: user?.name || "misafir", ...p })}
        />
      )}
    </div>
  );
}
