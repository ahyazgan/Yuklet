import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LISTINGS } from "../data/listings";
import { CATS } from "../data/categories";
import SEO from "../components/SEO";
import { buildEIrsaliye, buildEFatura, KDV_RATE } from "../utils/eDocs";
import { sendToGib, isEInvoiceConfigured } from "../lib/eInvoiceProvider";
import { fmtTL } from "../utils/payments";

// ── Dijital Taşıma Sözleşmesi / Sevk İrsaliyesi (yazdırılabilir).
//    Eşleşen iş (kabul edilen teklif) için taraflar/güzergah/bedel belgesi.

const belgeNo = (id) => "HMT-SZL-" + String(id).padStart(6, "0");
const today = () => { try { return new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }); } catch { return ""; } };

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-ham-muted">{label}</div>
      <div className="text-sm font-bold text-ham-ink font-mono">{value || "—"}</div>
    </div>
  );
}

export default function SozlesmePage({ listings = LISTINGS, offers = [], getContact }) {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const offer = offers.find((o) => String(o.id) === String(offerId));
  const l = offer ? listings.find((x) => String(x.id) === String(offer.listingId)) : null;

  // e-Belge gönderim durumu (mock: GİB onaylı simülasyonu)
  const [gib, setGib] = useState({}); // { irsaliye?: 'ONAYLI', fatura?: 'ONAYLI' }
  const [gibBusy, setGibBusy] = useState("");

  if (!offer || !l) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-16 text-center text-ham-ink">
        <div className="text-4xl">📄</div>
        <h1 className="text-xl font-bold text-ham-ink">Sözleşme bulunamadı</h1>
        <button onClick={() => navigate("/ilanlarim")} className="rounded-full bg-ham-yellow px-5 py-2.5 text-xs font-extrabold text-ham-ink">İlanlarım</button>
      </div>
    );
  }

  const cat = CATS.find((c) => c.id === l.cat);
  const owner = { name: l.owner, phone: getContact?.(l.ownerId)?.phone };
  const nak = { name: offer.fromUser, phone: getContact?.(offer.fromUserId)?.phone };
  const bedel = offer.price ? `₺${offer.price.toLocaleString("tr-TR")}` : "Teklif usulü (taraflar arası mutabık)";

  // ── e-Belgeler ──
  const irs = buildEIrsaliye(l, offer);
  const fat = buildEFatura(l, offer);
  const hasAmount = (l.paymentAmount || offer.price || 0) > 0;
  const sendDoc = async (which, doc) => {
    setGibBusy(which);
    try {
      const res = await sendToGib(doc);
      if (res.ok) setGib((g) => ({ ...g, [which]: "ONAYLI" }));
    } catch (e) {
      setGib((g) => ({ ...g, [which]: "HATA: " + (e?.message || "gönderilemedi") }));
    }
    setGibBusy("");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 text-ham-ink">
      <SEO title={`Sözleşme ${belgeNo(offer.id)}`} description="Dijital taşıma sözleşmesi / sevk irsaliyesi." />

      {/* Aksiyon barı (yazdırmada gizli) */}
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-ham-card text-ham-sub shadow-sm">←</button>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="rounded-full bg-ham-ink px-5 py-2.5 text-sm font-bold text-[#FAF9F6]">🖨️ Yazdır / PDF</button>
        </div>
      </div>

      {/* BELGE */}
      <div className="rounded-2xl border border-ham-border bg-ham-card p-7 shadow-sm print:rounded-none print:border-0 print:shadow-none">
        {/* Başlık */}
        <div className="flex items-start justify-between border-b border-ham-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ham-yellow text-lg font-black text-ham-ink">H</div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-ham-ink">HamTed</div>
              <div className="text-[9px] font-semibold tracking-[2px] text-ham-muted">YÜK & NAKLİYE</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold text-ham-ink">TAŞIMA SÖZLEŞMESİ</div>
            <div className="text-[11px] text-ham-sub">/ Sevk İrsaliyesi</div>
            <div className="mt-1 text-[11px] font-bold text-ham-sub font-mono">{belgeNo(offer.id)}</div>
            <div className="text-[11px] text-ham-sub font-mono">{today()}</div>
          </div>
        </div>

        {/* Taraflar */}
        <div className="grid grid-cols-2 gap-4 border-b border-ham-line py-5">
          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ham-ink">İş Sahibi (Yük)</div>
            <div className="text-base font-bold text-ham-ink">{owner.name}</div>
            {owner.phone && <div className="text-sm text-ham-sub font-mono">📞 {owner.phone}</div>}
          </div>
          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ham-sub">Nakliyeci (Taşıyıcı)</div>
            <div className="text-base font-bold text-ham-ink">{nak.name}</div>
            {nak.phone && <div className="text-sm text-ham-sub font-mono">📞 {nak.phone}</div>}
          </div>
        </div>

        {/* İş bilgileri */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-ham-line py-5 sm:grid-cols-3">
          <Field label="İlan No" value={"HMT-" + String(l.id).padStart(4, "0")} />
          <Field label="Kategori" value={cat?.name} />
          <Field label="Malzeme" value={l.material || cat?.name} />
          <Field label="Yükleme" value={`${l.il}${l.ilce ? " / " + l.ilce : ""}${l.yukleme ? " · " + l.yukleme : ""}`} />
          <Field label="Boşaltma" value={l.bosaltma || "Belirtilen saha"} />
          <Field label="Miktar" value={l.amount ? `${l.amount} ${l.unit || ""}` : "—"} />
          {l.vehicle && <Field label="Araç" value={l.vehicle} />}
          {l.capacity && <Field label="Kapasite" value={l.capacity} />}
          <Field label="Tarih" value={l.dateText} />
        </div>

        {/* Bedel */}
        <div className="flex items-center justify-between border-b border-ham-line py-5">
          <div className="text-xs font-extrabold uppercase tracking-wide text-ham-muted">Anlaşılan Bedel</div>
          <div className="text-2xl font-black tracking-tight text-ham-ink font-mono">{bedel}</div>
        </div>

        {/* Şartlar */}
        <div className="py-5">
          <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ham-muted">Genel Şartlar</div>
          <ol className="list-decimal space-y-1.5 pl-5 text-[12.5px] leading-relaxed text-ham-sub">
            <li>Taşıma; yukarıda belirtilen güzergah, malzeme ve miktar için yapılır.</li>
            <li>Araç, yetki belgeleri (ör. K belgesi) ve sigorta yükümlülükleri nakliyeciye aittir.</li>
            <li>Yükleme/boşaltma koşulları ve teslim süresi taraflarca teyit edilir.</li>
            <li>Ödeme, taraflar arasında belirlenen şekilde yapılır; HamTed yalnızca eşleştirme platformudur, taşıma sözleşmesinin tarafı değildir.</li>
            <li>Hafriyat taşımalarında döküm sahası ve ilgili belediye/çevre mevzuatına uyum yük sahibi ve nakliyecinin sorumluluğundadır.</li>
          </ol>
        </div>

        {/* İmza */}
        <div className="grid grid-cols-2 gap-6 pt-6">
          <div className="text-center">
            <div className="mb-1 h-16 rounded-lg border border-dashed border-ham-border"></div>
            <div className="text-xs font-bold text-ham-sub">İş Sahibi — {owner.name}</div>
            <div className="text-[10px] text-ham-muted">Kaşe / İmza</div>
          </div>
          <div className="text-center">
            <div className="mb-1 h-16 rounded-lg border border-dashed border-ham-border"></div>
            <div className="text-xs font-bold text-ham-sub">Nakliyeci — {nak.name}</div>
            <div className="text-[10px] text-ham-muted">Kaşe / İmza</div>
          </div>
        </div>

        <div className="mt-6 border-t border-ham-line pt-3 text-center text-[10px] text-ham-muted">
          Bu belge HamTed platformu üzerinden dijital olarak oluşturulmuştur · <span className="font-mono">{belgeNo(offer.id)}</span> · hamted.com.tr
        </div>
      </div>

      {/* ── RESMİ e-BELGELER (e-İrsaliye + e-Fatura) ── */}
      <div className="mt-6 space-y-4 print:hidden">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-extrabold tracking-tight text-ham-ink">Resmî e-Belgeler</h2>
          {!isEInvoiceConfigured && <span className="rounded-full bg-ham-stone px-2 py-0.5 text-[10px] font-bold text-ham-sub">DEMO</span>}
        </div>
        <p className="-mt-2 text-[12px] text-ham-sub">
          HamTed, yük yola çıkınca <b>e-İrsaliye</b>, iş bitince <b>e-Fatura</b> belgesini otomatik üretir ve (entegratör bağlanınca) GİB'e gönderir.
        </p>

        {/* e-İrsaliye */}
        <EDocCard
          doc={irs}
          status={gib.irsaliye}
          busy={gibBusy === "irsaliye"}
          onSend={() => sendDoc("irsaliye", irs)}
          rows={[
            ["Senaryo", irs.senaryo + " / " + irs.tip],
            ["ETTN", irs.ettn],
            ["Gönderen (yük)", irs.gonderen],
            ["Taşıyan", irs.tasiyan],
            ["Malzeme / GTİP", `${irs.malzeme}${irs.gtip ? " · " + irs.gtip : ""}`],
            ["Miktar", irs.miktar],
            ["Çıkış", irs.cikis],
            ["Varış", irs.varis],
            ["Araç", irs.arac],
          ]}
        />

        {/* e-Fatura */}
        {hasAmount && (
          <EDocCard
            doc={fat}
            status={gib.fatura}
            busy={gibBusy === "fatura"}
            onSend={() => sendDoc("fatura", fat)}
            rows={[
              ["Senaryo", fat.senaryo + " / " + fat.tip],
              ["ETTN", fat.ettn],
              ["Hizmeti veren", fat.saglayan],
              ["Hizmeti alan", fat.alan],
              ["Açıklama", fat.aciklama],
            ]}
            totals={[
              ["Matrah (hizmet bedeli)", fmtTL(fat.matrah)],
              [`KDV (%${Math.round(KDV_RATE * 100)})`, fmtTL(fat.kdv)],
              ["Genel toplam", fmtTL(fat.toplam), true],
              ["Platform komisyonu", "−" + fmtTL(fat.komisyon)],
              ["Nakliyeci net hakediş", fmtTL(fat.netNakliyeci)],
            ]}
          />
        )}
      </div>
    </div>
  );
}

// ── Tek e-belge kartı ──
function EDocCard({ doc, status, busy, onSend, rows = [], totals = [] }) {
  const onayli = status === "ONAYLI";
  const hata = typeof status === "string" && status.startsWith("HATA");
  return (
    <div className="rounded-2xl border border-ham-border bg-ham-card p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-ham-ink">{doc.title}</div>
          <div className="text-[11px] font-bold text-ham-sub font-mono">{doc.no}</div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${onayli ? "bg-ham-stone text-ham-green" : hata ? "bg-ham-stone text-ham-red" : "bg-ham-stone text-ham-ink"}`}>
          {onayli ? "✓ GİB onaylı" : hata ? "Hata" : "Taslak"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-ham-line py-1 text-[12px]">
            <span className="shrink-0 font-semibold text-ham-muted">{k}</span>
            <span className="text-right font-bold text-ham-ink font-mono">{v}</span>
          </div>
        ))}
      </div>

      {totals.length > 0 && (
        <div className="mt-3 space-y-1 rounded-xl bg-ham-stone p-3">
          {totals.map(([k, v, strong]) => (
            <div key={k} className={`flex justify-between text-[12px] ${strong ? "border-t border-ham-border pt-1.5 font-extrabold text-ham-ink" : "text-ham-sub"}`}>
              <span>{k}</span><span className="font-mono">{v}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {!onayli && (
          <button onClick={onSend} disabled={busy}
            className="rounded-full bg-ham-ink px-5 py-2.5 text-xs font-extrabold text-[#FAF9F6] transition hover:opacity-90 disabled:opacity-60">
            {busy ? "Gönderiliyor…" : "GİB'e gönder"}
          </button>
        )}
        {onayli && <span className="text-[12px] font-semibold text-ham-green">Belge GİB'e iletildi (demo). ETTN: <span className="font-mono">{doc.ettn}</span></span>}
        {hata && <span className="text-[12px] font-semibold text-ham-red">{status.replace("HATA: ", "")}</span>}
      </div>
    </div>
  );
}
