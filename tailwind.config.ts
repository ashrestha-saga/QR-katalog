import type { Config } from "tailwindcss";

/**
 * Reference an env-driven theme color via its RGB-channel CSS var so that
 * Tailwind opacity modifiers (e.g. `bg-secondary/80`, `border-secondary/20`)
 * work. The channels are injected on :root by the root layout
 * (see src/lib/theme.ts).
 */
const themeColor = (name: string) => `rgb(var(--color-${name}-rgb) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // White and black are the only non-palette colors (env-driven)
        white: themeColor("white"),
        black: themeColor("black"),
        // Brand palette (env-driven via CSS custom properties)
        chathamsblue: themeColor("chathamsblue"),
        java: themeColor("java"),
        monza: themeColor("monza"),
        aquahaze: themeColor("aquahaze"),
        wildsand: themeColor("wildsand"),
        porcelain: themeColor("porcelain"),
        cranberry: themeColor("cranberry"),
        irisblue: themeColor("irisblue"),
        cabaret: themeColor("cabaret"),
        marine: themeColor("marine"),
        persiangreen: themeColor("persiangreen"),
        mercury: themeColor("mercury"),
        amethystsmoke: themeColor("amethystsmoke"),
        cornflowerblue: themeColor("cornflowerblue"),
        // Semantic theme tokens
        primary: themeColor("primary"),
        "primary-hover": themeColor("primary-hover"),
        secondary: themeColor("secondary"),
        "secondary-hover": themeColor("secondary-hover"),
        tertiary: themeColor("tertiary"),
        quaternary: themeColor("quaternary"),
        quinary: themeColor("quinary"),
        success: themeColor("success"),
        danger: themeColor("danger"),
        warning: themeColor("warning"),
        info: themeColor("info"),
        light: themeColor("light"),
        dark: themeColor("dark"),
        accent: {
          pink: themeColor("primary"),
          "pink-hover": themeColor("primary-hover"),
          mint: themeColor("aquahaze"),
          green: themeColor("persiangreen"),
          blue: themeColor("secondary"),
          "blue-light": themeColor("irisblue"),
          "blue-bg": themeColor("aquahaze"),
          "success-bg": themeColor("aquahaze"),
          "success-text": themeColor("success"),
          "success-muted": themeColor("persiangreen"),
        },
        brand: {
          50: themeColor("aquahaze"),
          100: themeColor("aquahaze"),
          500: themeColor("secondary"),
          600: themeColor("primary"),
          700: themeColor("primary-hover"),
        },
      },
      fontFamily: {
        sans: ["var(--font-opensans)", "Open Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(10, 22, 40, 0.06)",
      },
      borderRadius: {
        stage: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
