import { Truck, Container, Users, Wrench, Megaphone } from "lucide-react";

// Mola Yeri kategorileri — id, etiket, kısa etiket, ikon.
// Ayrı dosya: hem MolaYeriPage hem MolaPaylasPage kullanır (fast-refresh uyumu).
export const MOLA_CATS = [
  { id: "tir", label: "Satılık Tır/Çekici", short: "Tır/Çekici", Icon: Truck },
  { id: "dorse", label: "Satılık Dorse/Araç", short: "Dorse", Icon: Container },
  { id: "eleman", label: "Eleman Aranıyor", short: "Eleman", Icon: Users },
  { id: "ekipman", label: "2.El Ekipman/Parça", short: "Ekipman", Icon: Wrench },
  { id: "duyuru", label: "Serbest / Duyuru", short: "Duyuru", Icon: Megaphone },
];
export const catOf = (id) => MOLA_CATS.find((c) => c.id === id) || MOLA_CATS[MOLA_CATS.length - 1];
