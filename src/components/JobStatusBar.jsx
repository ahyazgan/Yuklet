import { Check } from "lucide-react";
import { computeJobStage } from "../utils/jobStatus";

// ── SAHA iş durumu şeridi (kompakt).
//    İlan → Teklif → Anlaşma → Yüklendi → Yolda → Teslim → Tamam
//    Her iki taraf da (müteahhit + nakliyeci) aynı net durumu görür.

const INK = "#0A0A0A";
const YELLOW = "#FACC15";
const GREEN = "#16803C";
const MUTED = "#9A968D";
const LINE = "#E3DDD0";
const MONO = "'Space Mono', ui-monospace, monospace";

export default function JobStatusBar({ listing, offers = [], compact = false }) {
  const { index, stages } = computeJobStage(listing, offers);

  return (
    <div style={{ display: "flex", alignItems: "flex-start", width: "100%" }} aria-label="İş durumu">
      {stages.map((s, i) => {
        const done = i < index;
        const active = i === index;
        const last = i === stages.length - 1;
        const dotBg = done ? GREEN : active ? YELLOW : "#FFFFFF";
        const dotBorder = done ? GREEN : active ? YELLOW : LINE;
        const sz = compact ? 18 : 22;
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", flex: last ? "0 0 auto" : 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: sz, height: sz, borderRadius: 5, background: dotBg, border: `2px solid ${dotBorder}` }}>
                {done ? <Check size={compact ? 10 : 13} strokeWidth={3} color="#fff" />
                  : active ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: INK }} />
                  : <span style={{ width: 5, height: 5, borderRadius: "50%", background: MUTED }} />}
              </span>
              {!compact && (
                <span style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: done || active ? INK : MUTED, whiteSpace: "nowrap" }}>
                  {s.label}
                </span>
              )}
            </div>
            {!last && (
              <span style={{ flex: 1, height: 2, margin: "0 3px", marginBottom: compact ? 0 : 16, background: i < index ? GREEN : LINE, minWidth: 8 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
