import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, BadgeCheck, Truck, Package, Lock, Building2, HelpCircle, LogOut, ChevronRight, ShieldCheck } from "lucide-react";
import { useToast } from "../components/Toast";
import { StarsDisplay } from "../components/Stars";
import SEO from "../components/SEO";
import { sendSmsCode, verifySmsCode, isValidPhone } from "../lib/smsProvider";
import { isAdmin } from "../utils/admin";

// ── SAHA profil — inline-style shell, "C" palette + Space Mono.
//    Visual = SAHA design; all original functionality preserved.

const C = {
  ink: "#0A0A0A", header: "#EAE3D6", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA", border: "#E3DDD0", line: "#F0ECE3",
  sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const ROLES = [
  { id: "isveren", label: "Müteahhit / Alıcı", desc: "İş ilanı açar, teklif alır" },
  { id: "tedarikci", label: "Tedarikçi", desc: "Malzeme satar: ocak, beton, kum" },
  { id: "nakliyeci", label: "Nakliyeci / Taşıyıcı", desc: "Araç ilanı açar, yük taşır" },
];

// Role label shown in the dark identity header.
const ROLE_BADGE = {
  isveren: "MÜTEAHHİT",
  tedarikci: "TEDARİKÇİ",
  nakliyeci: "NAKLİYECİ",
};

const DOC_TYPES = ["K Belgesi", "Araç Ruhsatı", "Vergi Levhası", "Sigorta Poliçesi", "Diğer"];

function fmtRev(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return ""; }
}

// Initials from a name (max 2 chars).
function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const shell = {
  width: "100%", maxWidth: 460, margin: "0 auto", minHeight: "100vh",
  display: "flex", flexDirection: "column", background: C.bg, fontFamily: "inherit",
};

export default function ProfilPage({ user, onUpdateProfile, onVerifyPhone, onRequireAuth, onLogout, reviews = [], getUserRating, docs = [], onAddDoc, onRemoveDoc }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [docType, setDocType] = useState("K Belgesi");

  // ── Telefon doğrulama (SMS, mock-first) ──
  const [smsStep, setSmsStep] = useState("idle"); // idle | sent
  const [smsCode, setSmsCode] = useState("");
  const [smsHint, setSmsHint] = useState("");     // mock'ta gösterilen kod
  const [smsBusy, setSmsBusy] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    role: user?.role || "isveren",
  });

  const startVerify = async () => {
    setSmsBusy(true); setSmsHint("");
    const res = await sendSmsCode(form.phone).catch((e) => ({ ok: false, error: e?.message }));
    setSmsBusy(false);
    if (!res?.ok) { toast(res?.error || "Kod gönderilemedi", "error"); return; }
    setSmsStep("sent");
    if (res.mock) setSmsHint(res.code); // gerçek SMS yokken kodu ekranda göster
    toast(res.mock ? "Demo: kod ekranda gösterildi" : "Kod telefonuna gönderildi", "success");
  };
  const confirmVerify = async () => {
    setSmsBusy(true);
    const res = await verifySmsCode(form.phone, smsCode).catch((e) => ({ ok: false, error: e?.message }));
    setSmsBusy(false);
    if (!res?.ok) { toast(res?.error || "Kod hatalı", "error"); return; }
    await onVerifyPhone?.(form.phone.trim());
    setSmsStep("idle"); setSmsCode(""); setSmsHint("");
    toast("Telefon doğrulandı ✓", "success");
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_500_000) { toast("Dosya çok büyük (~2.5MB sınırı)", "error"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      onAddDoc?.({ id: Date.now(), ownerId: user.id, type: docType, name: f.name, dataUrl: reader.result, createdAt: new Date().toISOString() });
      toast("Belge yüklendi — inceleniyor", "success");
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  // ── Logged-out state (preserves onRequireAuth behavior) ──
  if (!user) {
    return (
      <div style={shell}>
        <SEO title="Profil" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={28} color={C.yellow} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: 0 }}>Profil için giriş yapın</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: 0, maxWidth: 280 }}>Hesabını görüntülemek, belge yüklemek ve değerlendirmelerini görmek için giriş yap.</p>
          <button onClick={() => onRequireAuth?.()}
            style={{ marginTop: 4, background: C.ink, color: "#fff", border: "none", borderRadius: 14, padding: "13px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Giriş yap / Kayıt ol
          </button>
        </div>
      </div>
    );
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim()) { toast("Ad / firma zorunludur", "error"); return; }
    onUpdateProfile?.({ name: form.name.trim(), phone: form.phone.trim(), role: form.role });
    toast("Profil güncellendi", "success");
  };

  const rating = getUserRating?.(user.id);
  const myReviews = reviews.filter((r) => String(r.toId) === String(user.id)).slice(0, 8);
  const reviewCount = reviews.filter((r) => String(r.toId) === String(user.id)).length;
  const avgRating = rating ? rating.avg : (user.rating ?? 5.0);
  // Doğrulanmış numara forma eşitse "doğrulandı" göster (numara değişince düşer)
  const phoneVerified = Boolean(user.phoneVerified) && String(user.phone || "").replace(/\D/g, "") === String(form.phone || "").replace(/\D/g, "") && isValidPhone(form.phone);
  const roleBadge = ROLE_BADGE[user.role] || "ÜYE";

  // ── Reusable inline styles ──
  const labelSt = { display: "block", marginBottom: 6, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.3, textTransform: "uppercase" };
  const inputSt = { width: "100%", boxSizing: "border-box", background: C.stone, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.ink, outline: "none", fontFamily: "inherit" };
  const cardSt = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 };
  const sectionTitle = { fontSize: 13, fontWeight: 800, color: C.ink, letterSpacing: 0.3, textTransform: "uppercase", margin: "0 0 12px", fontFamily: MONO };

  return (
    <div style={shell}>
      <SEO title="Profil" description="Hesap bilgilerinizi görüntüleyin ve güncelleyin." />

      {/* ── Üst kimlik bloğu (ink) ── */}
      <div style={{ background: C.ink, padding: "16px 20px 22px", color: "#fff", position: "relative" }}>
        {/* Settings (admin paneli mevcut işlev) */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => navigate(isAdmin(user) ? "/admin" : "/panel")}
            aria-label={isAdmin(user) ? "Yönetim paneli" : "Panelim"}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Settings size={18} color="#fff" />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
          {/* Avatar — yellow square, initials */}
          <div style={{ width: 60, height: 60, borderRadius: 14, background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.ink }}>{initials(user.name)}</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span>
              {user.verified && <BadgeCheck size={18} color={C.yellow} style={{ flexShrink: 0 }} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.ink, background: C.yellow, padding: "3px 8px", borderRadius: 6, letterSpacing: 0.5 }}>{roleBadge}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
            </div>
          </div>
        </div>

        {/* İstatistik bandı (gerçek veri) */}
        <div style={{ display: "flex", marginTop: 18, background: "rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ flex: 1, textAlign: "center", padding: "12px 4px" }}>
            <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.yellow }}>{Number(avgRating).toFixed(1)}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2, letterSpacing: 0.4 }}>PUAN</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ flex: 1, textAlign: "center", padding: "12px 4px" }}>
            <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: "#fff" }}>{reviewCount}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2, letterSpacing: 0.4 }}>DEĞERLENDİRME</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ flex: 1, textAlign: "center", padding: "12px 4px" }}>
            <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: "#fff" }}>{docs.length}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2, letterSpacing: 0.4 }}>BELGE</div>
          </div>
        </div>
      </div>

      {/* ── Gövde ── */}
      <div style={{ flex: 1, padding: "18px 16px 110px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Hesap bilgileri / düzenleme */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={cardSt}>
          <h2 style={sectionTitle}>Hesap bilgileri</h2>

          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}>Ad / Firma</label>
            <input style={inputSt} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Yıldızlar İnşaat" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}>E-posta</label>
            <input style={{ ...inputSt, opacity: 0.55, cursor: "not-allowed" }} value={user.email} disabled />
          </div>

          {/* Telefon + doğrulama */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}>Telefon</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inputSt, flex: 1 }} value={form.phone}
                onChange={(e) => { set("phone", e.target.value); setSmsStep("idle"); }} placeholder="05XX XXX XX XX" />
              {phoneVerified ? (
                <span style={{ display: "flex", alignItems: "center", gap: 5, background: "#E6F4EA", color: C.green, padding: "0 14px", borderRadius: 12, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                  <BadgeCheck size={14} /> Doğrulandı
                </span>
              ) : (
                <button type="button" onClick={startVerify} disabled={smsBusy || !isValidPhone(form.phone)}
                  style={{ flexShrink: 0, background: C.ink, color: "#fff", border: "none", borderRadius: 12, padding: "0 16px", fontSize: 12, fontWeight: 700, cursor: smsBusy || !isValidPhone(form.phone) ? "default" : "pointer", opacity: smsBusy || !isValidPhone(form.phone) ? 0.5 : 1 }}>
                  {smsBusy && smsStep === "idle" ? "…" : "Doğrula"}
                </button>
              )}
            </div>

            {!phoneVerified && smsStep === "sent" && (
              <div style={{ marginTop: 10, border: `1px solid ${C.border}`, background: C.stone, borderRadius: 12, padding: 12 }}>
                {smsHint && (
                  <div style={{ marginBottom: 8, background: "#FEF3C7", color: "#92600A", borderRadius: 8, padding: "8px 10px", fontSize: 11, fontWeight: 700 }}>
                    Demo modu — gerçek SMS yerine kodun: <span style={{ letterSpacing: 3, fontFamily: MONO }}>{smsHint}</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={smsCode} onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric" placeholder="6 haneli kod"
                    style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, letterSpacing: 3, color: C.ink, outline: "none", fontFamily: MONO }} />
                  <button type="button" onClick={confirmVerify} disabled={smsBusy || smsCode.length !== 6}
                    style={{ flexShrink: 0, background: C.yellow, color: C.ink, border: "none", borderRadius: 10, padding: "0 16px", fontSize: 12, fontWeight: 800, cursor: smsBusy || smsCode.length !== 6 ? "default" : "pointer", opacity: smsBusy || smsCode.length !== 6 ? 0.5 : 1 }}>
                    {smsBusy ? "…" : "Onayla"}
                  </button>
                </div>
                <button type="button" onClick={startVerify} disabled={smsBusy}
                  style={{ marginTop: 8, background: "none", border: "none", padding: 0, fontSize: 11, fontWeight: 600, color: C.muted, cursor: "pointer" }}>
                  Kodu tekrar gönder
                </button>
              </div>
            )}
            <div style={{ marginTop: 6, fontSize: 11, color: C.faint }}>
              {phoneVerified ? "Doğrulanmış numara, eşleşen tarafla paylaşılır." : "Doğrula → güven rozeti kazan. Eşleşen tarafla iletişim için paylaşılır."}
            </div>
          </div>

          {/* Rol seçimi */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelSt}>Rol</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ROLES.map((r) => {
                const active = form.role === r.id;
                return (
                  <button type="button" key={r.id} onClick={() => set("role", r.id)}
                    style={{ textAlign: "left", border: `1px solid ${active ? C.yellow : C.border}`, background: active ? "#FEF9E7" : C.stone, borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#92600A" : C.ink }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{r.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <button type="button" onClick={save}
            style={{ width: "100%", background: C.yellow, color: C.ink, border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
            Değişiklikleri kaydet
          </button>
        </motion.section>

        {/* Belgelerim */}
        <section style={cardSt}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h2 style={{ ...sectionTitle, margin: 0 }}>Belgelerim</h2>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
              background: user.verified ? "#E6F4EA" : docs.length ? "#FEF3C7" : C.stone,
              color: user.verified ? C.green : docs.length ? "#92600A" : C.muted,
            }}>
              {user.verified ? "✓ Doğrulandı" : docs.length ? "İnceleniyor" : "Eksik"}
            </span>
          </div>
          <p style={{ fontSize: 12, color: C.sub, margin: "0 0 12px" }}>
            K belgesi, araç ruhsatı, vergi levhası yükle → ekibimiz inceleyip <b>doğrulanmış rozeti</b> verir.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
              style={{ background: C.stone, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 10px", fontSize: 12, color: C.ink, outline: "none", fontFamily: "inherit" }}>
              {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <label style={{ flex: 1, cursor: "pointer", background: C.ink, color: "#fff", borderRadius: 10, padding: "11px", textAlign: "center", fontSize: 12, fontWeight: 700 }}>
              + Belge yükle
              <input type="file" accept="image/*,application/pdf" onChange={onFile} style={{ display: "none" }} />
            </label>
          </div>
          {docs.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {docs.map((d) => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, border: `1px solid ${C.line}`, borderRadius: 12, padding: 10 }}>
                  {String(d.dataUrl).startsWith("data:image")
                    ? <img src={d.dataUrl} alt="" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 8, objectFit: "cover" }} />
                    : <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 8, background: C.stone, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📄</span>}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{d.type}</div>
                    <div style={{ fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                  </div>
                  <button onClick={() => onRemoveDoc?.(d.id)}
                    style={{ background: "none", border: "none", fontSize: 12, fontWeight: 700, color: C.red, cursor: "pointer" }}>Sil</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Aldığın değerlendirmeler */}
        {(rating || myReviews.length > 0) && (
          <section style={cardSt}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ ...sectionTitle, margin: 0 }}>Aldığın değerlendirmeler</h2>
              {rating && <StarsDisplay value={rating.avg} count={rating.count} className="text-sm" />}
            </div>
            {myReviews.length === 0 ? (
              <p style={{ fontSize: 13, color: C.faint, margin: 0 }}>Henüz değerlendirme yok. İş tamamladıkça puanların burada birikir.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myReviews.map((r) => (
                  <div key={r.id} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{r.fromName}</span>
                      <StarsDisplay value={r.rating} className="text-xs" />
                    </div>
                    {r.comment && <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>{r.comment}</p>}
                    <p style={{ fontSize: 11, color: C.faint, margin: "4px 0 0" }}>{fmtRev(r.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Menü satırları */}
        <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
          {[
            { icon: Package, label: "İlanlarım", desc: "Açtığın ilanlar ve gelen teklifler", to: "/ilanlarim" },
            { icon: Truck, label: "Cüzdan", desc: "Kazanç, hakediş ve harcama", to: "/cuzdan" },
            { icon: Building2, label: "Ödeme & hesap", desc: "Banka / IBAN bilgileri", to: "/cuzdan" },
            ...(isAdmin(user) ? [{ icon: ShieldCheck, label: "Yönetim Paneli", desc: "Şikayet, belge ve moderasyon", to: "/admin" }] : []),
            { icon: HelpCircle, label: "Yardım & destek", desc: "Sık sorulan sorular ve iletişim", to: "/iletisim" },
          ].map((m, i, arr) => {
            const Icon = m.icon;
            return (
              <button key={m.label} onClick={() => navigate(m.to)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "none", border: "none", borderBottom: i < arr.length - 1 ? `1px solid ${C.line}` : "none", textAlign: "left", cursor: "pointer" }}>
                <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, background: C.stone, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color={C.ink} />
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.ink }}>{m.label}</span>
                  <span style={{ display: "block", fontSize: 12, color: C.sub, marginTop: 1 }}>{m.desc}</span>
                </span>
                <ChevronRight size={18} color={C.faint} />
              </button>
            );
          })}
        </section>

        {/* Çıkış */}
        <button type="button" onClick={() => onLogout?.()}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, color: C.red, borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          <LogOut size={18} /> Çıkış yap
        </button>
      </div>
    </div>
  );
}
