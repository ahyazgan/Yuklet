import { useState } from "react";

// ── Şikayet / sorun bildir modalı. SAHA paleti (ham.* token).
const REASONS = ["Yanıltıcı / sahte ilan", "Dolandırıcılık şüphesi", "Uygunsuz içerik", "Ödeme / anlaşma sorunu", "İletişim kurulamıyor", "Diğer"];

export default function ReportModal({ targetLabel, onSubmit, onClose }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [desc, setDesc] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => { onSubmit?.({ reason, desc: desc.trim() }); setDone(true); };
  const FIELD = "w-full rounded-2xl border border-ham-border bg-ham-stone px-4 py-3 text-sm text-ham-ink outline-none focus:ring-2 focus:ring-ham-yellow";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ham-ink/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[420px] rounded-[26px] border border-ham-border bg-ham-card p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white" style={{ background: "#16803C" }}>✓</div>
            <div className="text-lg font-bold text-ham-ink">Bildirimin alındı</div>
            <p className="mt-1 text-sm text-ham-sub">Ekibimiz en kısa sürede inceleyecek. Teşekkürler.</p>
            <button onClick={onClose} className="mt-4 rounded-full bg-ham-ink px-5 py-2.5 text-sm font-bold text-white">Kapat</button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-extrabold tracking-tight text-ham-ink">Sorun bildir</h2>
            {targetLabel && <p className="mb-4 mt-0.5 text-sm text-ham-sub">{targetLabel}</p>}
            <label className="mb-1.5 block text-xs font-semibold text-ham-sub">Sebep</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className={FIELD}>
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <label className="mb-1.5 mt-3 block text-xs font-semibold text-ham-sub">Açıklama</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ne oldu? (opsiyonel)" className={`${FIELD} min-h-[80px] resize-y`} />
            <div className="mt-4 flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-2xl border border-ham-border bg-ham-stone py-3 text-sm font-bold text-ham-sub">Vazgeç</button>
              <button onClick={submit} className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition hover:opacity-90" style={{ background: "#DC2626" }}>Bildir</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
