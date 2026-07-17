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
import { registerSW } from './utils/pwa'
import { initNative, isNative } from './native/capacitor'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Native (iOS/Android) kabukta: plugin kurulumu + service worker KAPALI
// (Capacitor kendi WebView'ından servis eder; SW cache çakışması yaratabilir).
if (isNative()) {
  initNative()
} else {
  registerSW()
}
