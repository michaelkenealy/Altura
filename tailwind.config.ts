import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Altura Design Tokens
        navy: {
          DEFAULT: "#0A1628",
          50: "#E8EDF5",
          100: "#C5D0E6",
          200: "#8FA3CC",
          300: "#5976B3",
          400: "#2E4E99",
          500: "#0A1628",
          600: "#091422",
          700: "#07101B",
          800: "#050C14",
          900: "#03070D",
        },
        gold: {
          DEFAULT: "#C5A572",
          50: "#FAF6EF",
          100: "#F3E9D5",
          200: "#E7D3AB",
          300: "#DBBD81",
          400: "#CEB479",
          500: "#C5A572",
          600: "#B08A52",
          700: "#8A6B3F",
          800: "#644D2C",
          900: "#3E2F1B",
        },
        surface: "#0F1F3D",
        "surface-elevated": "#162040",
        border: "#1A2F55",
        "muted-foreground": "#94A3B8",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-navy": "linear-gradient(135deg, #0A1628 0%, #0F1F3D 100%)",
        "gradient-gold": "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)",
        glow: "0 0 20px rgba(197,165,114,0.15)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
