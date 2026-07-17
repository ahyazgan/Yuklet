import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Marka fontları pakete gömülü (self-host): native kabukta uzak fonts.googleapis.com
// isteği ilk boyamayı bloklıyordu — yavaş şebekede açılış saniyelerce gecikiyordu.
// Türkçe karakterler latin-ext alt kümesiyle gelir (fontsource unicode-range).
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'
import '@fontsource/archivo/600.css'
import '@fontsource/archivo/700.css'
import '@fontsource/archivo/800.css'
import '@fontsource/archivo/900.css'
import '@fontsource/space-mono/400.css'
import '@fontsource/space-mono/700.css'
// Outfit: eski (index.css) sayfaların gövde fontu — o da gömülü.
import '@fontsource/outfit/300.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/outfit/800.css'
import '@fontsource/outfit/900.css'
import './tailwind.css'
import './index.css'
import App from './App.jsx'
import { unregisterSW } from './utils/pwa'
import { initNative, isNative } from './native/capacitor'

// SW KILL-SWITCH — render'dan ÖNCE, hem native hem web.
// Geçmiş sürümlerde kaydedilen service worker `capacitor://localhost` (native)
// ve yuklet.co (PWA) origin'lerinde cache'i KALICI tutuyordu; uygulama/build
// güncellenince bile eski cache'lenmiş index.html + JS/CSS'i servis edip yeni
// sürümü "eski görünür" yapıyordu. Bu, kayıtlı tüm SW'leri kaldırır + tüm
// Cache Storage'ı siler. sw.js artık pakete hiç girmiyor (public/'ten silindi),
// yani bir daha kaydedilemez. Tüm kullanıcılar güncelleyince kaldırılabilir.
unregisterSW()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (isNative()) {
  initNative()
}
