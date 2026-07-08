// Bir nakliyecinin uzmanlık kategorisini çıkarır: "hafriyat" | "silobas" | null.
// null = ikisi de / belirsiz / nakliyeci değil → filtre uygulanmaz (tüm ilanlar görünür).
//
// Öncelik:
//   1) Profil "Taşıma türü" seçimi (net tek kategori ise onu kullan)
//   2) Yoksa kullanıcının kendi araç ilanları + filosundaki araçların kategorisi
//
// Sadece nakliyeci rolü için anlamlıdır; alıcı/satıcıda her zaman null döner.

// Profil "Taşıma türü" etiketlerinden net tek kategoriye eşleme.
// "Hafriyat + Silobas (ikisi)", "Treyler / lowbed", "Tanker (sıvı)" bilinçli olarak
// eşlenmez → belirsiz kabul edilip (null) tüm ilanlar gösterilir.
const TASIMA_TURU_CAT = {
  "Hafriyat (damperli)": "hafriyat",
  "Silobas / dökme": "silobas",
};

export function haulerCategory({ user, listings = [], fleet = [] } = {}) {
  if (!user || user.role !== "nakliyeci") return null;

  // 1) Profil taşıma türü — net tek kategori ise doğrudan kullan.
  const fromProfile = TASIMA_TURU_CAT[user.tasimaTuru];
  if (fromProfile) return fromProfile;

  // 2) Kendi araç ilanları + filosundan kategori kümesi.
  const cats = new Set();
  for (const l of listings) {
    if (
      l &&
      l.type === "arac" &&
      String(l.ownerId) === String(user.id) &&
      (l.cat === "hafriyat" || l.cat === "silobas")
    ) {
      cats.add(l.cat);
    }
  }
  for (const v of fleet) {
    if (v && (v.cat === "hafriyat" || v.cat === "silobas")) cats.add(v.cat);
  }

  // Tek kategori varsa uzmanlık odur; 0 (yeni kullanıcı) veya 2 (karışık) ise belirsiz.
  return cats.size === 1 ? [...cats][0] : null;
}
