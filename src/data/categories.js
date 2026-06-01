// HamTed - YUK / nakliye platformu kategorileri
// Sadece iki ana is tipi: Hafriyat ve Silobas
export const CATS = [
  { id: "hafriyat", name: "Hafriyat", icon: "🚛", clr: "#C85A24", desc: "Kazi, toprak ve moloz tasima" },
  { id: "silobas", name: "Silobas", icon: "🛢️", clr: "#2E6FA3", desc: "Dokme yuk: cimento, kum, tahil" },
];

// Ilan yonu
export const LISTING_TYPES = [
  { id: "is", name: "Is ilani", desc: "Tasinacak yuk / is var" },
  { id: "arac", name: "Arac ilani", desc: "Bos arac, is ariyor" },
];

export const VEHICLE_TYPES = {
  hafriyat: ["Damperli kamyon", "Hafriyat kamyonu", "Kirkayak (4 dingil)", "Treyler / lowbed"],
  silobas: ["Silobas (cimento)", "Silobas (gida/tahil)", "Tanker", "Dokme yuk dorse"],
};

export const UNITS = ["ton", "m³", "sefer", "kamyon", "yuk"];

export const MATERIALS = {
  hafriyat: ["Toprak", "Moloz", "Hafriyat", "Kaya / tas", "Karisik"],
  silobas: ["Cimento", "Kum", "Cakil", "Micir", "Tahil / hububat", "Kati yem", "Diger dokme"],
};
