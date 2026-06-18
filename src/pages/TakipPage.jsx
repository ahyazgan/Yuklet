import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Check, MapPin, Phone, MessageSquare } from "lucide-react";
import { LISTINGS } from "../data/listings";
import { CATS } from "../data/categories";
import { StarsDisplay, StarsInput } from "../components/Stars";
import ReportModal from "../components/ReportModal";
import SEO from "../components/SEO";
import { splitAmount, payableAmount, fmtTL, PAYMENT_LABEL } from "../utils/payments";
import { newId, nowIso } from "../utils/id";

// ── "SAHA" sevkiyat takibi — open kunye card + job timeline + live trip counter
//    + dark detail/nakliyeci panel. Brutalist C palette + Space Mono, inline styled.
//    Tum eski islevsellik (faz akisi, escrow, degerlendirme, sikayet) korundu.

const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  yellowDeep: "#E0B400",
  green: "#16803C",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  line: "#F0ECE3",
  sub: "#5A5852",
  muted: "#9A968D",
  faint: "#A8A39A",
  rose: "#B91C1C",
};
const MONO = "'Space Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace";

const idText = (l) => "HMT-" + String(l.id).padStart(4, "0");

const PHASES = [["eslesti", "Eşleşti"], ["yuklendi", "Yüklendi"], ["yolda", "Yolda"], ["teslim", "Teslim"]];

const shell = {
  width: "100%",
  maxWidth: 460,
  margin: "0 auto",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: C.bg,
  color: C.ink,
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export default function TakipPage({ listings = LISTINGS, user, offers = [], getContact, reviews = [], onAddReview, getUserRating, onUpdateListing, onReport, onPayToEscrow, onReleasePayment }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rateVal, setRateVal] = useState(0);
  const [rateComment, setRateComment] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [payMsg, setPayMsg] = useState("");
  const l = listings.find((x) => String(x.id) === String(id));

  if (!l) {
    return (
      <div style={shell}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "72px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>📦</div>
          <h1 style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, margin: 0 }}>Takip kaydı bulunamadı</h1>
          <button
            onClick={() => navigate("/ilanlar")}
            style={{ background: C.yellow, border: `2px solid ${C.ink}`, padding: "11px 22px", fontFamily: MONO, fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.ink }}
          >
            İLANLARA DÖN
          </button>
        </div>
      </div>
    );
  }

  const cat = CATS.find((c) => c.id === l.cat);
  const accepted = offers.find((o) => String(o.listingId) === String(l.id) && o.status === "kabul");
  const nakliyeci = accepted?.fromUser || "Atanmadı";
  const nakContact = accepted ? getContact?.(accepted.fromUserId) : null;
  const matched = l.status === "eslesti" || Boolean(accepted);
  const hasOffers = (l.offers || 0) > 0 || offers.some((o) => String(o.listingId) === String(l.id));

  const from = l.il;
  const fromSub = l.yukleme || l.ilce || "";
  const to = l.bosaltma ? l.bosaltma.split(",")[0] : (l.ilce || "Saha");
  const fiyat = accepted?.price ? `₺${accepted.price.toLocaleString("tr-TR")}` : (l.priceType === "sabit" && l.price ? `₺${l.price.toLocaleString("tr-TR")}` : "Teklife açık");
  const statusLabel = matched ? "Yolda" : hasOffers ? "Teklif aşaması" : "İlan yayında";

  // ── Karşılıklı değerlendirme (eşleşince) ──
  const isOwner = user && String(user.id) === String(l.ownerId);
  const isNakliyeci = accepted && user && String(user.id) === String(accepted.fromUserId);
  const counterpart = matched
    ? (isOwner ? { id: accepted?.fromUserId, name: nakliyeci, role: "Nakliyeci" }
      : isNakliyeci ? { id: l.ownerId, name: l.owner, role: "İş sahibi" } : null)
    : null;
  const myReview = counterpart && reviews.find(
    (r) => String(r.fromId) === String(user.id) && String(r.toId) === String(counterpart.id) && String(r.listingId) === String(l.id)
  );
  const counterpartRating = counterpart ? getUserRating?.(counterpart.id) : null;

  // ── İş durumu akışı ──
  const canManage = matched && (isOwner || isNakliyeci);
  const phase = l.phase || (matched ? "eslesti" : null);
  const phaseIdx = PHASES.findIndex((p) => p[0] === phase);
  const nextPhase = phaseIdx >= 0 && phaseIdx < PHASES.length - 1 ? PHASES[phaseIdx + 1] : null;
  const estTrips = l.amount && (l.unit === "ton" || l.unit === "m³") ? Math.ceil(l.amount / 18) : null;
  const isDone = phase === "teslim" || l.status === "kapali";
  const advancePhase = () => {
    if (!nextPhase) return;
    onUpdateListing?.(l.id, { phase: nextPhase[0], ...(nextPhase[0] === "teslim" ? { status: "kapali" } : {}) });
  };

  // Canli sefer sayaci — gercek l.tripsDone / estTrips (yoksa faz bazli)
  const tripsDone = l.tripsDone || 0;
  const tripsTotal = estTrips || PHASES.length;
  const tripsCurrent = estTrips ? tripsDone : Math.max(0, phaseIdx + 1);
  const tripsPct = tripsTotal > 0 ? Math.min(100, Math.round((tripsCurrent / tripsTotal) * 100)) : 0;

  // ── Ödeme / Escrow (emanet) ──
  const payStatus = l.paymentStatus || "yok";
  const amountToPay = payableAmount(l, accepted);
  const split = splitAmount(l.paymentAmount || amountToPay);
  const canPay = matched && isOwner && payStatus === "yok" && amountToPay > 0;        // müteahhit emanete öder
  const canRelease = isOwner && payStatus === "bloke" && phase === "teslim";          // teslim sonrası serbest bırakır
  const doPay = async () => {
    setPayBusy(true); setPayMsg("");
    const res = await onPayToEscrow?.(l.id, amountToPay);
    setPayBusy(false);
    setPayMsg(res?.ok ? (res.mock ? "Ödeme alındı (demo). Para emanette bloke." : "Ödeme alındı. Para emanette.") : (res?.error || "Ödeme başarısız."));
  };
  const doRelease = async () => {
    setPayBusy(true); setPayMsg("");
    const res = await onReleasePayment?.(l);
    setPayBusy(false);
    setPayMsg(res?.ok ? "Ödeme nakliyeciye serbest bırakıldı 🎉" : (res?.error || "İşlem başarısız."));
  };

  const submitReview = () => {
    if (!counterpart || !rateVal) return;
    onAddReview?.({
      id: newId(), listingId: l.id, offerId: accepted?.id,
      fromId: user.id, fromName: user.name, toId: counterpart.id, toName: counterpart.name,
      rating: rateVal, comment: rateComment.trim(), createdAt: nowIso(),
    });
    setRateVal(0); setRateComment("");
  };

  // ── Kunye kartindaki ozellik grid ──
  const SPECS = [
    ["YÜKLEME", from],
    ["BOŞALTMA", to],
    ["MİKTAR", l.amount ? `${l.amount} ${l.unit || ""}` : "—"],
    ["MALZEME", l.material || cat?.name || "—"],
    ["TARİH", l.dateText || "—"],
    ["DURUM", statusLabel],
  ];

  // ── Koyu detay grid ──
  const DETAIL = [
    ["İŞ SAHİBİ", l.owner || "—"],
    ["NAKLİYECİ", nakliyeci],
    ["TUTAR", fiyat],
    ["KATEGORİ", cat?.name || "—"],
  ];

  // ── Shared inline-style helpers ──
  const sectionCard = {
    background: C.card,
    border: `2px solid ${C.ink}`,
    padding: 18,
    display: "flex",
    flexDirection: "column",
  };
  const labelTiny = { fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: C.muted, textTransform: "uppercase" };
  const sectionTitle = { fontFamily: MONO, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", margin: 0, color: C.ink, textTransform: "uppercase" };

  return (
    <div style={shell}>
      <SEO title={`Takip · ${l.title}`} description="Eşleşen işin sevkiyat takibi." />

      {/* ── DARK HEADER BLOCK (ink): nav + HMT no + title + status + trip counter + payout + bar ── */}
      <div style={{ background: C.ink, color: "#fff", padding: "14px 18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Geri"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: "transparent", border: `2px solid ${C.yellow}`, color: C.yellow, cursor: "pointer" }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: C.yellow }}>SAHA · TAKİP</span>
          <button
            onClick={() => navigate(`/ilan/${l.id}`)}
            aria-label="İlana git"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: "transparent", border: `2px solid #2A2A2A`, color: "#9A968D", cursor: "pointer", fontFamily: MONO, fontSize: 16, fontWeight: 700 }}
          >
            ⋯
          </button>
        </div>

        {/* HMT no + title + status badge */}
        <div style={{ marginTop: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#7C7870" }}>TAKİP NO</span>
            <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.yellow, marginTop: 2 }}>{idText(l)}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#C9C4BA", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 230 }}>{l.title}</div>
          </div>
          <span
            style={{
              flexShrink: 0,
              fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
              padding: "6px 10px",
              border: `2px solid ${isDone ? C.green : matched ? C.yellow : "#3A3A3A"}`,
              color: isDone ? "#7BE3A0" : matched ? C.yellow : "#9A968D",
              background: isDone ? "rgba(22,128,60,0.15)" : "transparent",
              display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isDone ? C.green : matched ? C.yellow : "#5A5852" }} />
            {isDone ? "TAMAMLANDI" : matched ? "DEVAM" : "BEKLEMEDE"}
          </span>
        </div>

        {/* Live trip counter + payout */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#7C7870" }}>
              {estTrips ? "SEFER" : "AŞAMA"}
            </span>
            <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 700, lineHeight: 1, color: C.yellow, marginTop: 4 }}>
              {tripsCurrent}
              <span style={{ fontSize: 22, color: "#5A5852" }}>/{tripsTotal}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#7C7870" }}>HAKEDİŞ</span>
            <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 4 }}>{fiyat}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 14, height: 8, background: "#1F1F1F", border: `1px solid #2A2A2A` }}>
          <div style={{ height: "100%", width: `${tripsPct}%`, background: C.yellow, transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, padding: "16px 14px 96px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Tamamlandi vurgusu */}
        {isDone && (
          <div style={{ background: C.green, border: `2px solid ${C.ink}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, border: "2px solid #fff", flexShrink: 0 }}>
              <Check size={16} />
            </span>
            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>İŞ TAMAMLANDI — TESLİM EDİLDİ</span>
          </div>
        )}

        {/* AÇIK KÜNYE KARTI */}
        <div style={sectionCard}>
          <span style={labelTiny}>İŞ KÜNYESİ</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px", marginTop: 14 }}>
            {SPECS.map(([k, v]) => (
              <div key={k} style={{ minWidth: 0 }}>
                <span style={labelTiny}>{k}</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* İŞ DURUMU ZAMAN ÇİZELGESİ */}
        {phase && (
          <div style={sectionCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={sectionTitle}>Durum</h2>
              {estTrips && (
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.sub }}>{tripsDone}/{estTrips} SEFER</span>
              )}
            </div>

            {/* Timeline: done / active / todo */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {PHASES.map(([k, lbl], i) => {
                const done = i < phaseIdx;
                const active = i === phaseIdx;
                const isLast = i === PHASES.length - 1;
                const dotBg = done ? C.green : active ? C.yellow : C.card;
                const dotBorder = done ? C.green : active ? C.ink : C.border;
                return (
                  <div key={k} style={{ display: "flex", gap: 12 }}>
                    {/* dot + connector */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: 22, height: 22, borderRadius: "50%",
                          background: dotBg, border: `2px solid ${dotBorder}`, flexShrink: 0,
                          color: done ? "#fff" : C.ink,
                        }}
                      >
                        {done ? <Check size={12} /> : active ? <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.ink }} /> : null}
                      </span>
                      {!isLast && <span style={{ width: 2, flex: 1, minHeight: 22, background: done ? C.green : C.border }} />}
                    </div>
                    {/* label */}
                    <div style={{ paddingBottom: isLast ? 0 : 14, paddingTop: 1 }}>
                      <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: done || active ? C.ink : C.faint }}>{lbl}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        {done ? "Tamamlandı" : active ? "Şu an bu aşamada" : "Bekliyor"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Faz ilerletme + sefer */}
            {canManage && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                {nextPhase && (
                  <button
                    onClick={advancePhase}
                    style={{ background: C.ink, color: "#fff", border: `2px solid ${C.ink}`, padding: "11px 16px", fontFamily: MONO, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    {nextPhase[1].toUpperCase()} OLARAK İŞARETLE →
                  </button>
                )}
                {estTrips && phaseIdx >= 1 && tripsDone < estTrips && (
                  <button
                    onClick={() => onUpdateListing?.(l.id, { tripsDone: tripsDone + 1 })}
                    style={{ background: C.card, color: C.ink, border: `2px solid ${C.ink}`, padding: "11px 16px", fontFamily: MONO, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    +1 SEFER
                  </button>
                )}
                {phase === "teslim" && (
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.green, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Check size={14} /> Teslim edildi — iş tamamlandı
                  </span>
                )}
              </div>
            )}
            {!canManage && phase === "teslim" && (
              <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.green, margin: "14px 0 0", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Check size={14} /> Bu iş tamamlandı.
              </p>
            )}
          </div>
        )}

        {/* ÖDEME / ESCROW (emanet) */}
        {matched && amountToPay > 0 && (
          <div style={sectionCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={sectionTitle}>Güvenli Ödeme</h2>
              <span
                style={{
                  fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                  padding: "5px 9px", border: `2px solid ${C.ink}`,
                  background: payStatus === "serbest" ? C.green : payStatus === "bloke" ? C.yellow : payStatus === "iade" ? C.rose : C.stone,
                  color: payStatus === "serbest" || payStatus === "iade" ? "#fff" : C.ink,
                }}
              >
                {PAYMENT_LABEL[payStatus]}
              </span>
            </div>

            {/* Tutar dökümü */}
            <div style={{ background: C.stone, border: `2px solid ${C.border}`, padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.sub }}>İş bedeli</span>
                <span style={{ fontFamily: MONO, fontWeight: 700, color: C.ink }}>{fmtTL(split.total)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.sub }}>Platform komisyonu (%{Math.round(split.feeRate * 100)})</span>
                <span style={{ fontFamily: MONO, fontWeight: 700, color: C.rose }}>−{fmtTL(split.fee)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, borderTop: `2px solid ${C.border}`, paddingTop: 9 }}>
                <span style={{ fontWeight: 700, color: C.ink }}>Nakliyecinin eline geçen</span>
                <span style={{ fontFamily: MONO, fontWeight: 700, color: C.green }}>{fmtTL(split.payout)}</span>
              </div>
            </div>

            {/* Açıklama */}
            {payStatus === "yok" && (
              <p style={{ fontSize: 12, lineHeight: 1.6, color: C.sub, margin: "12px 0 0" }}>
                Ödemeyi <b style={{ color: C.ink }}>emanete</b> yatır. Para platformda bloke kalır; <b>teslim aldığında</b> serbest bırakırsın. İş yapılmazsa iade edilir.
              </p>
            )}
            {payStatus === "bloke" && (
              <p style={{ fontSize: 12, lineHeight: 1.6, color: C.yellowDeep, margin: "12px 0 0" }}>
                💰 Para emanette güvende. Yük <b>teslim edildiğinde</b> “Ödemeyi serbest bırak” ile nakliyeciye aktarılır.
              </p>
            )}
            {payStatus === "serbest" && (
              <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.green, margin: "12px 0 0", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Check size={14} /> Ödeme tamamlandı, nakliyeciye {fmtTL(split.payout)} aktarıldı.
              </p>
            )}

            {canPay && (
              <button
                onClick={doPay}
                disabled={payBusy}
                style={{ marginTop: 14, width: "100%", background: C.yellow, border: `2px solid ${C.ink}`, padding: "13px 0", fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.ink, cursor: payBusy ? "default" : "pointer", opacity: payBusy ? 0.6 : 1 }}
              >
                {payBusy ? "İŞLENİYOR…" : `${fmtTL(split.total)} EMANETE ÖDE`}
              </button>
            )}
            {canRelease && (
              <button
                onClick={doRelease}
                disabled={payBusy}
                style={{ marginTop: 14, width: "100%", background: C.green, border: `2px solid ${C.ink}`, padding: "13px 0", fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#fff", cursor: payBusy ? "default" : "pointer", opacity: payBusy ? 0.6 : 1 }}
              >
                {payBusy ? "İŞLENİYOR…" : "TESLİM ALDIM — ÖDEMEYİ SERBEST BIRAK"}
              </button>
            )}
            {payStatus === "bloke" && !canRelease && isOwner && phase !== "teslim" && (
              <p style={{ fontSize: 11, color: C.muted, margin: "12px 0 0" }}>Serbest bırakma, iş “Teslim” aşamasına gelince açılır.</p>
            )}
            {isNakliyeci && payStatus === "bloke" && (
              <p style={{ fontSize: 12, fontWeight: 700, color: C.yellowDeep, margin: "12px 0 0" }}>💰 İş bedeli emanette güvende. Teslimden sonra hesabına geçecek.</p>
            )}
            {isNakliyeci && payStatus === "serbest" && (
              <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.green, margin: "12px 0 0", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Check size={14} /> {fmtTL(split.payout)} hesabına aktarıldı.
              </p>
            )}

            {payMsg && (
              <div style={{ marginTop: 12, background: C.stone, border: `2px solid ${C.border}`, padding: "10px 14px", fontSize: 12, fontWeight: 600, color: C.ink }}>{payMsg}</div>
            )}
          </div>
        )}

        {/* ── KOYU DETAY / NAKLİYECİ PANELİ ── */}
        <div style={{ background: C.ink, border: `2px solid ${C.ink}`, color: "#fff", padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Rota özeti */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, borderBottom: "2px solid #1F1F1F", paddingBottom: 14 }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#7C7870", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <MapPin size={10} /> YÜKLEME
              </span>
              <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 4 }}>{from}</div>
              {fromSub && <div style={{ fontSize: 11, color: "#9A968D", marginTop: 2 }}>{fromSub}</div>}
            </div>
            <div style={{ textAlign: "right", minWidth: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#7C7870" }}>BOŞALTMA · {l.dateText || "—"}</span>
              <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 4 }}>{to}</div>
            </div>
          </div>

          {/* Detay grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
            {DETAIL.map(([k, v]) => (
              <div key={k} style={{ minWidth: 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "#7C7870" }}>{k}</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis" }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Nakliyeci widget */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#161616", border: "2px solid #2A2A2A", padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: "50%", border: `2px solid ${C.yellow}`, background: "#222", color: C.yellow, fontFamily: MONO, fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                {(nakliyeci || "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nakliyeci}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: "#9A968D", letterSpacing: "0.06em", marginTop: 2 }}>NAKLİYECİ</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {nakContact?.phone ? (
                <a
                  href={`tel:${nakContact.phone}`}
                  aria-label="Ara"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}` }}
                >
                  <Phone size={16} />
                </a>
              ) : (
                <span
                  aria-label="Telefon yok"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: "#222", color: "#5A5852", border: "2px solid #2A2A2A" }}
                >
                  <Phone size={16} />
                </span>
              )}
              <button
                onClick={() => navigate("/mesajlar")}
                aria-label="Mesaj gönder"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: "#fff", color: C.ink, border: `2px solid ${C.ink}`, cursor: "pointer" }}
              >
                <MessageSquare size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Sözleşme / irsaliye */}
        {matched && accepted && (
          <button
            onClick={() => navigate(`/sozlesme/${accepted.id}`)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.card, border: `2px solid ${C.ink}`, padding: "13px 0", fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.ink, cursor: "pointer" }}
          >
            📄 TAŞIMA SÖZLEŞMESİ / İRSALİYE
          </button>
        )}

        {/* Karşılıklı değerlendirme */}
        {counterpart && (
          <div style={{ ...sectionCard, ...(isDone && !myReview ? { borderColor: C.yellow, borderWidth: 3 } : {}) }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <h2 style={sectionTitle}>{counterpart.role} Değerlendirmesi</h2>
              {counterpartRating && <StarsDisplay value={counterpartRating.avg} count={counterpartRating.count} className="text-xs" />}
            </div>
            {myReview ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: C.green }}>
                <StarsDisplay value={myReview.rating} className="text-sm" /> Değerlendirdin, teşekkürler ✓
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12, color: C.sub, margin: "0 0 14px", lineHeight: 1.6 }}>
                  <b style={{ color: C.ink }}>{counterpart.name}</b> ile çalışman nasıldı? Puan ver, topluluk güvenini büyüt.
                </p>
                <StarsInput value={rateVal} onChange={setRateVal} />
                <textarea
                  value={rateComment}
                  onChange={(e) => setRateComment(e.target.value)}
                  placeholder="Kısa yorum (opsiyonel)"
                  style={{ marginTop: 14, minHeight: 64, width: "100%", boxSizing: "border-box", background: C.stone, border: `2px solid ${C.border}`, padding: "11px 14px", fontSize: 13, color: C.ink, outline: "none", resize: "vertical", fontFamily: "inherit" }}
                />
                <button
                  onClick={submitReview}
                  disabled={!rateVal}
                  style={{ marginTop: 12, width: "100%", background: C.yellow, border: `2px solid ${C.ink}`, padding: "12px 0", fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.ink, cursor: rateVal ? "pointer" : "default", opacity: rateVal ? 1 : 0.5 }}
                >
                  DEĞERLENDİR
                </button>
              </>
            )}
          </div>
        )}

        {/* Henüz eşleşmedi bilgisi */}
        {!matched && (
          <div style={{ background: C.stone, border: `2px dashed ${C.border}`, padding: "16px 18px", textAlign: "center" }}>
            <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.sub, margin: 0 }}>BU İŞ HENÜZ EŞLEŞMEDİ</p>
            <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0", lineHeight: 1.6 }}>
              {user ? "Teklifler geldikçe takip burada güncellenir." : "Takip detayları eşleşme sonrası canlanır."}
            </p>
          </div>
        )}

        {/* Şikayet / anlaşmazlık */}
        <button
          onClick={() => setShowReport(true)}
          style={{ alignSelf: "center", background: "transparent", border: "none", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.muted, cursor: "pointer", letterSpacing: "0.04em", padding: "4px 0" }}
        >
          ⚠ SORUN BİLDİR / ANLAŞMAZLIK
        </button>
      </div>

      {showReport && (
        <ReportModal
          targetLabel={counterpart ? `${counterpart.role}: ${counterpart.name}` : `İlan: ${l.title}`}
          onClose={() => setShowReport(false)}
          onSubmit={(p) => { onReport?.({ type: counterpart ? "user" : "listing", targetId: counterpart?.id || l.id, listingId: l.id, fromId: user?.id || null, fromName: user?.name || "misafir", ...p }); }}
        />
      )}
    </div>
  );
}
