import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "../components/Toast";
import SEO from "../components/SEO";

// ── MoveIQ LIGHT profil (Tailwind).

const ROLES = [
  { id: "isveren", label: "İş veren", desc: "İş ilanı açar, teklif alır" },
  { id: "tedarikci", label: "Tedarikçi", desc: "Araç ilanı / teklif verir" },
];

const QUICK = [
  { icon: "📋", label: "İlanlarım", desc: "Açtığın ilanlar ve gelen teklifler", to: "/ilanlarim" },
  { icon: "📊", label: "Panelim", desc: "Özet ve iş akışı", to: "/panel" },
];

const LBL = "mb-1.5 block text-xs font-semibold text-gray-500";
const FIELD = "w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-300";

export default function ProfilPage({ user, onUpdateProfile, onRequireAuth }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    role: user?.role || "isveren",
  });

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-12 text-center text-slate-900">
        <SEO title="Profil" />
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-bold text-slate-950">Profil için giriş yapın</h1>
        <button onClick={() => onRequireAuth?.()} className="mt-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">Giriş yap / Kayıt ol</button>
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

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-4 px-4 pb-24 pt-2 text-slate-900">
      <SEO title="Profil" description="Hesap bilgilerinizi görüntüleyin ve güncelleyin." />
      <h1 className="pt-2 text-2xl font-black tracking-tight text-slate-950">Profilim</h1>

      {/* Ozet kart */}
      <div className="flex items-center gap-3.5 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl font-extrabold text-amber-700">
          {(user.name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-extrabold text-slate-950">{user.name}</div>
          <div className="truncate text-xs text-gray-500">{user.email}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-amber-600">★ {user.rating ?? 5.0}</div>
          <div className={`text-[11px] font-bold ${user.verified ? "text-emerald-600" : "text-gray-400"}`}>{user.verified ? "✓ Onaylı" : "Onaysız"}</div>
        </div>
      </div>

      {/* Hizli erisim */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-slate-950">Hızlı erişim</h2>
        {QUICK.map((q) => (
          <button key={q.to} onClick={() => navigate(q.to)} className="flex w-full items-center gap-3.5 rounded-3xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl">{q.icon}</span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-950">{q.label}</span>
              <span className="block text-xs text-gray-500">{q.desc}</span>
            </span>
            <span className="ml-auto text-2xl text-gray-300">›</span>
          </button>
        ))}
      </section>

      {/* Duzenleme formu */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-slate-950">Hesap bilgileri</h2>
        <motion.form onSubmit={save} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm">
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
            <div className="mt-1.5 text-[11px] text-gray-400">Eşleşen tarafla iletişim için paylaşılır.</div>
          </div>
          <div>
            <label className={LBL}>Rol</label>
            <div className="flex flex-col gap-2">
              {ROLES.map((r) => (
                <button type="button" key={r.id} onClick={() => set("role", r.id)}
                  className={`rounded-2xl border p-3.5 text-left transition ${form.role === r.id ? "border-yellow-400 bg-yellow-50" : "border-gray-200 bg-slate-50"}`}>
                  <div className={`text-sm font-bold ${form.role === r.id ? "text-amber-700" : "text-slate-900"}`}>{r.label}</div>
                  <div className="mt-0.5 text-xs text-gray-500">{r.desc}</div>
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
