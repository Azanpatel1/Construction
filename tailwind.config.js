/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B0E14",
          900: "#10141C",
          850: "#151B26",
          800: "#1B2230",
          700: "#222C3D",
          600: "#2C3A50",
        },
        line: "#2A3344",
        muted: "#6B7A93",
        text: "#E6EAF2",
        gold: {
          400: "#E2B868",
          500: "#D4A24C",
          600: "#B6862F",
        },
        signal: {
          green: "#3DD68C",
          red: "#F25C5C",
          amber: "#F2B441",
          blue: "#5BA8FF",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
      boxShadow: {
        panel:
          "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 0 0 1px rgba(255,255,255,0.04), 0 8px 24px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(212,162,76,0.35), 0 0 24px -4px rgba(212,162,76,0.35)",
      },
    },
  },
  plugins: [],
};
