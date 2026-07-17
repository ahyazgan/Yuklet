import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

// Derleme damgası: hangi commit'in pakete girdiği uygulamada görünür
// (Profil altı + BootLoader) — "güncelleme geldi mi?" tartışmasını bitirir.
let commit = 'bilinmiyor'
try { commit = execSync('git rev-parse --short HEAD').toString().trim() } catch { /* git yoksa */ }
const builtAt = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_COMMIT__: JSON.stringify(commit),
    __APP_BUILT_AT__: JSON.stringify(builtAt),
  },
  build: {
    rollupOptions: {
      output: {
        // Ağır vendor'ları kendi chunk'larına ayır: ilk yük parse süresi düşer,
        // vendor değişmediğinde uygulama güncellemesinde yeniden indirilmez (cache).
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('leaflet')) return 'leaflet';
          if (id.includes('react-router') || id.includes('/react-dom/') || id.includes('/react/')) return 'react';
        },
      },
    },
  },
})
