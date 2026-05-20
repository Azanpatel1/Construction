/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Surfaces — warm paper & stone */
        ink: {
          950: "#FAF9F7",
          900: "#F5F3EF",
          850: "#FFFFFF",
          800: "#F0EDE8",
          700: "#E8E4DD",
          600: "#D4CFC6",
        },
        line: "#E5E2DC",
        muted: "#8A8580",
        text: "#2C2A28",
        /* Terracotta / clay accent */
        gold: {
          400: "#C97B5A",
          500: "#B85C38",
          600: "#9E4E30",
        },
        signal: {
          green: "#4A7C59",
          red: "#C45C4A",
          amber: "#B8956B",
          blue: "#5B6B7A",
        },
        chart: {
          structural: "#8B7355",
          mep: "#5B6B7A",
          envelope: "#B8956B",
          finishes: "#6B8F71",
          regulatory: "#C4A574",
          financing: "#B85C38",
          negative: "#C45C4A",
          positive: "#4A7C59",
          neutral: "#8A8580",
        },
      },
      fontFamily: {
        sans: [
          "DM Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        serif: [
          "Cormorant Garamond",
          "Georgia",
          "ui-serif",
          "serif",
        ],
        mono: [
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
        panel: "0 1px 2px rgba(44, 42, 40, 0.04), 0 0 0 1px rgba(44, 42, 40, 0.06)",
        glow: "0 0 0 1px rgba(184, 92, 56, 0.25), 0 2px 8px rgba(184, 92, 56, 0.08)",
        soft: "0 4px 24px -4px rgba(44, 42, 40, 0.08)",
      },
    },
  },
  plugins: [],
};
