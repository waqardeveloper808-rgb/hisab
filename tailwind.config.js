/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./data/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        "surface-soft": "var(--color-surface-soft)",
        "surface-muted": "var(--color-surface-muted)",
        "surface-tint": "var(--color-surface-tint)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        line: "var(--color-line)",
        "line-strong": "var(--color-line-strong)",
        primary: {
          DEFAULT: "var(--color-primary)",
          soft: "var(--color-primary-soft)",
          hover: "var(--color-primary-hover)",
        },
        "primary-border": "var(--color-primary-border)",
        brand: {
          DEFAULT: "var(--color-brand)",
          dark: "var(--color-brand-dark)",
          soft: "var(--color-brand-soft)",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
      },
    },
  },
  plugins: [],
};