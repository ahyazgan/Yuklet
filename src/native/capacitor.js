// ╔══════════════════════════════════════════════════════════════════╗
// ║  DAYIM — Native (Capacitor) köprü kurulumu                          ║
// ║  Yalnızca iOS/Android native kabukta çalışır; web'de no-op olur.    ║
// ║  StatusBar / SplashScreen / Keyboard / Android geri tuşu yönetimi.  ║
// ╚══════════════════════════════════════════════════════════════════╝

import { Capacitor } from "@capacitor/core";

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform(); // "ios" | "android" | "web"

// Native dışında (tarayıcı/PWA) hiçbir plugin yüklenmesin — bundle hafif kalsın.
export async function initNative() {
  if (!isNative()) return;

  // Native modda <html> üzerine işaret koy — CSS'te safe-area/padding ayarı için.
  document.documentElement.classList.add("native-app");
  document.documentElement.classList.add(`platform-${platform()}`);

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    if (platform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#1b222d" });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (e) {
    console.warn("StatusBar ayarlanamadı:", e);
  }

  // Klavye açılınca gövdeye sınıf ekle (input'ların üstüne taşmasını engelle).
  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    Keyboard.addListener("keyboardWillShow", () =>
      document.body.classList.add("keyboard-open")
    );
    Keyboard.addListener("keyboardWillHide", () =>
      document.body.classList.remove("keyboard-open")
    );
  } catch {
    /* keyboard plugin yok — sorun değil */
  }

  // Splash'i içerik hazır olunca gizle (config'te autoHide de var, bu güvenlik ağı).
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    setTimeout(() => SplashScreen.hide().catch(() => {}), 300);
  } catch {
    /* noop */
  }
}

// Android donanım geri tuşu: tarayıcı geçmişi varsa geri git, kökteyse çıkışı onayla.
// React Router içinden çağrılır (history erişimi için).
export async function initBackButton(navigate, isRootPath) {
  if (!isNative() || platform() !== "android") return () => {};
  try {
    const { App } = await import("@capacitor/app");
    const handle = await App.addListener("backButton", ({ canGoBack }) => {
      if (isRootPath() && !canGoBack) {
        App.exitApp();
      } else if (window.history.length > 1) {
        navigate(-1);
      } else {
        App.exitApp();
      }
    });
    return () => handle.remove();
  } catch {
    return () => {};
  }
}
