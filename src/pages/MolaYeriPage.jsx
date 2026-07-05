import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Coffee, Plus, MapPin, Phone, MessageCircle, ShieldCheck, Trash2, MessageSquare, ChevronRight, Share2 } from "lucide-react";
import { useToast } from "../components/Toast";
import SEO from "../components/SEO";
import Logo from "../components/Logo";
import { MOLA_CATS, catOf } from "../data/molaCats";
import { shareUrl, publicBase } from "../native/share";

// ── SAHA "Mola Yeri" — nakliyeci topluluk ilan panosu (Faz 1).
//    Nakliyeciler okur; yalnız ONAYLI nakliyeci paylaşır. Ayrı içerik (mola_posts).

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
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }); }
  catch { return ""; }
}

// Son aktivite tarihini "3 sa önce / dün / 5 Tem" gibi göster.
function fmtRel(iso) {
  try {
    const d = new Date(iso); const diff = Date.now() - d.getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "az önce";
    if (h < 24) return `${h} sa önce`;
    const g = Math.floor(h / 24);
    if (g === 1) return "dün";
    if (g < 7) return `${g} gün önce`;
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  } catch { return ""; }
}

export default function MolaYeriPage({ user, posts = [], threads = [], onRemovePost, onRequireAuth }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [view, setView] = useState("pano");   // pano | forum
  const [cat, setCat] = useState("all");
  const [confirmDel, setConfirmDel] = useState(null);

  const filtered = useMemo(
    () => (cat === "all" ? posts : posts.filter((p) => p.category === cat)),
    [posts, cat]
  );

  // ── Gate: giriş yok ──
  if (!user) {
    return (
      <div style={shell}>
        <SEO title="Mola Yeri" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <Logo size="lg" />
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Mola Yeri için giriş yapın</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: 0, maxWidth: 280 }}>Nakliyecilere özel topluluk panosu. Satılık dorse, eleman, ekipman ilanları.</p>
          <button onClick={() => onRequireAuth?.()}
            style={{ marginTop: 4, background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 22px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
            Giriş yap / Kayıt ol
          </button>
        </div>
      </div>
    );
  }

  // ── Gate: nakliyeci değil ──
  if (user.role !== "nakliyeci") {
    return (
      <div style={shell}>
        <SEO title="Mola Yeri" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Coffee size={30} color={C.yellow} strokeWidth={2.2} />
          </div>
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Mola Yeri nakliyecilere özel</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: 0, maxWidth: 290 }}>Bu topluluk panosu yalnızca nakliyeci/taşıyıcı üyeler içindir.</p>
          <button onClick={() => navigate("/")}
            style={{ marginTop: 4, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 20px", fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
            Ana sayfa
          </button>
        </div>
      </div>
    );
  }

  // Paylaşım/başlık açma tüm nakliyecilere serbest (belge onayı gerekmiyor).
  // Sayfa zaten nakliyeci-only (yukarıdaki gate); giriş yapan her nakliyeci paylaşabilir.
  const tryShare = () => {
    navigate("/mola-paylas");
  };
  const doRemove = async (id) => {
    setConfirmDel(null);
    const res = await onRemovePost?.(id);
    if (res && res.ok === false) { toast(res.error || "Silinemedi", "error"); return; }
    toast("Gönderi silindi", "info");
  };
  // Gönderiyi dışarıda (WhatsApp/sosyal medya) paylaş — native paylaşım sayfası,
  // web'de Web Share API, ikisi de yoksa panoya kopyala.
  const sharePost = async (p) => {
    const url = `${publicBase()}/mola/${p.id}`;
    const priceText = p.price != null ? ` — ${Number(p.price).toLocaleString("tr-TR")} ₺` : "";
    const res = await shareUrl({ title: p.title, text: `${p.title}${priceText}`, url });
    if (res === "copied") toast("Bağlantı panoya kopyalandı", "info");
    else if (res === "failed") toast("Paylaşım başarısız", "error");
  };

  return (
    <div style={shell}>
      <SEO title="Mola Yeri" description="Nakliyecilere özel topluluk panosu: satılık dorse, eleman, ekipman ilanları." />

      {/* Header */}
      <div style={{ background: C.ink, padding: "16px 18px", color: "#fff", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 14, backgroundImage: HAZARD }} />
        <span style={{ width: 40, height: 40, borderRadius: 6, background: C.yellow, border: `2px solid ${C.yellow}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Coffee size={21} color={C.ink} strokeWidth={2.4} />
        </span>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 18, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>Mola Yeri</h1>
          <div style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>Nakliyeci topluluk panosu</div>
        </div>
      </div>
      <div style={{ height: 8, backgroundImage: HAZARD }} />

      {/* Pano | Forum iç-sekmesi */}
      <div style={{ display: "flex", gap: 8, padding: "14px 16px 0" }}>
        {[
          { id: "pano", label: "Pano", Icon: Coffee },
          { id: "forum", label: "Sohbet", Icon: MessageSquare },
        ].map((s) => {
          const active = view === s.id;
          const Icon = s.Icon;
          return (
            <button key={s.id} onClick={() => setView(s.id)}
              style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, border: `2px solid ${C.ink}`, background: active ? C.ink : C.card, color: active ? C.yellow : C.ink, borderRadius: 6, padding: "11px", fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: active ? "3px 3px 0 rgba(10,10,10,.18)" : "none" }}>
              <Icon size={16} strokeWidth={2.4} /> {s.label}
            </button>
          );
        })}
      </div>

      {/* ══ PANO görünümü (Faz 1) ══ */}
      {view === "pano" && <>

      {/* Kategori filtre çipleri */}
      <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "14px 16px 4px", WebkitOverflowScrolling: "touch" }}>
        {[{ id: "all", short: "Tümü" }, ...MOLA_CATS].map((c) => {
          const active = cat === c.id;
          return (
            <button key={c.id} onClick={() => setCat(c.id)}
              style={{ flexShrink: 0, fontFamily: MONO, fontSize: 11, fontWeight: 700, padding: "7px 12px", borderRadius: 6, cursor: "pointer", border: `2px solid ${C.ink}`, background: active ? C.yellow : C.card, color: C.ink, boxShadow: active ? "2px 2px 0 #0A0A0A" : "none", textTransform: "uppercase" }}>
              {c.short}
            </button>
          );
        })}
      </div>

      {/* Gönderi listesi */}
      <div style={{ flex: 1, padding: "10px 16px 120px", display: "flex", flexDirection: "column", gap: 11 }}>
        {filtered.length === 0 ? (
          <div style={{ ...cardSt, textAlign: "center", padding: "36px 20px", marginTop: 8 }}>
            <div style={{ width: 56, height: 56, margin: "0 auto 14px", borderRadius: 8, background: C.stone, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Coffee size={28} strokeWidth={2} color={C.muted} />
            </div>
            <h3 style={{ fontFamily: ARCHIVO, fontSize: 15, fontWeight: 800, textTransform: "uppercase", color: C.ink, margin: 0 }}>Henüz gönderi yok</h3>
            <p style={{ fontFamily: MONO, fontSize: 11.5, color: C.sub, margin: "8px 0 0", lineHeight: 1.5 }}>
              İlk gönderiyi sen paylaş — satılık dorse, eleman ilanı veya duyuru.
            </p>
          </div>
        ) : (
          filtered.map((p) => {
            const c = catOf(p.category);
            const Icon = c.Icon;
            const mine = String(p.ownerId) === String(user.id);
            const cover = Array.isArray(p.images) && p.images[0];
            const extra = Array.isArray(p.images) ? p.images.length - 1 : 0;
            const goDetail = () => { navigate(`/mola/${p.id}`); window.scrollTo(0, 0); };
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardSt, padding: 0, overflow: "hidden" }}>
                {/* Kapak foto (varsa) — tıklanınca detaya git */}
                {cover && (
                  <button onClick={goDetail} aria-label={`${p.title} detay`} style={{ display: "block", width: "100%", padding: 0, border: "none", borderBottom: `2px solid ${C.ink}`, cursor: "pointer", background: C.stone, position: "relative" }}>
                    <img src={cover} alt={p.title} style={{ width: "100%", height: 168, objectFit: "cover", display: "block" }} />
                    {extra > 0 && (
                      <span style={{ position: "absolute", bottom: 8, right: 8, fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "#fff", background: "rgba(10,10,10,.7)", borderRadius: 4, padding: "3px 7px" }}>+{extra} foto</span>
                    )}
                  </button>
                )}

                <div style={{ padding: 14 }}>
                  {/* Üst: kategori + tarih (tıklanınca detay) */}
                  <button onClick={goDetail} style={{ width: "100%", padding: 0, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9.5, fontWeight: 700, padding: "4px 8px", borderRadius: 5, border: `2px solid ${C.ink}`, background: C.stone, color: C.ink, textTransform: "uppercase" }}>
                        <Icon size={12} strokeWidth={2.4} /> {c.short}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{fmtDate(p.createdAt)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <h3 style={{ fontFamily: ARCHIVO, fontSize: 15, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.01em", margin: 0, lineHeight: 1.2 }}>{p.title}</h3>
                      {p.price != null && (
                        <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.green }}>{Number(p.price).toLocaleString("tr-TR")} ₺</span>
                      )}
                    </div>
                    {p.body && <p style={{ fontSize: 13, color: C.sub, margin: "8px 0 0", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.body}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 11, flexWrap: "wrap" }}>
                      {p.il && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 11, color: C.sub }}>
                          <MapPin size={13} strokeWidth={2.2} color={C.muted} /> {p.il}
                        </span>
                      )}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 11, color: C.ink, fontWeight: 700 }}>
                        {p.ownerName}
                        {p.ownerVerified && <ShieldCheck size={13} strokeWidth={2.4} color={C.green} />}
                      </span>
                      <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 3, fontFamily: MONO, fontSize: 10, color: C.ink, fontWeight: 700, textTransform: "uppercase" }}>
                        Detay <ChevronRight size={13} strokeWidth={2.6} />
                      </span>
                    </div>
                  </button>

                  {/* Aksiyonlar */}
                  <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 11, borderTop: `1.5px solid ${C.line}` }}>
                    {mine ? (
                      confirmDel === p.id ? (
                        <>
                          <button onClick={() => setConfirmDel(null)} style={{ flex: 1, background: C.card, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "9px", fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>Vazgeç</button>
                          <button onClick={() => doRemove(p.id)} style={{ flex: 1, background: C.red, color: "#fff", border: `2px solid ${C.red}`, borderRadius: 6, padding: "9px", fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>Sil</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDel(p.id)} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.card, color: C.red, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "9px", fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>
                          <Trash2 size={13} strokeWidth={2.4} /> Gönderimi sil
                        </button>
                      )
                    ) : (
                      <>
                        <button onClick={() => navigate("/mesajlar")} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px", fontFamily: ARCHIVO, fontSize: 12, fontWeight: 800, textTransform: "uppercase", cursor: "pointer" }}>
                          <MessageCircle size={15} strokeWidth={2.4} /> Mesaj
                        </button>
                        {p.phone && (
                          <a href={`tel:${p.phone}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.card, color: C.green, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 14px", fontFamily: ARCHIVO, fontSize: 12, fontWeight: 800, textTransform: "uppercase", textDecoration: "none" }}>
                            <Phone size={15} strokeWidth={2.4} /> Ara
                          </a>
                        )}
                      </>
                    )}
                    {/* Paylaş — herkes için (WhatsApp/sosyal medya). İkon buton. */}
                    <button onClick={() => sharePost(p)} aria-label="Paylaş" title="Paylaş" style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: C.card, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}>
                      <Share2 size={15} strokeWidth={2.4} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
      </>}

      {/* ══ FORUM görünümü (Faz 2) ══ */}
      {view === "forum" && (
        <div style={{ flex: 1, padding: "14px 16px 120px", display: "flex", flexDirection: "column", gap: 11 }}>
          {threads.length === 0 ? (
            <div style={{ ...cardSt, textAlign: "center", padding: "36px 20px", marginTop: 4 }}>
              <div style={{ width: 56, height: 56, margin: "0 auto 14px", borderRadius: 8, background: C.stone, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageSquare size={28} strokeWidth={2} color={C.muted} />
              </div>
              <h3 style={{ fontFamily: ARCHIVO, fontSize: 15, fontWeight: 800, textTransform: "uppercase", color: C.ink, margin: 0 }}>Henüz başlık yok</h3>
              <p style={{ fontFamily: MONO, fontSize: 11.5, color: C.sub, margin: "8px 0 0", lineHeight: 1.5 }}>
                İlk başlığı sen aç — bir soru sor ya da konu başlat.
              </p>
            </div>
          ) : (
            threads.map((t) => (
              <motion.button key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => { navigate(`/mola/forum/${t.id}`); window.scrollTo(0, 0); }}
                style={{ ...cardSt, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ fontFamily: ARCHIVO, fontSize: 14.5, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.01em", margin: 0, lineHeight: 1.25 }}>{t.title}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 11, color: C.ink, fontWeight: 700 }}>
                      {t.ownerName}{t.ownerVerified && <ShieldCheck size={12} strokeWidth={2.4} color={C.green} />}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 11, color: C.sub }}>
                      <MessageSquare size={12} strokeWidth={2.2} color={C.muted} /> {t.replyCount || 0}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{fmtRel(t.lastReplyAt)}</span>
                  </div>
                </div>
                <ChevronRight size={18} color={C.ink} strokeWidth={2.2} style={{ flexShrink: 0 }} />
              </motion.button>
            ))
          )}
        </div>
      )}

      {/* FAB — Pano'da "Paylaş", Forum'da "Başlık Aç" */}
      {view === "pano" ? (
        <button onClick={tryShare} aria-label="İlan Paylaş"
          style={{ position: "fixed", bottom: 86, left: "50%", transform: "translateX(-50%)", zIndex: 40, display: "inline-flex", alignItems: "center", gap: 7, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 8, padding: "12px 16px", fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
          <Plus size={18} strokeWidth={2.6} /> İlan Paylaş
        </button>
      ) : (
        <button onClick={() => navigate("/mola/baslik-ac")} aria-label="Başlık Aç"
          style={{ position: "fixed", bottom: 86, left: "50%", transform: "translateX(-50%)", zIndex: 40, display: "inline-flex", alignItems: "center", gap: 7, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 8, padding: "12px 16px", fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>
          <Plus size={18} strokeWidth={2.6} /> Başlık Aç
        </button>
      )}
    </div>
  );
}
