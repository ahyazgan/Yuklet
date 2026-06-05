import { Link } from "react-router-dom";

// ── MoveIQ LIGHT footer (Tailwind).

const COLS = [
  { title: "Platform", links: [["Tüm İlanlar", "/ilanlar"], ["İlan Ver", "/ilan-ver"], ["Nasıl Çalışır", "/nasil-calisir"]] },
  { title: "Çözümler", links: [["🏗️ Müteahhit & Alıcı", "/muteahhit"], ["⛏️ Tedarikçi & Ocak", "/tedarikci"], ["🚚 Nakliyeci & Taşıyıcı", "/nakliyeci"]] },
  { title: "Şirket", links: [["Hakkımızda", "/hakkimizda"], ["İletişim", "/iletisim"]] },
  { title: "Yasal", links: [["Gizlilik Politikası", "/yasal/gizlilik"], ["Kullanım Koşulları", "/yasal/kullanim-kosullari"], ["KVKK Aydınlatma", "/yasal/kvkk"]] },
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-400 text-sm font-black text-slate-950">H</div>
              <span className="text-base font-extrabold tracking-tight text-slate-950">HamTed</span>
            </div>
            <div className="mt-3 text-sm leading-relaxed text-gray-500">Türkiye'nin yük & nakliye eşleştirme platformu. Müteahhit, tedarikçi ve nakliyecileri komisyonsuz buluşturur.</div>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-950">{col.title}</div>
              <div className="flex flex-col gap-2">
                {col.links.map(([label, to]) => (
                  <Link key={to} to={to} className="text-sm text-gray-500 transition hover:text-amber-600">{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-9 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-6 text-xs text-gray-400">
          <div>&copy; 2026 HamTed Teknoloji A.Ş. — Tüm hakları saklıdır.</div>
          <div>ETBİS kayıtlı · KEP: hamted@hs01.kep.tr</div>
        </div>
      </div>
    </footer>
  );
}
