import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#11120f",
        guard: "#0d5c4a",
        mint: "#d7efe3",
        warning: "#9a5a00",
        paper: "#f4f2ea",
        zcash: "#f0b92d",
        rail: "#1b1d18",
        line: "#d7d1c2"
      },
      boxShadow: {
        soft: "0 22px 70px rgba(17, 18, 15, 0.12)",
        insetline: "inset 0 0 0 1px rgba(17, 18, 15, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
