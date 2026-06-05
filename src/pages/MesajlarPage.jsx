import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";

// ── MoveIQ LIGHT mesajlar (Tailwind).

function fmtTime(iso) {
  try { return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function MesajlarPage({ user, listings = [], offers = [], messages = [], onSendMessage, onRequireAuth, onSeen, getContact }) {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState(null);
  const [text, setText] = useState("");

  useEffect(() => { onSeen?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-3 px-4 pt-12 text-center text-slate-900 dark:text-slate-100">
        <SEO title="Mesajlar" />
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-slate-100">Mesajlar için giriş yapın</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Kabul edilen tekliflerde karşı tarafla buradan mesajlaşırsınız.</p>
        <button onClick={() => onRequireAuth?.()} className="mt-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white dark:bg-navy-soft dark:text-slate-100">Giriş yap / Kayıt ol</button>
      </div>
    );
  }

  const conversations = offers
    .filter((o) => o.status === "kabul")
    .map((o) => {
      const l = listings.find((x) => String(x.id) === String(o.listingId));
      if (!l) return null;
      const ownerSide = { id: l.ownerId, name: l.owner };
      const offerSide = { id: o.fromUserId, name: o.fromUser };
      if (user.id !== ownerSide.id && user.id !== offerSide.id) return null;
      const other = user.id === ownerSide.id ? offerSide : ownerSide;
      return { key: `${o.listingId}:${o.id}`, listingId: l.id, offerId: o.id, listingTitle: l.title, other };
    })
    .filter(Boolean);

  const active = conversations.find((c) => c.key === selectedKey) || null;
  const otherPhone = active && getContact ? getContact(active.other.id)?.phone : null;

  const threadMessages = active
    ? messages
        .filter((m) => String(m.listingId) === String(active.listingId) && String(m.offerId) === String(active.offerId))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [];

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    onSendMessage?.({
      id: Date.now(), listingId: active.listingId, offerId: active.offerId,
      fromId: user.id, fromName: user.name, toId: active.other.id, toName: active.other.name,
      text: text.trim(), createdAt: new Date().toISOString(),
    });
    setText("");
  };

  // ── Aktif sohbet ──
  if (active) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col px-4 pb-24 pt-2 text-slate-900 dark:text-slate-100">
        <SEO title="Mesajlar" />
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-navy-line pb-3">
          <button onClick={() => setSelectedKey(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-navy-card text-slate-700 dark:text-slate-100 shadow-sm">←</button>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-slate-950 dark:text-slate-100">{active.other.name}</div>
            <button onClick={() => navigate(`/ilan/${active.listingId}`)} className="truncate text-xs font-semibold text-amber-600">{active.listingTitle} ›</button>
          </div>
          {otherPhone && <a href={`tel:${otherPhone}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">📞</a>}
        </div>

        <div className="flex min-h-[45vh] flex-col gap-2.5 py-4">
          {threadMessages.length === 0 ? (
            <div className="m-auto text-sm text-gray-400 dark:text-navy-muted">İlk mesajı yazın.</div>
          ) : (
            threadMessages.map((m) => {
              const mine = m.fromId === user.id;
              return (
                <div key={m.id} className={`max-w-[78%] ${mine ? "self-end" : "self-start"}`}>
                  <div className={`px-3.5 py-2.5 text-sm leading-snug ${mine ? "rounded-2xl rounded-br-sm bg-slate-950 text-white dark:bg-navy-soft dark:text-slate-100" : "rounded-2xl rounded-bl-sm bg-white dark:bg-navy-card text-slate-900 dark:text-slate-100 shadow-sm"}`}>{m.text}</div>
                  <div className={`mt-1 text-[10.5px] text-gray-400 dark:text-navy-muted ${mine ? "text-right" : "text-left"}`}>{fmtTime(m.createdAt)}</div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={send} className="sticky bottom-2 flex items-center gap-2 rounded-2xl bg-white dark:bg-navy-card p-1.5 pl-4 shadow-md">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mesaj yazın…" aria-label="Mesaj" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-gray-400 dark:placeholder:text-navy-muted" />
          <button type="submit" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white dark:bg-navy-soft dark:text-slate-100">Gönder</button>
        </form>
      </div>
    );
  }

  // ── Konusma listesi ──
  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-4 px-4 pb-24 pt-2 text-slate-900 dark:text-slate-100">
      <SEO title="Mesajlar" description="Eşleşen ilanlar üzerinden karşı tarafla mesajlaşın." />
      <h1 className="pt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">Mesajlar</h1>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-white dark:bg-navy-card py-14 text-center shadow-sm">
          <div className="text-4xl">💬</div>
          <div className="text-base font-bold text-slate-950 dark:text-slate-100">Henüz mesajlaşma yok</div>
          <div className="text-sm text-gray-500 dark:text-slate-400">Bir teklif kabul edildiğinde konuşma burada açılır.</div>
          <button onClick={() => navigate("/ilanlar")} className="mt-3 rounded-full bg-yellow-400 px-5 py-2.5 text-xs font-extrabold text-slate-950">İlanlara göz at</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {conversations.map((c) => (
            <button key={c.key} onClick={() => setSelectedKey(c.key)} className="flex w-full items-center gap-3.5 rounded-3xl bg-white dark:bg-navy-card p-4 text-left shadow-sm transition hover:-translate-y-0.5">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-lg font-extrabold text-amber-700">
                {c.other.name?.[0]?.toUpperCase() || "?"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-950 dark:text-slate-100">{c.other.name}</span>
                <span className="block truncate text-xs text-gray-500 dark:text-slate-400">{c.listingTitle}</span>
              </span>
              <span className="text-2xl text-gray-300 dark:text-slate-600">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
