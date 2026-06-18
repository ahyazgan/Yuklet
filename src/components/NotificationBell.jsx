import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { pushSupported, pushPermission, requestPushPermission } from "../utils/push";

// ── Bildirim çanı + dropdown (SAHA). user yokken render edilmez.
export default function NotificationBell({ items = [], unread = 0, onOpen }) {
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState(() => pushPermission());
  const ref = useRef(null);
  const navigate = useNavigate();

  const askPush = async () => { setPerm(await requestPushPermission()); };

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = () => { const n = !open; setOpen(n); if (n) onOpen?.(); };
  const go = (link) => { setOpen(false); navigate(link); };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} aria-label="Bildirimler" className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-ham-border text-ham-sub transition hover:bg-ham-stone">
        🔔
        {unread > 0 && <span className="absolute -right-1 -top-1 flex min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-extrabold text-white" style={{ background: "#DC2626" }}>{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[60] mt-2 w-80 max-w-[88vw] overflow-hidden rounded-2xl border border-ham-border bg-ham-card shadow-xl">
          <div className="flex items-center justify-between border-b border-ham-line px-4 py-3">
            <span className="text-sm font-bold text-ham-ink">Bildirimler</span>
            {unread > 0 && <span className="rounded-full bg-ham-yellow px-2 py-0.5 text-[10px] font-extrabold text-ham-ink">{unread} yeni</span>}
          </div>

          {/* Anlık bildirim izni — henüz verilmediyse aç teklifi */}
          {pushSupported && perm === "default" && (
            <button onClick={askPush}
              className="flex w-full items-center gap-2 border-b border-ham-line bg-ham-stone px-4 py-2.5 text-left text-[12px] font-semibold text-ham-ink transition hover:bg-ham-bg">
              <span>🔔</span>
              <span>Anlık bildirimleri aç — teklif ve mesajları kaçırma</span>
            </button>
          )}
          {pushSupported && perm === "denied" && (
            <div className="border-b border-ham-line px-4 py-2.5 text-[11px] text-ham-muted">
              Bildirimler engelli. Tarayıcı ayarlarından bu site için izin verebilirsin.
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-ham-muted">Henüz bildirim yok.</div>
            ) : (
              items.map((n) => (
                <button key={n.id} onClick={() => go(n.link)}
                  className={`flex w-full items-start gap-3 border-b border-ham-line px-4 py-3 text-left transition hover:bg-ham-stone ${!n.read ? "bg-ham-stone" : ""}`}>
                  <span className="text-lg">{n.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] leading-snug text-ham-ink">{n.text}</span>
                    <span className="mt-0.5 block text-[11px] text-ham-muted">{n.fmtTime}</span>
                  </span>
                  {!n.read && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-ham-yellow" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
