// ╔══════════════════════════════════════════════════════════════════╗
// ║  İş yaşam döngüsü — TEK KAYNAK.                                     ║
// ║  İlan → Anlaşma → Yüklendi → Yolda → Teslim → Tamam                ║
// ║  Sabit fiyat + doğrudan kabul modeli: TEKLİF ADIMI YOK — nakliyeci ║
// ║  işi ilandaki fiyattan kabul eder, kabul = anlaşma.                ║
// ║  Hem JobStatusBar (kompakt şerit) hem de listeler bunu kullanır.   ║
// ║  TakipPage'in kendi detaylı faz akışı (PHASES) korunur; bu üst     ║
// ║  seviye, her iki tarafın da gördüğü özet durumdur.                 ║
// ╚══════════════════════════════════════════════════════════════════╝

export const JOB_STAGES = [
  { key: "ilan", label: "İlan" },
  { key: "kabul", label: "Anlaşma" },
  { key: "yuklendi", label: "Yüklendi" },
  { key: "yolda", label: "Yolda" },
  { key: "teslim", label: "Teslim" },
  { key: "tamam", label: "Tamam" },
];

// TakipPage faz sırası ile aynı: eslesti → yuklendi → yolda → teslim.
const PHASE_ORDER = ["eslesti", "yuklendi", "yolda", "teslim"];

// listing + ilgili kabul kayıtları → { index, stages, current }
export function computeJobStage(listing, offers = []) {
  if (!listing) return { index: 0, stages: JOB_STAGES, current: JOB_STAGES[0] };
  const mine = offers.filter((o) => String(o.listingId) === String(listing.id));
  const accepted = mine.find((o) => o.status === "kabul");
  const phase = listing.phase || null;
  const pIdx = PHASE_ORDER.indexOf(phase);
  const proof = listing.deliveryProof || null;
  const closed = listing.status === "kapali";

  let idx = 0;                                            // İlan açıldı
  if (accepted || listing.status === "eslesti" || phase) idx = 1; // Anlaşma (doğrudan kabul)
  if (pIdx >= 1) idx = 2;                                 // Yüklendi
  if (pIdx >= 2) idx = 3;                                 // Yolda
  if (proof || pIdx >= 3) idx = 4;                        // Teslim (kanıt/teslim fazı)
  if (closed && (proof?.status === "onay" || pIdx >= 3)) idx = 5; // Tamamlandı

  return { index: idx, stages: JOB_STAGES, current: JOB_STAGES[idx] };
}
