import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Check, X, MessageSquare, FileText, Phone, RotateCw, Pencil, Lock, Share2, Trash2 } from "lucide-react";
import { CATS } from "../data/categories";
import CategoryIcon from "../components/CategoryIcon";
import { useToast } from "../components/Toast";
import SEO from "../components/SEO";

// ── SAHA ilanlarim — paper palette + Space Mono accents, inline styles.

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
  red: "#B91C1C",
};
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// Tabs map to real listing statuses (project has no draft state).
const TABS = [
  { key: "aktif", label: "Aktif" },
  { key: "eslesti", label: "Eşleşti" },
  { key: "kapali", label: "Kapalı" },
];

const OFFER_STATUS = {
  beklemede: { label: "BEKLEMEDE", bg: "#FEF3C7", fg: "#92400E" },
  kabul: { label: "KABUL", bg: "#DCFCE7", fg: C.green },
  ret: { label: "REDDEDİLDİ", bg: "#FEE2E2", fg: C.red },
};

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

function shortId(id) {
  const s = String(id ?? "");
  return "#" + s.slice(-6).toUpperCase().padStart(6, "0");
}

export default function IlanlarimPage({ listings = [], user, offers = [], onUpdateOffer, onUpdateListing, onDeleteListing, onRequireAuth, getContact }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState("aktif");
  const [expanded, setExpanded] = useState({}); // listingId -> bool

  if (!user) {
    return (
      <div style={{ ...shell, alignItems: "center", justifyContent: "center", padding: "48px 20px", gap: 14, textAlign: "center" }}>
        <SEO title="İlanlarım" description="Açtığınız ilanlar ve gelen teklifler." />
        <div style={{ width: 64, height: 64, borderRadius: 18, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Lock size={28} color={C.yellow} strokeWidth={2.4} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.ink, lineHeight: 1.2, margin: 0 }}>İlanlarınızı görmek için giriş yapın</h1>
        <p style={{ fontSize: 13.5, color: C.sub, margin: 0, maxWidth: 300 }}>Açtığınız ilanları ve gelen teklifleri burada yönetebilirsiniz.</p>
        <button onClick={() => onRequireAuth?.()} style={{ marginTop: 6, border: "none", cursor: "pointer", background: C.ink, color: "#fff", borderRadius: 999, padding: "13px 22px", fontSize: 14, fontWeight: 700 }}>
          Giriş yap / Kayıt ol
        </button>
      </div>
    );
  }

  const myListings = listings.filter((l) => l.ownerId && l.ownerId === user.id);
  const counts = {
    aktif: myListings.filter((l) => l.status === "aktif").length,
    eslesti: myListings.filter((l) => l.status === "eslesti").length,
    kapali: myListings.filter((l) => l.status === "kapali").length,
  };
  const visible = myListings.filter((l) => (l.status || "aktif") === tab);

  // ── Actions (functionality preserved 1:1) ──
  const accept = (listing, offer) => {
    onUpdateOffer?.(offer.id, { status: "kabul" });
    onUpdateListing?.(listing.id, { status: "eslesti" });
    toast("Teklif kabul edildi, ilan eşleşti", "success");
  };
  const reject = (offer) => {
    onUpdateOffer?.(offer.id, { status: "ret" });
    toast("Teklif reddedildi", "info");
  };
  const renew = (l) => {
    onUpdateListing?.(l.id, { status: "aktif", createdText: "az önce" });
    toast("İlan yenilendi ve tekrar yayında", "success");
  };
  const del = (l) => {
    if (window.confirm(`"${l.title}" ilanını silmek istediğinize emin misiniz?`)) {
      onDeleteListing?.(l.id);
      toast("İlan silindi", "info");
    }
  };
  const toggleClose = (l) => onUpdateListing?.(l.id, { status: l.status === "kapali" ? "aktif" : "kapali" });
  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const share = (l) => {
    const url = `${window.location.origin}/ilan/${l.id}`;
    if (navigator.share) navigator.share({ title: l.title, url }).catch(() => {});
    else { navigator.clipboard?.writeText(url); toast("İlan bağlantısı kopyalandı", "info"); }
  };

  return (
    <div style={shell}>
      <SEO title="İlanlarım" description="Açtığınız ilanlar ve gelen teklifler. Teklifleri kabul edin veya reddedin." />

      {/* Header */}
      <header style={{ background: C.header, padding: "18px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: -0.5, margin: 0 }}>İlanlarım</h1>
            <p style={{ fontSize: 11.5, color: C.sub, margin: "3px 0 0", fontFamily: MONO }}>{myListings.length} İLAN · TEKLİFLERİ YÖNET</p>
          </div>
          <button onClick={() => navigate("/ilan-ver")} style={{ display: "flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer", background: C.yellow, color: C.ink, borderRadius: 999, padding: "11px 16px", fontSize: 13, fontWeight: 800 }}>
            <Plus size={16} strokeWidth={2.8} /> Yeni
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, cursor: "pointer", border: `1px solid ${active ? C.ink : C.border}`,
                  background: active ? C.ink : "transparent", color: active ? "#fff" : C.sub,
                  borderRadius: 999, padding: "8px 6px", fontSize: 12.5, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}
              >
                {t.label}
                <span style={{ fontFamily: MONO, fontSize: 11, opacity: active ? 0.85 : 0.7 }}>·{counts[t.key]}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: "16px 16px 96px", display: "flex", flexDirection: "column", gap: 14 }}>
        {myListings.length === 0 ? (
          <EmptyBox text="Henüz ilanınız yok." cta="İlk ilanı verin" onCta={() => navigate("/ilan-ver")} />
        ) : visible.length === 0 ? (
          <EmptyBox text={`Bu sekmede ilan yok (${TABS.find((t) => t.key === tab)?.label}).`} cta="İlan ver" onCta={() => navigate("/ilan-ver")} />
        ) : (
          visible.map((l) => {
            const cat = CATS.find((c) => c.id === l.cat);
            const lOffers = offers.filter((o) => String(o.listingId) === String(l.id));
            const pending = lOffers.filter((o) => o.status === "beklemede");
            const matched = l.status === "eslesti";
            const closed = l.status === "kapali";
            const isStone = l.cat === "silobas";
            const open = !!expanded[l.id];

            return (
              <article key={l.id} style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16,
                opacity: closed ? 0.72 : 1,
              }}>
                {/* Top row: category badge + status badge + listing no */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 8, padding: "4px 9px",
                    fontSize: 11, fontWeight: 700, letterSpacing: 0.2,
                    background: isStone ? C.stone : C.ink, color: isStone ? C.ink : C.yellow,
                    border: isStone ? `1px solid ${C.border}` : "none", textTransform: "uppercase",
                  }}>
                    <CategoryIcon catId={l.cat} size={14} fallback={cat?.icon} />
                    {cat?.name || l.cat}
                  </span>

                  {matched && <StatusPill bg="#DCFCE7" fg={C.green} dot text="EŞLEŞTİ" />}
                  {closed && <StatusPill bg={C.stone} fg={C.muted} text="TAMAMLANDI" />}
                  {!matched && !closed && <StatusPill bg="#DCFCE7" fg={C.green} dot text="AKTİF" />}

                  <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11, color: C.faint }}>{shortId(l.id)}</span>
                </div>

                {/* Title */}
                <h3 onClick={() => navigate(`/ilan/${l.id}`)} style={{ fontSize: 16.5, fontWeight: 800, color: C.ink, margin: "0 0 10px", cursor: "pointer", lineHeight: 1.25 }}>
                  {l.title}
                </h3>

                {/* Tag chips (MONO) */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
                  {(l.amount != null && l.amount !== "") && <Chip>{l.amount} {l.unit || ""}</Chip>}
                  {l.il && <Chip>{l.il}{l.ilce ? ` / ${l.ilce}` : ""}</Chip>}
                  {l.material && <Chip>{l.material}</Chip>}
                  {l.vehicle && <Chip>{l.vehicle}</Chip>}
                </div>

                {closed ? (
                  <div style={{ fontSize: 12.5, color: C.muted, fontFamily: MONO }}>İlan kapatıldı · {lOffers.length} teklif alındı</div>
                ) : (
                  <>
                    {/* Footer: offers summary + secondary actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
                      {lOffers.length > 0 ? (
                        <>
                          {pending.length > 0 && (
                            <span style={{ background: C.yellow, color: C.ink, fontWeight: 800, fontSize: 11.5, borderRadius: 999, padding: "4px 10px" }}>
                              {pending.length} yeni teklif
                            </span>
                          )}
                          <button onClick={() => toggleExpand(l.id)} style={linkBtn}>
                            {open ? "Teklifleri gizle" : `Teklifleri gör (${lOffers.length}) →`}
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: 12.5, color: C.muted, fontFamily: MONO }}>Henüz teklif yok</span>
                      )}
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        <IconBtn title="Düzenle" onClick={() => navigate(`/ilan-duzenle/${l.id}`)}><Pencil size={15} /></IconBtn>
                        <IconBtn title="Paylaş" onClick={() => share(l)}><Share2 size={15} /></IconBtn>
                      </div>
                    </div>

                    {/* Expanded: offers + management */}
                    {open && (
                      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                        {lOffers.length === 0 ? (
                          <div style={{ fontSize: 12.5, color: C.muted }}>Bu ilana henüz teklif gelmedi.</div>
                        ) : (
                          lOffers.map((o) => {
                            const s = OFFER_STATUS[o.status] || OFFER_STATUS.beklemede;
                            const contact = getContact?.(o.fromUserId);
                            return (
                              <div key={o.id} style={{ border: `1px solid ${C.line}`, borderRadius: 14, padding: 13, background: C.stone }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                  <span style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>{o.fromUser}</span>
                                  <StatusPill bg={s.bg} fg={s.fg} text={s.label} />
                                  {o.price != null && (
                                    <span style={{ marginLeft: "auto", fontSize: 15, fontWeight: 800, color: C.ink, fontFamily: MONO }}>
                                      {Number(o.price).toLocaleString("tr-TR")} ₺
                                    </span>
                                  )}
                                </div>
                                {o.message && <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 6, lineHeight: 1.4 }}>{o.message}</div>}
                                <div style={{ fontSize: 11, color: C.faint, fontFamily: MONO, marginBottom: o.status === "beklemede" || o.status === "kabul" ? 10 : 0 }}>
                                  {fmtDate(o.createdAt)}
                                </div>

                                {o.status === "beklemede" && !matched && (
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={() => accept(l, o)} style={{ ...btn, background: C.green, color: "#fff", flex: 1 }}>
                                      <Check size={15} strokeWidth={2.6} /> Kabul et
                                    </button>
                                    <button onClick={() => reject(o)} style={{ ...btn, background: "#fff", color: C.red, border: `1px solid ${C.border}`, flex: 1 }}>
                                      <X size={15} strokeWidth={2.6} /> Reddet
                                    </button>
                                  </div>
                                )}

                                {o.status === "kabul" && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {contact?.phone && (
                                      <a href={`tel:${contact.phone}`} style={{ ...btn, background: "#fff", color: C.green, border: `1px solid ${C.border}`, textDecoration: "none" }}>
                                        <Phone size={14} strokeWidth={2.4} /> {contact.phone}
                                      </a>
                                    )}
                                    <button onClick={() => navigate("/mesajlar")} style={{ ...btn, background: C.ink, color: "#fff" }}>
                                      <MessageSquare size={14} strokeWidth={2.4} /> Mesaj gönder
                                    </button>
                                    <button onClick={() => navigate(`/sozlesme/${o.id}`)} style={{ ...btn, background: "#fff", color: C.ink, border: `1px solid ${C.border}` }}>
                                      <FileText size={14} strokeWidth={2.4} /> Sözleşme
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}

                        {/* Listing management row */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
                          {!matched && (
                            <button onClick={() => toggleClose(l)} style={ghostBtn}>{closed ? "Tekrar aç" : "Kapat"}</button>
                          )}
                          {l.recurring && (
                            <button onClick={() => renew(l)} style={{ ...ghostBtn, color: C.green, borderColor: "#BBF7D0", background: "#F0FDF4" }}>
                              <RotateCw size={13} strokeWidth={2.4} /> Yenile
                            </button>
                          )}
                          <button onClick={() => del(l)} style={{ ...ghostBtn, color: C.red, borderColor: "#FECACA", marginLeft: "auto" }}>
                            <Trash2 size={13} strokeWidth={2.4} /> Sil
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}

// ── Shared inline styles ──
const shell = {
  margin: "0 auto", width: "100%", maxWidth: 460, minHeight: "100vh",
  background: C.bg, display: "flex", flexDirection: "column",
  color: C.ink, fontFamily: "'Inter', system-ui, sans-serif",
};

const btn = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
  cursor: "pointer", border: "none", borderRadius: 10, padding: "9px 12px",
  fontSize: 12.5, fontWeight: 700,
};

const ghostBtn = {
  display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer",
  background: "#fff", border: `1px solid ${C.border}`, color: C.sub,
  borderRadius: 999, padding: "7px 13px", fontSize: 12, fontWeight: 700,
};

const linkBtn = {
  background: "none", border: "none", cursor: "pointer", padding: 0,
  fontSize: 12.5, fontWeight: 700, color: C.ink,
};

// ── Small components ──
function Chip({ children }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: 11, color: C.sub, background: C.stone,
      border: `1px solid ${C.border}`, borderRadius: 7, padding: "4px 8px",
    }}>{children}</span>
  );
}

function StatusPill({ bg, fg, text, dot }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999,
      padding: "3px 9px", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3,
      background: bg, color: fg,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: fg }} />}
      {text}
    </span>
  );
}

function IconBtn({ children, onClick, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 32, height: 32, borderRadius: 9, cursor: "pointer",
      background: "#fff", border: `1px solid ${C.border}`, color: C.sub,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>{children}</button>
  );
}

function EmptyBox({ text, cta, onCta }) {
  return (
    <div style={{
      background: C.card, border: `1px dashed ${C.border}`, borderRadius: 18,
      padding: "52px 24px", textAlign: "center",
    }}>
      <p style={{ fontSize: 13.5, color: C.muted, margin: "0 0 10px" }}>{text}</p>
      <button onClick={onCta} style={{ border: "none", cursor: "pointer", background: C.yellow, color: C.ink, borderRadius: 999, padding: "10px 18px", fontSize: 13, fontWeight: 800 }}>
        {cta}
      </button>
    </div>
  );
}
