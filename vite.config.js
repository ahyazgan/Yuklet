import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
