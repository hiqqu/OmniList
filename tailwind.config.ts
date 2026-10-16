import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F1117",
        surface: "#181B22",
        surfaceHover: "#212631",
        card: "#181B22",
        border: "#282D37",
        primary: {
          DEFAULT: "#E2E8F0",
          hover: "#FFFFFF",
          glow: "rgba(226, 232, 240, 0.2)",
          foreground: "#0F1117",
        },
        text: {
          primary: "#F1F3F7",
          muted: "#8E96A4",
        },
        badge: {
          movie: "#fb7185",    // Rose
          show: "#f59e0b",     // Amber
          anime: "#38bdf8",    // Sky / Cyan
          book: "#fb923c",     // Orange
          game: "#c084fc",     // Purple
        },
      },
      aspectRatio: {
        "poster": "2/3",
      },
    },
  },
  plugins: [],
};
export default config;
