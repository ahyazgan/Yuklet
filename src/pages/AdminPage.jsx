import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Ban, Flag, FileText, FileCheck2, Trash2, Eye, CheckCircle2, X, Check, Smartphone } from "lucide-react";
import SEO from "../components/SEO";
import { isSupabaseConfigured } from "../lib/supabase";
import { isAdmin } from "../utils/admin";

// ── SAHA Admin / moderasyon paneli — şikayetler, belge doğrulama, kullanıcılar.
//    Sharp industrial: 2px ink frame, dark header + hazard, Archivo uppercase, Space Mono data.
//    Erişim: role==="admin" veya bilinen admin e-postası (utils/admin.js).
//    Tüm prop sözleşmesi ve işlevsellik korunur.

const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  green: "#16803C",
  red: "#DC2626",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  sub: "#5A5852",
  muted: "#9A968D",
};
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const HEAD = "'Archivo', sans-serif";
const BODY = "'Plus Jakarta Sans', system-ui, sans-serif";

const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const fmt = (iso) => { try { return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

const shortId = (id) => "HMT-" + String(id ?? "").slice(-4).toUpperCase().padStart(4, "0");

const TABS = [["reports", "Şikayetler"], ["docs", "Belgeler"], ["users", "Kullanıcılar"]];

// Report status badge config: label, bg, fg.
const REPORT_STATUS = {
  acik: { label: "Açık", bg: C.red, fg: "#fff" },
  inceleniyor: { label: "İnceleniyor", bg: C.yellow, fg: C.ink },
  kapali: { label: "Kapalı", bg: C.sub, fg: "#fff" },
};

const shell = {
  margin: "0 auto", width: "100%", maxWidth: 460, minHeight: "100vh",
  background: C.bg, display: "flex", flexDirection: "column",
  color: C.ink, fontFamily: BODY,
};

// Base button: 2px ink frame, Archivo uppercase, no soft shadow.
const btnBase = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
  cursor: "pointer", background: C.card, color: C.ink,
  border: `2px solid ${C.ink}`, borderRadius: 5, padding: "8px 11px",
  fontFamily: HEAD, fontSize: 11, fontWeight: 800, textTransform: "uppercase",
  letterSpacing: "-0.01em", lineHeight: 1, whiteSpace: "nowrap",
};

export default function AdminPage({ user, reports = [], docs = [], users = [], listings = [], onRequireAuth, onSetReportStatus, onReviewDoc }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("reports");

  // ── Gate: giriş yok ──
  if (!user) {
    return (
      <div style={{ ...shell, alignItems: "center", justifyContent: "center", padding: "48px 20px", gap: 16, textAlign: "center" }}>
        <SEO title="Yönetim" />
        <div style={{ width: 66, height: 66, borderRadius: 6, background: C.ink, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0 #0A0A0A" }}>
          <Lock size={28} color={C.yellow} strokeWidth={2.4} />
        </div>
        <h1 style={{ fontFamily: HEAD, fontSize: 21, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink, lineHeight: 1.15, margin: 0 }}>Yönetim için giriş yapın</h1>
        <button onClick={() => onRequireAuth?.()} style={{ ...btnBase, background: C.ink, color: C.yellow, fontSize: 13, padding: "12px 20px", marginTop: 4, boxShadow: "3px 3px 0 #0A0A0A" }}>Giriş yap</button>
      </div>
    );
  }

  // ── Gate: yetki yok ──
  if (!isAdmin(user)) {
    return (
      <div style={{ ...shell, alignItems: "center", justifyContent: "center", padding: "48px 20px", gap: 14, textAlign: "center" }}>
        <SEO title="Yönetim" />
        <div style={{ width: 66, height: 66, borderRadius: 6, background: C.red, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0 #0A0A0A" }}>
          <Ban size={28} color="#fff" strokeWidth={2.4} />
        </div>
        <h1 style={{ fontFamily: HEAD, fontSize: 21, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink, lineHeight: 1.15, margin: 0 }}>Bu alana erişiminiz yok</h1>
        <p style={{ fontFamily: BODY, fontSize: 13.5, color: C.sub, margin: 0, maxWidth: 300 }}>Yönetim paneli yalnızca platform yöneticilerine açıktır.</p>
        <button onClick={() => navigate("/")} style={{ ...btnBase, background: C.yellow, fontSize: 13, padding: "11px 18px", marginTop: 4, boxShadow: "3px 3px 0 #0A0A0A" }}>Ana sayfa</button>
      </div>
    );
  }

  const openReports = reports.filter((r) => r.status !== "kapali").length;
  const pendingDocs = docs.filter((d) => (d.status || "beklemede") === "beklemede").length;
  const titleOf = (id) => listings.find((l) => String(l.id) === String(id))?.title || ("#" + id);

  const STATS = [
    { label: "Açık Şikayet", value: openReports, red: true },
    { label: "Bekleyen Belge", value: pendingDocs },
    { label: "Kullanıcı", value: users.length || "—" },
  ];

  return (
    <div style={shell}>
      <SEO title="Yönetim Paneli" description="HamTed moderasyon paneli." />

      {/* ── Dark header + hazard ── */}
      <div style={{ position: "relative", background: C.ink, padding: "16px 18px", display: "flex", alignItems: "center", gap: 11, overflow: "hidden" }}>
        <span style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 14, backgroundImage: HAZARD }} />
        <span style={{ width: 38, height: 38, borderRadius: 6, background: C.yellow, border: "2px solid #FACC15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Shield size={20} color={C.ink} strokeWidth={2.4} />
        </span>
        <h1 style={{ fontFamily: HEAD, fontSize: 18, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#fff", margin: 0, lineHeight: 1 }}>Yönetim Paneli</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px 16px 96px" }}>
        {isSupabaseConfigured && (
          <div style={{ background: C.stone, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px 13px", fontFamily: BODY, fontSize: 12, fontWeight: 600, color: C.sub, lineHeight: 1.45 }}>
            <span style={{ fontFamily: MONO, fontWeight: 700, color: C.red }}>! </span>
            Supabase modunda moderasyon için servis-rolü (admin API) gerekir. Şu an yerel görünüm; tam yetki gerçek admin entegrasyonunda açılacak.
          </div>
        )}

        {/* ── Özet stat grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9 }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 8px", textAlign: "center", boxShadow: "3px 3px 0 rgba(10,10,10,.12)" }}>
              <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, lineHeight: 1, color: s.red ? C.red : C.ink }}>{s.value}</div>
              <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: C.muted, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Sekmeler: 2px frame segment ── */}
        <div style={{ display: "flex", border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden" }}>
          {TABS.map(([k, lbl], i) => {
            const active = tab === k;
            return (
              <button key={k} onClick={() => setTab(k)}
                style={{
                  flex: 1, cursor: "pointer", padding: "10px 4px",
                  background: active ? C.ink : C.card,
                  color: active ? C.yellow : C.ink,
                  border: "none", borderLeft: i > 0 ? `2px solid ${C.ink}` : "none",
                  fontFamily: HEAD, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1,
                }}>
                {lbl}
              </button>
            );
          })}
        </div>

        {/* ── ŞİKAYETLER ── */}
        {tab === "reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {reports.length === 0 ? <Empty icon={Flag} text="Şikayet yok." /> : reports.map((r) => {
              const st = REPORT_STATUS[r.status] || REPORT_STATUS.acik;
              return (
                <div key={r.id} style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 14, boxShadow: "3px 3px 0 rgba(10,10,10,.12)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontFamily: HEAD, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink, lineHeight: 1.2 }}>{r.reason}</div>
                    <Badge bg={st.bg} fg={st.fg} dot>{st.label}</Badge>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: C.sub, marginTop: 7 }}>
                    {shortId(r.id)} · {r.type === "user" ? "Kullanıcı" : "İlan"} · {r.fromName || "misafir"} · {fmt(r.createdAt)}
                  </div>
                  {r.description && (
                    <p style={{ margin: "10px 0 0", background: C.stone, border: `2px solid ${C.border}`, borderRadius: 5, padding: "9px 11px", fontFamily: BODY, fontSize: 13, color: C.ink, lineHeight: 1.45 }}>{r.description}</p>
                  )}
                  {r.listingId && (
                    <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, marginTop: 7 }}>İlgili ilan: {titleOf(r.listingId)}</div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
                    {r.listingId && (
                      <button onClick={() => onSetReportStatus?.(r.id, "inceleniyor")} style={{ ...btnBase, background: C.red, color: "#fff" }}>
                        <Trash2 size={13} strokeWidth={2.4} /> İlanı Kaldır
                      </button>
                    )}
                    <button onClick={() => onSetReportStatus?.(r.id, "inceleniyor")} style={btnBase}>
                      <Eye size={13} strokeWidth={2.4} /> İncele
                    </button>
                    <button onClick={() => onSetReportStatus?.(r.id, "kapali")} style={{ ...btnBase, background: C.stone }}>
                      <CheckCircle2 size={13} strokeWidth={2.4} /> Kapat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── BELGELER ── */}
        {tab === "docs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {docs.length === 0 ? <Empty icon={FileText} text="Yüklenmiş belge yok." /> : docs.map((d) => {
              const status = d.status || "beklemede";
              const isImg = String(d.dataUrl || d.url || "").startsWith("data:image");
              return (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 11, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 12, boxShadow: "3px 3px 0 rgba(10,10,10,.12)" }}>
                  {isImg ? (
                    <img src={d.dataUrl || d.url} alt="" style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 5, border: `2px solid ${C.ink}`, objectFit: "cover" }} />
                  ) : (
                    <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 5, background: C.stone, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FileText size={20} color={C.ink} strokeWidth={2.2} />
                    </span>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: HEAD, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.type}</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                  </div>
                  {status === "dogrulandi" ? (
                    <Badge bg={C.green} fg="#fff"><Check size={11} strokeWidth={3} /> Onaylı</Badge>
                  ) : status === "red" ? (
                    <Badge bg={C.red} fg="#fff"><X size={11} strokeWidth={3} /> Reddedildi</Badge>
                  ) : (
                    <div style={{ display: "flex", flexShrink: 0, gap: 6 }}>
                      <button onClick={() => onReviewDoc?.(d.id, "dogrulandi")} style={{ ...btnBase, background: C.green, color: "#fff", padding: "8px 10px" }}>
                        <FileCheck2 size={13} strokeWidth={2.4} /> Doğrula
                      </button>
                      <button onClick={() => onReviewDoc?.(d.id, "red")} style={{ ...btnBase, background: C.red, color: "#fff", padding: "8px 10px" }}>
                        <X size={13} strokeWidth={2.6} /> Reddet
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── KULLANICILAR ── */}
        {tab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {users.length === 0 ? <Empty icon={Shield} text="Kullanıcı listesi bu modda görünmüyor." /> : users.map((u) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 11, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 12, boxShadow: "3px 3px 0 rgba(10,10,10,.12)" }}>
                <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 5, background: C.yellow, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontSize: 16, fontWeight: 900, color: C.ink }}>
                  {(u.name || "?").charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: HEAD, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email} · {u.role}</div>
                </div>
                <div style={{ display: "flex", flexShrink: 0, gap: 6 }}>
                  {u.verified && <Badge bg={C.green} fg="#fff"><Check size={11} strokeWidth={3} /> Onaylı</Badge>}
                  {u.phoneVerified && (
                    <span style={{ width: 26, height: 24, borderRadius: 5, background: C.stone, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Smartphone size={13} color={C.ink} strokeWidth={2.2} />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Status / state badge: mono uppercase, 2px ink frame.
function Badge({ children, bg, fg, dot }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
      background: bg, color: fg, border: `2px solid ${C.ink}`, borderRadius: 5,
      padding: "3px 7px", fontFamily: MONO, fontSize: 10, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1, whiteSpace: "nowrap",
    }}>
      {dot && <span style={{ fontSize: 9 }}>●</span>}
      {children}
    </span>
  );
}

function Empty({ icon: Icon, text }) {
  return (
    <div style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "44px 16px", textAlign: "center", boxShadow: "3px 3px 0 rgba(10,10,10,.12)" }}>
      {Icon && <Icon size={30} color={C.muted} strokeWidth={2} style={{ margin: "0 auto 10px", display: "block" }} />}
      <div style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>{text}</div>
    </div>
  );
}
