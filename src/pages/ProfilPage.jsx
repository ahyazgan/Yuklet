import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "../components/Toast";
import { StarsDisplay } from "../components/Stars";
import SEO from "../components/SEO";

function fmtRev(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return ""; }
}

// ── MoveIQ LIGHT profil (Tailwind).

const ROLES = [
  { id: "isveren", label: "İş veren", desc: "İş ilanı açar, teklif alır" },
  { id: "tedarikci", label: "Tedarikçi", desc: "Araç ilanı / teklif verir" },
];

const QUICK = [
  { icon: "📋", label: "İlanlarım", desc: "Açtığın ilanlar ve gelen teklifler", to: "/ilanlarim" },
  { icon: "💰", label: "Cüzdan", desc: "Kazanç, hakediş ve harcama", to: "/cuzdan" },
  { icon: "📊", label: "Panelim", desc: "Özet ve iş akışı", to: "/panel" },
];

const LBL = "mb-1.5 block text-xs font-semibold text-gray-500 dark:text-slate-400";
const FIELD = "w-full rounded-2xl bg-slate-50 dark:bg-navy-soft px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-slate-300";

const DOC_TYPES = ["K Belgesi", "Araç Ruhsatı", "Vergi Levhası", "Sigorta Poliçesi", "Diğer"];

export default function ProfilPage({ user, onUpdateProfile, onRequireAuth, reviews = [], getUserRating, docs = [], onAddDoc, onRemoveDoc }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [docType, setDocType] = useState("K Belgesi");

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
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    role: user?.role || "isveren",
  });

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-12 text-center text-slate-900 dark:text-slate-100">
        <SEO title="Profil" />
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-slate-100">Profil için giriş yapın</h1>
        <button onClick={() => onRequireAuth?.()} className="mt-2 rounded-full bg-slate-950 dark:bg-navy-soft px-5 py-3 text-sm font-bold text-white dark:text-slate-100">Giriş yap / Kayıt ol</button>
      </div>
    );
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast("Ad / firma zorunludur", "error"); return; }
    onUpdateProfile?.({ name: form.name.trim(), phone: form.phone.trim(), role: form.role });
    toast("Profil güncellendi", "success");
  };

  const rating = getUserRating?.(user.id);
  const myReviews = reviews.filter((r) => String(r.toId) === String(user.id)).slice(0, 8);

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-4 px-4 pb-24 pt-2 text-slate-900 dark:text-slate-100">
      <SEO title="Profil" description="Hesap bilgilerinizi görüntüleyin ve güncelleyin." />
      <h1 className="pt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">Profilim</h1>

      {/* Ozet kart */}
      <div className="flex items-center gap-3.5 rounded-3xl bg-white dark:bg-navy-card p-5 shadow-sm">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl font-extrabold text-amber-700">
          {(user.name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-extrabold text-slate-950 dark:text-slate-100">{user.name}</div>
          <div className="truncate text-xs text-gray-500 dark:text-slate-400">{user.email}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-amber-600">★ {(rating ? rating.avg : (user.rating ?? 5.0)).toFixed(1)}{rating?.count ? ` (${rating.count})` : ""}</div>
          <div className={`text-[11px] font-bold ${user.verified ? "text-emerald-600" : "text-gray-400 dark:text-navy-muted"}`}>{user.verified ? "✓ Onaylı" : "Onaysız"}</div>
        </div>
      </div>

      {/* Aldigin degerlendirmeler */}
      {(rating || myReviews.length > 0) && (
        <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-navy-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">Aldığın değerlendirmeler</h2>
            {rating && <StarsDisplay value={rating.avg} count={rating.count} className="text-sm" />}
          </div>
          {myReviews.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">Henüz değerlendirme yok. İş tamamladıkça puanların burada birikir.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {myReviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-gray-100 p-3.5 dark:border-navy-line">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.fromName}</span>
                    <StarsDisplay value={r.rating} className="text-xs" />
                  </div>
                  {r.comment && <p className="text-sm text-gray-500 dark:text-slate-400">{r.comment}</p>}
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">{fmtRev(r.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Belgelerim */}
      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-navy-card">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">Belgelerim</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${user.verified ? "bg-emerald-100 text-emerald-700" : docs.length ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
            {user.verified ? "✓ Doğrulandı" : docs.length ? "İnceleniyor" : "Eksik"}
          </span>
        </div>
        <p className="mb-3 text-xs text-gray-500 dark:text-slate-400">K belgesi, araç ruhsatı, vergi levhası yükle → <b>doğrulanmış rozeti</b> kazan. (İnceleme yakında otomatikleşecek.)</p>
        <div className="flex gap-2">
          <select value={docType} onChange={(e) => setDocType(e.target.value)} className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none dark:bg-navy-soft dark:text-slate-100">
            {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <label className="flex-1 cursor-pointer rounded-xl bg-slate-950 px-4 py-2.5 text-center text-xs font-bold text-white dark:bg-navy-soft dark:text-slate-100">
            + Belge yükle
            <input type="file" accept="image/*,application/pdf" onChange={onFile} className="hidden" />
          </label>
        </div>
        {docs.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-2.5 dark:border-navy-line">
                {String(d.dataUrl).startsWith("data:image")
                  ? <img src={d.dataUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
                  : <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg dark:bg-navy-soft">📄</span>}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{d.type}</div>
                  <div className="truncate text-[11px] text-gray-400">{d.name}</div>
                </div>
                <button onClick={() => onRemoveDoc?.(d.id)} className="text-xs font-bold text-red-600">Sil</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Hizli erisim */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">Hızlı erişim</h2>
        {QUICK.map((q) => (
          <button key={q.to} onClick={() => navigate(q.to)} className="flex w-full items-center gap-3.5 rounded-3xl bg-white dark:bg-navy-card p-4 text-left shadow-sm transition hover:-translate-y-0.5">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl">{q.icon}</span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-950 dark:text-slate-100">{q.label}</span>
              <span className="block text-xs text-gray-500 dark:text-slate-400">{q.desc}</span>
            </span>
            <span className="ml-auto text-2xl text-gray-300 dark:text-slate-600">›</span>
          </button>
        ))}
      </section>

      {/* Duzenleme formu */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">Hesap bilgileri</h2>
        <motion.form onSubmit={save} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 rounded-3xl bg-white dark:bg-navy-card p-5 shadow-sm">
          <div>
            <label className={LBL}>Ad / Firma</label>
            <input className={FIELD} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Yıldızlar İnşaat" />
          </div>
          <div>
            <label className={LBL}>E-posta</label>
            <input className={`${FIELD} cursor-not-allowed opacity-60`} value={user.email} disabled />
          </div>
          <div>
            <label className={LBL}>Telefon</label>
            <input className={FIELD} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="05XX XXX XX XX" />
            <div className="mt-1.5 text-[11px] text-gray-400 dark:text-navy-muted">Eşleşen tarafla iletişim için paylaşılır.</div>
          </div>
          <div>
            <label className={LBL}>Rol</label>
            <div className="flex flex-col gap-2">
              {ROLES.map((r) => (
                <button type="button" key={r.id} onClick={() => set("role", r.id)}
                  className={`rounded-2xl border p-3.5 text-left transition ${form.role === r.id ? "border-yellow-400 bg-yellow-50" : "border-gray-200 dark:border-navy-line bg-slate-50 dark:bg-navy-soft"}`}>
                  <div className={`text-sm font-bold ${form.role === r.id ? "text-amber-700" : "text-slate-900 dark:text-slate-100"}`}>{r.label}</div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full rounded-2xl bg-yellow-400 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-yellow-500">Değişiklikleri kaydet</button>
        </motion.form>
      </section>
    </div>
  );
}
