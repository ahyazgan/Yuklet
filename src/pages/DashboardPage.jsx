import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CATS } from "../data/categories";
import CategoryIcon from "../components/CategoryIcon";
import SEO from "../components/SEO";

function StatCard({ icon, label, value, sub, clr = "var(--accent)", bg = "var(--accent-bg)" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px", boxShadow: "var(--shadow)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
        <span style={{ fontSize: 13, color: "var(--text-sec)", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: clr, lineHeight: 1 }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-ter)", marginTop: 5 }}>{sub}</div>}
    </motion.div>
  );
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }); }
  catch { return ""; }
}

export default function DashboardPage({ user, listings = [], offers = [], messages = [], onRequireAuth }) {
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="page-content" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", paddingTop: 48 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Paneli görmek için giriş yapın</h1>
        <button onClick={() => onRequireAuth?.()} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "13px 24px", borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Giriş yap / Kayıt ol
        </button>
      </div>
    );
  }

  const isNakliyeci = user.role === "nakliyeci";
  const myListings = useMemo(() => listings.filter(l => l.ownerId === user.id), [listings, user.id]);
  const myOffers = useMemo(() => offers.filter(o => String(o.fromUserId) === String(user.id)), [offers, user.id]);

  // --- Nakliyeci istatistikleri ---
  const acceptedOffers = myOffers.filter(o => o.status === "kabul");
  const totalTrips = acceptedOffers.length;
  const totalTon = useMemo(() => acceptedOffers.reduce((sum, o) => {
    const l = listings.find(x => String(x.id) === String(o.listingId));
    return sum + (l?.amount || 0);
  }, 0), [acceptedOffers, listings]);
  const totalEarnings = useMemo(() => acceptedOffers.reduce((sum, o) => sum + (o.price || 0), 0), [acceptedOffers]);
  const activeVehicles = myListings.filter(l => l.type === "arac" && l.status === "aktif").length;

  // --- İş veren / Tedarikçi istatistikleri ---
  const activeListings = myListings.filter(l => l.status === "aktif").length;
  const matchedListings = myListings.filter(l => l.status === "eslesti").length;
  const pendingOffers = useMemo(() => offers.filter(o =>
    o.status === "beklemede" && myListings.some(l => String(l.id) === String(o.listingId))
  ).length, [offers, myListings]);
  const totalVolume = useMemo(() => myListings.filter(l => l.status === "eslesti").reduce((s, l) => s + (l.amount || 0), 0), [myListings]);

  // Son aktivite (mesajlar + teklifler birlikte, son 10)
  const activity = useMemo(() => {
    const items = [
      ...messages.filter(m => String(m.fromId) === String(user.id) || String(m.toId) === String(user.id)).map(m => ({
        key: `msg-${m.id}`, icon: "💬", text: `${m.fromId === user.id ? "Mesaj gönderdiniz" : `${m.fromName} mesaj gönderdi`}: "${m.text.slice(0, 40)}${m.text.length > 40 ? "…" : ""}"`, date: m.createdAt, link: "/mesajlar",
      })),
      ...offers.filter(o => String(o.fromUserId) === String(user.id)).map(o => ({
        key: `offer-${o.id}`, icon: o.status === "kabul" ? "✅" : o.status === "ret" ? "❌" : "📝",
        text: `Teklif ${o.status === "kabul" ? "kabul edildi" : o.status === "ret" ? "reddedildi" : "gönderildi"}${o.price ? ` — ${o.price.toLocaleString("tr-TR")} ₺` : ""}`,
        date: o.createdAt, link: `/ilan/${o.listingId}`,
      })),
      ...offers.filter(o => o.status !== "beklemede" && myListings.some(l => String(l.id) === String(o.listingId))).map(o => ({
        key: `recv-${o.id}`, icon: o.status === "kabul" ? "🤝" : "📨",
        text: `${o.fromUser} teklif ${o.status === "kabul" ? "kabul edildi" : "reddedildi"}${o.price ? ` — ${o.price.toLocaleString("tr-TR")} ₺` : ""}`,
        date: o.createdAt, link: "/ilanlarim",
      })),
    ];
    return items.sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 10);
  }, [messages, offers, myListings, user.id]);

  const roleLabel = isNakliyeci ? "Nakliyeci" : user.role === "tedarikci" ? "Tedarikçi" : "İş Veren";
  const roleClr = isNakliyeci ? "var(--green)" : user.role === "tedarikci" ? "var(--blue)" : "var(--accent)";
  const roleBg = isNakliyeci ? "var(--green-bg)" : user.role === "tedarikci" ? "var(--blue-bg)" : "var(--accent-bg)";

  return (
    <div className="page-content">
      <SEO title="Panelim" description="Kazanç özeti, sefer istatistikleri ve son aktiviteniz." />

      {/* Karşılama */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)" }}>Merhaba, {user.name} 👋</h1>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: roleClr, background: roleBg, padding: "3px 10px", borderRadius: 20 }}>{roleLabel}</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-sec)" }}>Platformdaki faaliyetlerinizin özeti.</p>
        </div>
        <button onClick={() => navigate("/ilan-ver")} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          + İlan ver
        </button>
      </div>

      {/* İstatistikler */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 30 }}>
        {isNakliyeci ? (<>
          <StatCard icon="🚛" label="Tamamlanan sefer" value={totalTrips} sub="Kabul edilen teklif" />
          <StatCard icon="⚖️" label="Toplam taşınan" value={totalTon > 0 ? `${totalTon.toLocaleString("tr-TR")} ton` : "—"} sub="Kabul edilen işlerin toplamı" clr="var(--blue)" bg="var(--blue-bg)" />
          <StatCard icon="💰" label="Tahmini kazanç" value={totalEarnings > 0 ? `${totalEarnings.toLocaleString("tr-TR")} ₺` : "—"} sub="Fiyatlı teklifler toplamı" clr="var(--green)" bg="var(--green-bg)" />
          <StatCard icon="🚗" label="Aktif araç ilanı" value={activeVehicles} sub="Şu an yayında" clr="var(--amber)" bg="var(--amber-bg)" />
        </>) : (<>
          <StatCard icon="📋" label="Aktif ilan" value={activeListings} sub="Şu an yayında" />
          <StatCard icon="🤝" label="Eşleşen ilan" value={matchedListings} sub="Nakliyeci bulundu" clr="var(--green)" bg="var(--green-bg)" />
          <StatCard icon="📨" label="Bekleyen teklif" value={pendingOffers} sub="Yanıt bekleniyor" clr="var(--amber)" bg="var(--amber-bg)" />
          <StatCard icon="⚖️" label="Toplam iş hacmi" value={totalVolume > 0 ? `${totalVolume.toLocaleString("tr-TR")} ton` : "—"} sub="Eşleşen ilanlar toplamı" clr="var(--blue)" bg="var(--blue-bg)" />
        </>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 18 }} className="dashboard-grid">
        {/* İlanlarım özeti */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)" }}>{isNakliyeci ? "Araç ilanlarım" : "İlanlarım"}</h2>
            <button onClick={() => navigate("/ilanlarim")} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Tümü →</button>
          </div>
          {myListings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-ter)", fontSize: 13.5 }}>
              Henüz ilan yok.
              <br />
              <button onClick={() => navigate("/ilan-ver")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer", fontSize: "inherit", marginTop: 6 }}>İlk ilanı ver →</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myListings.slice(0, 5).map(l => {
                const cat = CATS.find(c => c.id === l.cat);
                const lOffers = offers.filter(o => String(o.listingId) === String(l.id));
                const statusStyle = l.status === "eslesti" ? { clr: "var(--green)", bg: "var(--green-bg)", lbl: "Eşleşti" }
                  : l.status === "kapali" ? { clr: "var(--text-ter)", bg: "var(--bg)", lbl: "Kapalı" }
                  : { clr: "var(--accent)", bg: "var(--accent-bg)", lbl: "Aktif" };
                return (
                  <div key={l.id} onClick={() => navigate(`/ilan/${l.id}`)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-light)", cursor: "pointer" }}>
                    <CategoryIcon catId={l.cat} size={18} fallback={cat?.icon} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-sec)" }}>{l.il} • {lOffers.length} teklif</div>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: statusStyle.clr, background: statusStyle.bg, padding: "2px 7px", borderRadius: 6, whiteSpace: "nowrap" }}>{statusStyle.lbl}</span>
                    {l.recurring && <span title="Düzenli iş" style={{ fontSize: 14 }}>🔁</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Son aktivite */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)" }}>Son aktivite</h2>
          </div>
          {activity.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-ter)", fontSize: 13.5 }}>
              Henüz aktivite yok.<br />İlan vererek veya teklif göndererek başlayın.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activity.map(a => (
                <div key={a.key} onClick={() => navigate(a.link)}
                  style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-light)", cursor: "pointer" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.4 }}>{a.text}</div>
                    {a.date && <div style={{ fontSize: 11, color: "var(--text-ter)", marginTop: 3 }}>{fmtDate(a.date)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hızlı eylemler */}
      <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {isNakliyeci ? (<>
          <button onClick={() => navigate("/ilanlar?type=is")} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", padding: "10px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>🔍 İş ilanlarına bak</button>
          <button onClick={() => navigate("/ilan-ver")} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", padding: "10px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>🚛 Araç ilanı ver</button>
        </>) : (<>
          <button onClick={() => navigate("/ilanlarim")} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", padding: "10px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>📋 Teklifleri yönet</button>
          <button onClick={() => navigate("/ilan-ver")} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", padding: "10px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>📢 Yeni ilan ver</button>
        </>)}
        <button onClick={() => navigate("/mesajlar")} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", padding: "10px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>💬 Mesajlar</button>
        <button onClick={() => navigate("/profil")} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", padding: "10px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>👤 Profil</button>
      </div>
    </div>
  );
}
