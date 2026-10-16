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
        background: "#090d16",
        surface: "#0f172a",
        surfaceHover: "#1e293b",
        card: "#111827",
        border: "#1f293d",
        primary: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          glow: "rgba(99, 102, 241, 0.35)",
        },
        badge: {
          movie: "#ef4444",    // Rot
          show: "#f59e0b",     // Amber / Gelb
          anime: "#3b82f6",    // Blau
          book: "#f97316",     // Orange
          game: "#a855f7",     // Violett
        },
      },
      aspectRatio: {
        "poster": "2/3",
      },
      boxShadow: {
        "glow-purple": "0 0 25px -5px rgba(168, 85, 247, 0.4)",
        "glow-blue": "0 0 25px -5px rgba(59, 130, 246, 0.4)",
        "glow-amber": "0 0 25px -5px rgba(245, 158, 11, 0.4)",
        "glow-radar": "0 0 20px 2px rgba(239, 68, 68, 0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
