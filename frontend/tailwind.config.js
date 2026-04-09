/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  // ✅ Automatically follows OS/device dark-mode preference
  darkMode: "media",

  theme: {
    extend: {
      colors: {
        // 🟠 Orange brand scale — matches useTheme C.brand tokens
        brand: {
          50:  "#fff7ed",   // C.bg (light), C.textPrimary (dark)
          100: "#ffedd5",   // C.surfaceAlt (light)
          200: "#fed7aa",   // C.border (light)
          300: "#fdba74",   // C.brandDeep (dark)
          400: "#fb923c",   // C.brandDark (dark hover)
          500: "#f97316",   // C.brand — primary orange ✦
          600: "#ea580c",   // C.brandDark (light hover)
          700: "#c2410c",   // C.brandDeep (light active)
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },

        // 🎨 Surfaces
        surface: {
          light:    "#ffffff",
          dark:     "#261500",
          pagLight: "#fff7ed",
          pagDark:  "#1a0f00",
        },

        // ✍️ Text tokens mirror useTheme C.text* names
        content: {
          primary:   "#1c1917",  // C.textPrimary light
          secondary: "#78716c",  // C.textSecondary light
          muted:     "#a8a29e",  // C.textMuted light
          inverse:   "#fff7ed",  // C.textPrimary dark
          onBrand:   "#ffffff",
          onBrandDk: "#1a0f00",
        },

        // 🚨 Error
        danger: {
          text:     "#dc2626",
          bg:       "#fef2f2",
          border:   "#fca5a5",
          textDk:   "#f87171",
          bgDk:     "#1c0a0a",
          borderDk: "#7f1d1d",
        },
      },

      fontFamily: {
        display: ["DM Serif Display", "Georgia", "serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
        sans:    ["DM Sans", "system-ui", "sans-serif"],
      },

      animation: {
        "fade-in":    "fadeIn 0.4s ease both",
        "slide-up":   "slideUp 0.4s ease both",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow":  "spin 8s linear infinite",
      },

      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: "translateY(16px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
      },

      boxShadow: {
        "glow-brand": "0 0 20px 2px rgba(249,115,22,0.28)",
        "glow-sm":    "0 0 8px 1px rgba(249,115,22,0.18)",
      },
    },
  },

  plugins: [],
};