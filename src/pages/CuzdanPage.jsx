import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ArrowUp, ArrowDown, Check, Building2, ChevronRight, Info, X } from "lucide-react";
import SEO from "../components/SEO";
import { splitAmount, DEFAULT_FEE_RATE } from "../utils/payments";

// ── Cüzdan / hakediş — kabul edilen tekliflerden kazanç & harcama özeti + escrow durumu.
// Visual: SAHA shell (ink/yellow + Space Mono). Logic preserved 1:1 from previous version.

// SAHA palette
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
};
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// ── Money helpers (UNCHANGED behaviour) ──────────────────────────────
const fmt = (n) => "₺" + Math.round(n || 0).toLocaleString("tr-TR");
const listingOf = (listings, id) => listings.find((l) => String(l.id) === String(id));
const titleOf = (listings, id) => listingOf(listings, id)?.title || "ilan";
const isDone = (listings, id) => {
  const l = listingOf(listings, id);
  return l?.phase === "teslim" || l?.status === "kapali";
};
// Escrow durumu etiketi (ilana göre)
const payInfo = (listings, id) => {
  const s = listingOf(listings, id)?.paymentStatus || "yok";
  if (s === "serbest") return { label: "Ödendi", color: C.green, bg: "#E7F2EA" };
  if (s === "bloke") return { label: "Emanette", color: "#92600A", bg: "#FBF1D6" };
  if (s === "iade") return { label: "İade", color: "#9F1239", bg: "#FBE3E8" };
  return null;
};

// ── shell (SAHA mobile column) ───────────────────────────────────────
const shell = {
  position: "relative",
  margin: "0 auto",
  width: "100%",
  maxWidth: 460,
  minHeight: "100vh",
  background: C.bg,
  display: "flex",
  flexDirection: "column",
  color: C.ink,
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

// ── Movement row (earned + / spent −) ────────────────────────────────
function MovementRow({ listings, o, sign }) {
  const done = isDone(listings, o.listingId);
  const pay = payInfo(listings, o.listingId);
  // Nakliyeci satırında komisyon sonrası net göster
  const net = sign === "+" ? splitAmount(o.price).payout : o.price;
  const positive = sign === "+";
  // Status caption (MONO, small)
  const statusText = positive
    ? (pay ? pay.label : done ? "Tamamlandı" : "Devam ediyor")
    : done ? "Tamamlandı" : "Devam ediyor";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderTop: `1px solid ${C.line}`,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 38,
          height: 38,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: positive ? "#E7F2EA" : C.stone,
          color: positive ? C.green : C.ink,
        }}
      >
        {positive ? <ArrowUp size={18} strokeWidth={2.4} /> : <ArrowDown size={18} strokeWidth={2.4} />}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.ink,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {titleOf(listings, o.listingId)}
        </div>
        <div
          style={{
            marginTop: 3,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.02em",
            color: pay ? pay.color : C.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {statusText}
          {positive && o.fromUser ? ` · ${o.fromUser}` : ""}
        </div>
      </div>

      <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 15,
            fontWeight: 700,
            color: positive ? C.green : C.ink,
          }}
        >
          {sign}{fmt(net)}
        </div>
        {positive && (
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 1 }}>
            brüt {fmt(o.price)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Withdraw bottom sheet ────────────────────────────────────────────
function WithdrawSheet({ balance, onClose, onConfirm }) {
  const [amount, setAmount] = useState(String(Math.round(balance || 0)));
  const quick = [
    Math.round((balance || 0) * 0.25),
    Math.round((balance || 0) * 0.5),
    Math.round(balance || 0),
  ].filter((v, i, a) => v > 0 && a.indexOf(v) === i);

  const numeric = Math.max(0, Math.min(Math.round(Number(amount) || 0), Math.round(balance || 0)));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
      }}
    >
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(10,10,10,0.45)" }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 460,
          background: C.bg,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          padding: "10px 18px 26px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* grabber */}
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 12 }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: C.border }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: C.ink }}>Para çek</h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            style={{
              border: "none",
              background: C.card,
              borderRadius: 999,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: C.sub,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* amount input card */}
        <div
          style={{
            background: C.ink,
            borderRadius: 20,
            padding: "20px 18px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>
            Çekilecek tutar
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: C.yellow }}>₺</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              style={{
                width: "60%",
                border: "none",
                outline: "none",
                background: "transparent",
                textAlign: "center",
                fontFamily: MONO,
                fontSize: 32,
                fontWeight: 700,
                color: C.yellow,
                padding: 0,
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
            Kullanılabilir bakiye {fmt(balance)}
          </div>
        </div>

        {/* quick amounts */}
        {quick.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {quick.map((q, i) => (
              <button
                key={i}
                onClick={() => setAmount(String(q))}
                style={{
                  flex: 1,
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  borderRadius: 12,
                  padding: "11px 0",
                  fontFamily: MONO,
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.ink,
                  cursor: "pointer",
                }}
              >
                {fmt(q)}
              </button>
            ))}
          </div>
        )}

        {/* bank account */}
        <div
          style={{
            marginTop: 16,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: C.stone,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.ink,
            }}
          >
            <Building2 size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Banka hesabı</div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: C.muted, marginTop: 2 }}>
              IBAN •••• 4821
            </div>
          </div>
          <ChevronRight size={18} color={C.faint} />
        </div>

        {/* fee note */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: C.green,
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <Check size={16} strokeWidth={2.6} />
          Ücretsiz, 1 iş günü içinde hesabınızda
        </div>

        {/* confirm */}
        <button
          onClick={() => onConfirm(numeric)}
          disabled={numeric <= 0}
          style={{
            marginTop: 18,
            width: "100%",
            border: "none",
            borderRadius: 16,
            padding: "16px 0",
            background: numeric > 0 ? C.ink : C.border,
            color: numeric > 0 ? C.yellow : C.muted,
            fontFamily: MONO,
            fontSize: 15,
            fontWeight: 700,
            cursor: numeric > 0 ? "pointer" : "default",
          }}
        >
          {fmt(numeric)} çek
        </button>
      </div>
    </div>
  );
}

export default function CuzdanPage({ user, listings = [], offers = [], onRequireAuth }) {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [note, setNote] = useState("");

  // Hook'lar her render'da aynı sırada çağrılmalı → erken return'den ÖNCE, null-safe.
  const earned = useMemo(() => (!user ? [] : offers.filter((o) => o.status === "kabul" && String(o.fromUserId) === String(user.id) && o.price)), [offers, user]);
  const spent = useMemo(() => (!user ? [] : offers.filter((o) => o.status === "kabul" && o.price && listings.some((l) => String(l.id) === String(o.listingId) && String(l.ownerId) === String(user.id)))), [offers, listings, user]);

  if (!user) {
    return (
      <div style={shell}>
        <SEO title="Cüzdan" />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 44 }}>🔒</div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.ink }}>Cüzdan için giriş yapın</h1>
          <button
            onClick={() => onRequireAuth?.()}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "14px 22px",
              background: C.ink,
              color: C.yellow,
              fontFamily: MONO,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Giriş yap / Kayıt ol
          </button>
        </div>
      </div>
    );
  }

  // ── Calculations (UNCHANGED) ───────────────────────────────────────
  const sum = (arr) => arr.reduce((s, o) => s + (o.price || 0), 0);
  // Nakliyeci kazancı komisyon SONRASI net
  const sumNet = (arr) => arr.reduce((s, o) => s + splitAmount(o.price).payout, 0);
  const earnTotal = sumNet(earned);
  // Emanette bekleyen (bloke) vs serbest bırakılmış (ödendi)
  const stOf = (o) => listings.find((l) => String(l.id) === String(o.listingId))?.paymentStatus || "yok";
  const earnReleased = sumNet(earned.filter((o) => stOf(o) === "serbest"));
  const earnInEscrow = sumNet(earned.filter((o) => stOf(o) === "bloke"));
  const earnPending = earnTotal - earnReleased - earnInEscrow; // henüz ödeme başlamamış
  const spendTotal = sum(spent);
  const feeTotal = earned.reduce((s, o) => s + splitAmount(o.price).fee, 0);

  // Çekilebilir bakiye = ödendi (serbest) + henüz ödeme başlamamış (bekleyen). Emanetteki bloke hariç.
  const withdrawable = earnReleased + earnPending;

  // Birleşik hareket listesi (kazanç + harcama)
  const hasMovements = earned.length > 0 || spent.length > 0;

  // Demo bankaya çekme — backend yok, sadece bilgilendirme.
  const handleWithdraw = (amount) => {
    setSheetOpen(false);
    setNote(`Para çekme yakında: ${fmt(amount)} talebi alındı (demo).`);
    window.setTimeout(() => setNote(""), 3200);
  };

  return (
    <div style={shell}>
      <SEO title="Cüzdan" description="Kazanç ve harcama özeti, hakediş durumu." />

      {/* App bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: C.header,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "12px 12px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Geri"
          style={{
            border: "none",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            cursor: "pointer",
            color: C.ink,
          }}
        >
          <ChevronLeft size={24} strokeWidth={2.2} />
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.ink }}>Cüzdan</h1>
      </div>

      {/* Scroll body (bottom padding for global tab bar) */}
      <div style={{ flex: 1, padding: "16px 16px 96px" }}>
        {/* Balance card */}
        <div
          style={{
            background: C.ink,
            borderRadius: 24,
            padding: "22px 20px",
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>Net hakediş (komisyon sonrası)</div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 38,
              fontWeight: 700,
              color: C.yellow,
              letterSpacing: "-0.02em",
              marginTop: 4,
            }}
          >
            {fmt(earnTotal)}
          </div>

          {/* breakdown */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 18px", marginTop: 12, fontSize: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>Ödendi <b style={{ color: "#4ADE80", fontFamily: MONO }}>{fmt(earnReleased)}</b></span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>Emanette <b style={{ color: C.yellow, fontFamily: MONO }}>{fmt(earnInEscrow)}</b></span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>Bekleyen <b style={{ color: "#fff", fontFamily: MONO }}>{fmt(earnPending)}</b></span>
          </div>

          {/* actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button
              onClick={() => setSheetOpen(true)}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 14,
                padding: "13px 0",
                background: C.yellow,
                color: C.ink,
                fontFamily: MONO,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Para çek
            </button>
            <button
              onClick={() => navigate("/ilanlarim")}
              style={{
                flex: 1,
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: 14,
                padding: "13px 0",
                background: "transparent",
                color: "#fff",
                fontFamily: MONO,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Geçmiş
            </button>
          </div>
        </div>

        {/* secure payment note */}
        <div
          style={{
            marginTop: 12,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "12px 14px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <Info size={17} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
            Güvenli ödeme aktif — para emanette bloke kalır, <b style={{ color: C.ink }}>teslimde</b> serbest bırakılır.
            Platform komisyonu %{Math.round(DEFAULT_FEE_RATE * 100)} (toplam <b style={{ fontFamily: MONO, color: C.ink }}>{fmt(feeTotal)}</b>).
          </div>
        </div>

        {/* two mini cards */}
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div
            style={{
              flex: 1,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Emanette</div>
            <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.ink, marginTop: 4 }}>{fmt(earnInEscrow)}</div>
            <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>Teslimde serbest</div>
          </div>
          <div
            style={{
              flex: 1,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Ödendi</div>
            <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.green, marginTop: 4 }}>{fmt(earnReleased)}</div>
            <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{earned.length} kabul edilen iş</div>
          </div>
        </div>

        {/* spend card */}
        {spent.length > 0 && (
          <div
            style={{
              marginTop: 12,
              background: C.stone,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Harcama (iş sahibi)</div>
              <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{spent.length} kabul edilen teklif</div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: C.ink }}>{fmt(spendTotal)}</div>
          </div>
        )}

        {/* Movements */}
        <div style={{ marginTop: 22 }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: C.ink }}>Hareketler</h2>

          {hasMovements ? (
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                overflow: "hidden",
              }}
            >
              {/* earned (+) then spent (−) — first row no top border via :first-child handling */}
              <div style={{ marginTop: -1 }}>
                {earned.map((o) => (
                  <MovementRow key={`e-${o.id}`} listings={listings} o={o} sign="+" />
                ))}
                {spent.map((o) => (
                  <MovementRow key={`s-${o.id}`} listings={listings} o={o} sign="−" />
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: "44px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 34 }}>💸</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Henüz hareket yok</div>
              <div style={{ fontSize: 13, color: C.muted }}>Teklif kabul edildikçe hakediş burada görünür.</div>
              <button
                onClick={() => navigate("/ilanlar")}
                style={{
                  marginTop: 6,
                  border: "none",
                  borderRadius: 999,
                  padding: "11px 20px",
                  background: C.yellow,
                  color: C.ink,
                  fontFamily: MONO,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                İlanlara göz at
              </button>
            </div>
          )}
        </div>
      </div>

      {/* toast / inline note */}
      {note && (
        <div
          style={{
            position: "fixed",
            bottom: 88,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 70,
            maxWidth: 420,
            width: "calc(100% - 32px)",
            background: C.ink,
            color: "#fff",
            borderRadius: 14,
            padding: "12px 16px",
            fontSize: 13,
            fontWeight: 600,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          {note}
        </div>
      )}

      {/* Withdraw bottom sheet */}
      {sheetOpen && (
        <WithdrawSheet
          balance={withdrawable}
          onClose={() => setSheetOpen(false)}
          onConfirm={handleWithdraw}
        />
      )}
    </div>
  );
}
