import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { isSupabaseConfigured } from "../lib/supabase";
import { isAdmin } from "../utils/admin";

// ── Admin / moderasyon paneli — şikayetler, belge doğrulama, kullanıcılar.
//    Erişim: role==="admin" veya bilinen admin e-postası (utils/admin.js).

const fmt = (iso) => { try { return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

const TABS = [["reports", "Şikayetler"], ["docs", "Belgeler"], ["users", "Kullanıcılar"]];

export default function AdminPage({ user, reports = [], docs = [], users = [], listings = [], onRequireAuth, onSetReportStatus, onReviewDoc }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("reports");

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-12 text-center text-ham-ink">
        <SEO title="Yönetim" />
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-bold">Yönetim için giriş yapın</h1>
        <button onClick={() => onRequireAuth?.()} className="mt-2 rounded-full bg-ham-ink px-5 py-3 text-sm font-bold text-[#FAF9F6]">Giriş yap</button>
      </div>
    );
  }
  if (!isAdmin(user)) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-16 text-center text-ham-ink">
        <SEO title="Yönetim" />
        <div className="text-5xl">⛔</div>
        <h1 className="text-xl font-bold">Bu alana erişiminiz yok</h1>
        <p className="text-sm text-ham-sub">Yönetim paneli yalnızca platform yöneticilerine açıktır.</p>
        <button onClick={() => navigate("/")} className="mt-2 rounded-full bg-ham-yellow px-5 py-2.5 text-xs font-extrabold text-ham-ink">Ana sayfa</button>
      </div>
    );
  }

  const openReports = reports.filter((r) => r.status !== "kapali").length;
  const pendingDocs = docs.filter((d) => (d.status || "beklemede") === "beklemede").length;
  const titleOf = (id) => listings.find((l) => String(l.id) === String(id))?.title || ("#" + id);

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-4 pb-24 pt-2 text-ham-ink">
      <SEO title="Yönetim Paneli" description="HamTed moderasyon paneli." />
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-black tracking-tight">Yönetim</h1>
        <span className="rounded-full bg-ham-ink px-3 py-1 text-[11px] font-bold text-ham-yellow">admin</span>
      </div>

      {isSupabaseConfigured && (
        <div className="rounded-2xl bg-ham-stone px-4 py-3 text-[12px] font-semibold text-ham-sub">
          ⚠️ Supabase modunda moderasyon için servis-rolü (admin API) gerekir. Şu an yerel görünüm; tam yetki gerçek admin entegrasyonunda açılacak.
        </div>
      )}

      {/* Özet */}
      <div className="grid grid-cols-3 gap-2.5">
        {[["Açık şikayet", openReports], ["Bekleyen belge", pendingDocs], ["Kullanıcı", users.length || "—"]].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-ham-border bg-ham-card p-3.5 text-center shadow-sm">
            <div className="text-2xl font-extrabold font-mono">{v}</div>
            <div className="text-[11px] text-ham-sub">{k}</div>
          </div>
        ))}
      </div>

      {/* Sekmeler */}
      <div className="flex gap-1.5 rounded-2xl bg-ham-stone p-1">
        {TABS.map(([k, lbl]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${tab === k ? "bg-ham-card text-ham-ink shadow-sm" : "text-ham-sub"}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ŞİKAYETLER */}
      {tab === "reports" && (
        <div className="flex flex-col gap-2.5">
          {reports.length === 0 ? <Empty text="Şikayet yok." /> : reports.map((r) => (
            <div key={r.id} className="rounded-2xl border border-ham-border bg-ham-card p-4 shadow-sm">
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="font-bold">{r.reason}</div>
                <StatusBadge status={r.status} map={{ acik: ["Açık", "bg-ham-stone text-ham-red"], inceleniyor: ["İnceleniyor", "bg-ham-yellow text-ham-ink"], kapali: ["Kapalı", "bg-ham-stone text-ham-green"] }} />
              </div>
              <div className="text-[12px] text-ham-sub">
                {r.type === "user" ? "Kullanıcı" : "İlan"} hakkında · {r.fromName || "misafir"} · <span className="font-mono">{fmt(r.createdAt)}</span>
              </div>
              {r.description && <p className="mt-2 rounded-xl bg-ham-stone p-2.5 text-[13px]">{r.description}</p>}
              {r.listingId && <div className="mt-1 text-[12px] text-ham-muted">İlgili ilan: {titleOf(r.listingId)}</div>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => onSetReportStatus?.(r.id, "inceleniyor")} className="rounded-lg bg-ham-yellow px-3 py-1.5 text-[12px] font-bold text-ham-ink">İncelemeye al</button>
                <button onClick={() => onSetReportStatus?.(r.id, "kapali")} className="rounded-lg bg-ham-stone px-3 py-1.5 text-[12px] font-bold text-ham-green">Kapat</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BELGELER */}
      {tab === "docs" && (
        <div className="flex flex-col gap-2.5">
          {docs.length === 0 ? <Empty text="Yüklenmiş belge yok." /> : docs.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-ham-border bg-ham-card p-3.5 shadow-sm">
              {String(d.dataUrl || d.url).startsWith("data:image")
                ? <img src={d.dataUrl || d.url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ham-stone text-xl">📄</span>}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{d.type}</div>
                <div className="truncate text-[12px] text-ham-muted">{d.name}</div>
              </div>
              {(d.status || "beklemede") === "dogrulandi" ? (
                <span className="rounded-lg bg-ham-stone px-2.5 py-1 text-[11px] font-bold text-ham-green">✓ Onaylı</span>
              ) : (d.status === "red") ? (
                <span className="rounded-lg bg-ham-stone px-2.5 py-1 text-[11px] font-bold text-ham-red">Reddedildi</span>
              ) : (
                <div className="flex shrink-0 gap-1.5">
                  <button onClick={() => onReviewDoc?.(d.id, "dogrulandi")} className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-[#FAF9F6]" style={{ background: "#16803C" }}>Onayla</button>
                  <button onClick={() => onReviewDoc?.(d.id, "red")} className="rounded-lg bg-ham-stone px-3 py-1.5 text-[12px] font-bold text-ham-red">Reddet</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* KULLANICILAR */}
      {tab === "users" && (
        <div className="flex flex-col gap-2.5">
          {users.length === 0 ? <Empty text="Kullanıcı listesi bu modda görünmüyor." /> : users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-ham-border bg-ham-card p-3.5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ham-yellow font-extrabold text-ham-ink">{(u.name || "?").charAt(0).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{u.name}</div>
                <div className="truncate text-[12px] text-ham-muted">{u.email} · {u.role}</div>
              </div>
              <div className="flex shrink-0 gap-1">
                {u.verified && <span className="rounded-lg bg-ham-stone px-2 py-1 text-[10px] font-bold text-ham-green">✓ Onaylı</span>}
                {u.phoneVerified && <span className="rounded-lg bg-ham-stone px-2 py-1 text-[10px] font-bold text-ham-sub">📱</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, map }) {
  const [label, cls] = map[status] || map.acik;
  return <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${cls}`}>{label}</span>;
}
function Empty({ text }) {
  return <div className="rounded-2xl border border-ham-border bg-ham-card py-12 text-center text-sm text-ham-muted shadow-sm">{text}</div>;
}
