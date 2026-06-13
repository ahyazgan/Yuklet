// ── Yıldız: gösterim + giriş (puanlama).

export function StarsDisplay({ value = 0, count, className = "text-sm" }) {
  const full = Math.round(value || 0);
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="text-amber-500 tracking-tight">{"★".repeat(full)}{"☆".repeat(Math.max(0, 5 - full))}</span>
      {value ? <span className="font-bold text-slate-700 dark:text-slate-200">{Number(value).toFixed(1)}</span> : null}
      {count != null && <span className="text-gray-400 dark:text-slate-500">({count})</span>}
    </span>
  );
}

export function StarsInput({ value = 0, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} onClick={() => onChange(n)} aria-label={`${n} yıldız`}
          className={`text-3xl leading-none transition ${n <= value ? "text-amber-500" : "text-gray-300 dark:text-navy-line"}`}>★</button>
      ))}
    </div>
  );
}
