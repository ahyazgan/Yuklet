import { useState, useEffect } from "react";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  "Uygulamayı yükle" çubuğu (PWA). beforeinstallprompt'u yakalar,   ║
// ║  kullanıcı kabul/ret edebilir. Kurulu (standalone) ise gösterilmez.║
// ╚══════════════════════════════════════════════════════════════════╝

const DISMISS_KEY = "hamted_pwa_dismissed";

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onPrompt = (e) => {
      e.preventDefault();          // tarayıcının kendi mini-barını engelle
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Kurulum tamamlanınca çubuğu kaldır.
    const onInstalled = () => { setShow(false); setDeferred(null); };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* ignore */ }
    setShow(false);
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:left-auto sm:right-4 sm:max-w-sm print:hidden">
      <div className="flex items-center gap-3 rounded-2xl border border-ham-border bg-ham-card p-3.5 shadow-xl">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ham-ink text-xl font-black text-ham-yellow">H</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-ham-ink">HamTed'i yükle</div>
          <div className="text-[12px] text-ham-sub">Telefonuna ekle — daha hızlı, çevrimdışı çalışır.</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={dismiss} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-ham-muted transition hover:bg-ham-stone">✕</button>
          <button onClick={install} className="rounded-xl bg-ham-yellow px-4 py-2 text-xs font-extrabold text-ham-ink transition hover:bg-ham-yellowDeep">Yükle</button>
        </div>
      </div>
    </div>
  );
}
