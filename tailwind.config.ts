import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#ffffff",
        accent: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
        },
        border: "#1f1f1f",
        card: "#0a0a0a",
        danger: "#ef4444",
        warning: "#f59e0b",
        success: "#10b981",
      },
    },
  },
  plugins: [],
};

export default config;
