import { useRef, useEffect } from "react";

// ── Parmakla imza alanı (canvas) — teslim kanıtı için.
// Çizim bitince onChange(dataUrl) çağrılır; "Temizle" sıfırlar.

const INK = "#0A0A0A";

export default function SignaturePad({ onChange, height = 150 }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const hasInkRef = useRef(false);       // end()'te güncel değeri okumak için (state gecikir)

  // Canvas'ı kapsayıcı genişliğine göre ölçekle (retina net) + resize/rotate'te
  // yeniden ölçekle. Aksi halde döndürünce backing-store eski genişlikte kalır ve
  // çizim koordinatları kayar. Mevcut çizimi koruyarak yeniden boyutlandır.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const setup = () => {
      const ratio = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      // Önce mevcut çizimi sakla (boyut değişince canvas temizlenir).
      let prev = null;
      if (canvas.width && canvas.height && hasInkRef.current) {
        try { prev = canvas.toDataURL("image/png"); } catch { /* noop */ }
      }
      canvas.width = w * ratio;
      canvas.height = height * ratio;
      const ctx = canvas.getContext("2d");
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = INK;
      if (prev) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, w, height); img.src = prev; }
    };
    setup();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(setup); ro.observe(canvas); }
    window.addEventListener("orientationchange", setup);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("orientationchange", setup); };
  }, [height]);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; last.current = pos(e); };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p;
    if (!hasInkRef.current) hasInkRef.current = true;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    // hasInkRef (state değil) — tek hızlı vuruşta state henüz güncellenmemiş olur,
    // aksi halde imza çizili görünür ama onChange hiç tetiklenmezdi.
    if (hasInkRef.current) onChange?.(canvasRef.current.toDataURL("image/png"));
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    hasInkRef.current = false;
    onChange?.(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height, background: "#fff", border: `2px solid ${INK}`, borderRadius: 6, touchAction: "none", display: "block" }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <button type="button" onClick={clear} style={{ marginTop: 6, background: "transparent", border: "none", color: "#9A968D", fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, textTransform: "uppercase", cursor: "pointer", padding: 0 }}>
        Temizle
      </button>
    </div>
  );
}
