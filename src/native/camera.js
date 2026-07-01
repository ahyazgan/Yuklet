// ╔══════════════════════════════════════════════════════════════════╗
// ║  Kamera/Galeri — native'de @capacitor/camera (çek veya seç),       ║
// ║  web'de null döner → çağıran taraf <input type=file>'a düşer.       ║
// ╚══════════════════════════════════════════════════════════════════╝

import { Capacitor } from "@capacitor/core";

export const cameraNative = () => Capacitor.isNativePlatform();

// Bir hatanın "izin reddi" mi yoksa normal iptal mi olduğunu ayırt et.
// Capacitor camera iptal/izinsizde farklı mesajlar fırlatır; ikisini ayırırsak
// iptalde sessiz kalır, izin reddinde kullanıcıya net bilgi verebiliriz.
function isPermissionDenied(e) {
  const m = String(e?.message || e || "").toLowerCase();
  return m.includes("denied") || m.includes("permission") || m.includes("not authorized") || m.includes("no access");
}
function isCancel(e) {
  const m = String(e?.message || e || "").toLowerCase();
  return m.includes("cancel") || m.includes("no image") || m.includes("user cancelled");
}

// Native'de kamera/galeri açar, seçilen görseli dataURL döndürür.
// Web'de null döner. Dönüş: { dataUrl } | { denied:true } | { cancelled:true } | null.
// Geriye-uyumlu string kısayolu için pickPhotoDataUrl korunur (aşağıda).
export async function pickPhoto({ quality = 65 } = {}) {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // "Kamera" veya "Galeri" seçtir
      promptLabelHeader: "Fotoğraf",
      promptLabelPhoto: "Galeriden seç",
      promptLabelPicture: "Fotoğraf çek",
      correctOrientation: true,
    });
    return photo?.dataUrl ? { dataUrl: photo.dataUrl } : { cancelled: true };
  } catch (e) {
    if (isPermissionDenied(e) && !isCancel(e)) return { denied: true };
    return { cancelled: true };   // iptal veya bilinmeyen — sessiz
  }
}

// Kısayol: sadece dataURL (yoksa null). Eski çağrılar bozulmasın.
export async function pickPhotoDataUrl(opts) {
  const r = await pickPhoto(opts);
  return r?.dataUrl || null;
}
