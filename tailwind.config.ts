// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // ✅ Active le mode sombre basé sur la classe "dark"
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        green: {
          100: "#dcfce7",
          700: "#15803d",
        },
        red: {
          100: "#fee2e2",
          700: "#b91c1c",
        },
        yellow: {
          100: "#fef9c3",
          700: "#a16207",
        },
      },
    },
  },
  plugins: [],
};

export default config;
