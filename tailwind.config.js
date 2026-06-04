/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // Mevcut tema butonu html'e data-theme="dark" ekliyor -> dark: varyanti buna bagli
  darkMode: ["selector", '[data-theme="dark"]'],
  // KADEMELI GECIS: preflight (Tailwind reset) kapali -> index.css ile yazilan
  // mevcut sayfalar bozulmaz. Tum site Tailwind'e gecince acabiliriz.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        // MoveIQ markasi — pasted kodlar yine slate/yellow-400 kullanabilir, onlar da calisir
        navy: {
          DEFAULT: "#11141A",
          card: "#1B222D",
          soft: "#232C3A",
          line: "#2A323F",
          muted: "#6C7B93",
        },
        brand: {
          DEFAULT: "#FACC15", // koyu tema sarisi (= yellow-400)
          600: "#F5B301", // acik tema sarisi
        },
      },
      fontFamily: {
        sans: ["Outfit", "Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
}
