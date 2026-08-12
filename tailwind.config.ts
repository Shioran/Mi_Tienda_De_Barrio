import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#DDD6C7",
        background: "#F7F5EF",
        foreground: "#1B1B18",
        card: "#FFFFFF",
        primary: {
          DEFAULT: "#1F4D3A",
          foreground: "#F7F5EF",
        },
        accent: {
          DEFAULT: "#E3A008",
          foreground: "#1B1B18",
        },
        muted: {
          DEFAULT: "#EFEBDF",
          foreground: "#6B6455",
        },
        success: "#2F8F4E",
        warning: "#E3A008",
        danger: "#C0392B",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
