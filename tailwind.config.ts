import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf4f7",
          100: "#fbe8ee",
          200: "#f7d4e0",
          300: "#f1b3c9",
          400: "#e684a8",
          500: "#d75986",
          600: "#c23c6d",
          700: "#a62b57",
          800: "#8a2649",
          900: "#732440",
          950: "#441022",
        },
        boutique: {
          cream: "#FAF8F5",
          sand: "#F2EBE4",
          gold: "#D4AF37",
          rose: "#E892A2",
          sage: "#9BB0A5",
          charcoal: "#1F2421",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'premium': '0 10px 30px -5px rgba(215, 89, 134, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(215, 89, 134, 0.35)',
      },
      screens: {
        'print': { 'raw': 'print' },
      }
    },
  },
  plugins: [],
};
export default config;
