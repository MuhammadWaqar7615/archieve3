import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F8FA",
        card: "#FFFFFF",
        border: "#E6E8EC",
        mainText: "#1B2935",
        mutedText: "#6B7280",
        primary: {
          DEFAULT: "#FF9540",
          50: "#FFF4EB",
          100: "#FFE4D1",
          200: "#FFC8A3",
          300: "#FFAA75",
          400: "#FF9540",
          500: "#FF8420",
          600: "#E66B00",
          700: "#B85200",
        },
        secondary: {
          DEFAULT: "#1B2935",
          bg: "#1B2935",
          hover: "#253646",
          active: "#2F4357",
          border: "#2A3C4D",
          text: "#9CA3AF",
          activeText: "#FFFFFF",
        },
        success: "#16A34A",
        warning: "#F59E0B",
        error: "#DC2626",
      },
    },
  },
  plugins: [],
};
export default config;
