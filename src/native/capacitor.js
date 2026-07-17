// ╔══════════════════════════════════════════════════════════════════╗
// ║  YÜKLET — Native (Capacitor) köprü kurulumu                         ║
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
    // Style.Light = "açık zemin, KOYU ikonlar" (Capacitor'da ad tersinedir).
    // iOS: contentInset "never" → webview tam ekran, status bar'ın arkasını
    // sayfanın kendi zemini doldurur (ayrı renkli şerit YOK; .app-root
    // padding-top env(safe-area-inset-top) içeriği saatin altından kaçırır).
    // Android: overlay kapalı — şerit manila (#F1EDE5), sayfa zeminiyle AYNI
    // renk olduğu için ayrı bir bant olarak algılanmaz.
    await StatusBar.setStyle({ style: Style.Light });
    if (platform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#F1EDE5" });
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

  // Splash burada GİZLENMEZ. Eskiden hemen gizleniyordu ama React ilk kareyi
  // boyamadan kapanınca arada boş/koyu bir an görünüyordu ("lacivert flaş").
  // Artık BootLoader ekrana çizildikten sonra kendisi gizler (hideSplash);
  // config'teki launchAutoHide + launchShowDuration yalnız emniyet ağıdır.
}

// BootLoader ilk karesi boyandıktan sonra çağrılır — native splash'ten manila
// animasyona kesintisiz (manila→manila) geçiş. Web'de no-op.
export async function hideSplash() {
  if (!isNative()) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide().catch(() => {});
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

// Deep link: uygulama bir bağlantıyla açılınca (com.yuklet.app://ilan/123 veya
// https://yuklet.co/ilan/123) ilgili rotaya yönlendir. React Router'dan çağrılır.
export async function initDeepLinks(navigate) {
  if (!isNative()) return () => {};
  try {
    const { App } = await import("@capacitor/app");
    const routeFromUrl = (url) => {
      if (!url) return;
      try {
        const u = new URL(url);
        // ÖNEMLİ: custom scheme'de (com.yuklet.app://ilan/123) URL, "ilan"ı HOST,
        // "/123"ü pathname olarak ayrıştırır → sadece pathname alınsa "/123"e gider
        // ve 404 olur. http(s) dışı şemalarda rotayı host+pathname'den kur.
        const isHttp = u.protocol === "http:" || u.protocol === "https:";
        const path = isHttp
          ? (u.pathname || "/") + (u.search || "")
          : "/" + [u.host, (u.pathname || "").replace(/^\/+/, "")].filter(Boolean).join("/") + (u.search || "");
        if (path && path !== "/") navigate(path);
      } catch {
        // URL ayrıştırılamazsa: "scheme://ilan/123" → "/ilan/123"
        const m = String(url).match(/^[a-z0-9.+-]+:\/\/(.*)$/i);
        if (m && m[1]) navigate("/" + m[1].replace(/^\/+/, ""));
      }
    };
    const handle = await App.addListener("appUrlOpen", (event) => routeFromUrl(event?.url));
    return () => handle.remove();
  } catch {
    return () => {};
  }
}
