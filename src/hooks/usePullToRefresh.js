import { useEffect, useRef, useState } from "react";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  Aşağı-çekip-yenile (pull-to-refresh) — dokunmatik cihazlar.        ║
// ║  Sayfa en üstteyken (scrollY<=0) aşağı çekince onRefresh tetikler.  ║
// ║  Döner: { pull (0-1 ilerleme), refreshing, distance(px) }.          ║
// ╚══════════════════════════════════════════════════════════════════╝

const THRESHOLD = 70;   // tetikleme eşiği (px)
const MAX = 110;        // görsel tavan (px)

export default function usePullToRefresh(onRefresh, { disabled = false } = {}) {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const active = useRef(false);
  // Listener'lar her parmak hareketinde yeniden bağlanmasın diye güncel
  // değerlere ref üzerinden erişilir (effect bağımlılığı sabit kalır).
  const distanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const setDist = (v) => { distanceRef.current = v; setDistance(v); };
  const setRefr = (v) => { refreshingRef.current = v; setRefreshing(v); };

  useEffect(() => {
    if (disabled || typeof window === "undefined" || !("ontouchstart" in window)) return;

    // Scroll artık body'de değil #app-scroll (main) konteynerinde — body scroll
    // kilitli (iOS overscroll düzeltmesi). "En üstte miyiz?" kontrolü o
    // konteynerin scrollTop'una bakmalı; window.scrollY hep 0 kalır.
    const atTop = () => {
      const el = document.getElementById("app-scroll");
      return el ? el.scrollTop <= 0 : window.scrollY <= 0;
    };

    const onStart = (e) => {
      if (refreshingRef.current) return;
      // Yalnızca en üstteyken ve tek parmakla başlat.
      if (atTop() && e.touches.length === 1) {
        startY.current = e.touches[0].clientY;
        active.current = true;
      } else {
        active.current = false;
      }
    };

    const onMove = (e) => {
      if (!active.current || startY.current == null || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && atTop()) {
        // Dirençli (lastik) his: karekök yumuşatma.
        const eased = Math.min(MAX, Math.sqrt(dy) * 9);
        setDist(eased);
      } else {
        setDist(0);
        active.current = false;
      }
    };

    const onEnd = async () => {
      if (!active.current) return;
      active.current = false;
      const reached = distanceRef.current >= THRESHOLD;
      if (reached && onRefresh) {
        setRefr(true);
        setDist(THRESHOLD);
        try { await onRefresh(); } catch { /* noop */ }
        // Kısa süre göster, sonra kapat.
        setTimeout(() => { setRefr(false); setDist(0); }, 400);
      } else {
        setDist(0);
      }
      startY.current = null;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [onRefresh, disabled]);

  return { distance, refreshing, pull: Math.min(1, distance / THRESHOLD) };
}
