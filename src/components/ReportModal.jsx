import { useState } from "react";

// ── Şikayet / sorun bildir modalı.
const REASONS = ["Yanıltıcı / sahte ilan", "Dolandırıcılık şüphesi", "Uygunsuz içerik", "Ödeme / anlaşma sorunu", "İletişim kurulamıyor", "Diğer"];

export default function ReportModal({ targetLabel, onSubmit, onClose }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [desc, setDesc] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => { onSubmit?.({ reason, desc: desc.trim() }); setDone(true); };
  const FIELD = "w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 dark:bg-navy-soft dark:text-slate-100";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[420px] rounded-[26px] bg-white p-7 shadow-2xl dark:bg-navy-card" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">✓</div>
            <div className="text-lg font-bold text-slate-950 dark:text-slate-100">Bildirimin alındı</div>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Ekibimiz en kısa sürede inceleyecek. Teşekkürler.</p>
            <button onClick={onClose} className="mt-4 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white dark:bg-navy-soft dark:text-slate-100">Kapat</button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Sorun bildir</h2>
            {targetLabel && <p className="mb-4 mt-0.5 text-sm text-gray-500 dark:text-slate-400">{targetLabel}</p>}
            <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-slate-400">Sebep</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className={FIELD}>
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <label className="mb-1.5 mt-3 block text-xs font-semibold text-gray-500 dark:text-slate-400">Açıklama</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ne oldu? (opsiyonel)" className={`${FIELD} min-h-[80px] resize-y`} />
            <div className="mt-4 flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-slate-700 dark:border-navy-line dark:text-slate-200">Vazgeç</button>
              <button onClick={submit} className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-600">Bildir</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
