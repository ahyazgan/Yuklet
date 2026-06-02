import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CATS } from "../data/categories";
import CategoryIcon from "../components/CategoryIcon";
import { useToast } from "../components/Toast";

const STATUS_STYLE = {
  beklemede: { label: "Beklemede", clr: "var(--amber)", bg: "var(--amber-bg)" },
  kabul: { label: "Kabul edildi", clr: "var(--green)", bg: "var(--green-bg)" },
  ret: { label: "Reddedildi", clr: "var(--red)", bg: "var(--accent-bg)" },
};

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function IlanlarimPage({ listings = [], user, offers = [], onUpdateOffer, onUpdateListing, onRequireAuth }) {
  const navigate = useNavigate();
  const toast = useToast();

  if (!user) {
    return (
      <div className="page-content" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", paddingTop: 48 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Ilanlarinizi gormek icin giris yapin</h1>
        <p style={{ fontSize: 14.5, color: "var(--text-sec)", marginBottom: 24 }}>Actiginiz ilanlari ve gelen teklifleri burada yonetebilirsiniz.</p>
        <button onClick={() => onRequireAuth?.()} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "13px 24px", borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Giris yap / Kayit ol</button>
      </div>
    );
  }

  const myListings = listings.filter(l => l.ownerId && l.ownerId === user.id);

  const accept = (listing, offer) => {
    onUpdateOffer?.(offer.id, { status: "kabul" });
    onUpdateListing?.(listing.id, { status: "eslesti" });
    toast("Teklif kabul edildi, ilan eslesti", "success");
  };
  const reject = (offer) => {
    onUpdateOffer?.(offer.id, { status: "ret" });
    toast("Teklif reddedildi", "info");
  };

  return (
    <div className="page-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)" }}>Ilanlarim</h1>
          <p style={{ fontSize: 14, color: "var(--text-sec)", marginTop: 2 }}>{myListings.length} ilan · gelen teklifleri yonetin</p>
        </div>
        <button onClick={() => navigate("/ilan-ver")} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>+ Ilan ver</button>
      </div>

      {myListings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-ter)" }}>
          Henuz ilaniniz yok. <button onClick={() => navigate("/ilan-ver")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer", fontSize: "inherit" }}>Ilk ilani verin</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {myListings.map(l => {
            const cat = CATS.find(c => c.id === l.cat);
            const lOffers = offers.filter(o => String(o.listingId) === String(l.id));
            const matched = l.status === "eslesti";
            return (
              <motion.div key={l.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, boxShadow: "var(--shadow)" }}>
                {/* Ilan basligi */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, cursor: "pointer" }} onClick={() => navigate(`/ilan/${l.id}`)}>
                  <CategoryIcon catId={l.cat} size={22} fallback={cat?.icon} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", flex: 1 }}>{l.title}</h3>
                  {matched && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", background: "var(--green-bg)", padding: "3px 8px", borderRadius: 6 }}>✓ Eslesti</span>}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-sec)", marginBottom: 14 }}>📍 {l.il} / {l.ilce} • {l.amount} {l.unit} • {lOffers.length} teklif</div>

                {/* Teklifler */}
                {lOffers.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--text-ter)", borderTop: "1px solid var(--border-light)", paddingTop: 12 }}>Bu ilana henuz teklif gelmedi.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--border-light)", paddingTop: 12 }}>
                    {lOffers.map(o => {
                      const s = STATUS_STYLE[o.status] || STATUS_STYLE.beklemede;
                      return (
                        <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", border: "1px solid var(--border-light)", borderRadius: 10, padding: 12 }}>
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{o.fromUser}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: s.clr, background: s.bg, padding: "2px 7px", borderRadius: 6 }}>{s.label}</span>
                            </div>
                            <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 3 }}>{o.message || "—"}</div>
                            <div style={{ fontSize: 11.5, color: "var(--text-ter)", marginTop: 3 }}>{fmtDate(o.createdAt)}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {o.price != null && <span style={{ fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>{o.price.toLocaleString("tr-TR")} ₺</span>}
                            {o.status === "beklemede" && !matched && (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => accept(l, o)} style={{ background: "var(--green)", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Kabul et</button>
                                <button onClick={() => reject(o)} style={{ background: "transparent", color: "var(--red)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Reddet</button>
                              </div>
                            )}
                            {o.status === "kabul" && (
                              <button onClick={() => navigate("/mesajlar")} style={{ background: "var(--blue)", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Mesaj gonder</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
