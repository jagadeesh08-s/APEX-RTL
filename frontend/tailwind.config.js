/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        surface: "#111827",
        card: "#1E293B",
        primary: "#7C3AED",
        secondary: "#2563EB",
        accent: "#06B6D4",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        text: "#F8FAFC",
        muted: "#94A3B8",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif', 'system-ui'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        glow: "0 0 15px rgba(124, 58, 237, 0.4)",
        cyanGlow: "0 0 15px rgba(6, 182, 212, 0.4)",
        blueGlow: "0 0 15px rgba(37, 99, 235, 0.4)",
      }
    },
  },
  plugins: [],
}
