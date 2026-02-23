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
        emerald: {
          DEFAULT: "#00A572",
          50: "#E6F9F1",
          100: "#B3EDDA",
          600: "#008A5E",
          700: "#006F4B",
        },
        sky: {
          DEFAULT: "#0C8DCC",
          50: "#E7F4FB",
          100: "#B3DCF2",
          600: "#0A77AD",
          700: "#08618E",
        },
        lavender: {
          DEFAULT: "#7C5FD3",
          50: "#F0ECF9",
          100: "#D4CBEF",
          600: "#6A4FC0",
          700: "#5840AD",
        },
        navy: "#0A1628",
        background: "var(--background)",
        card: "var(--card)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "'SF Mono'", "Menlo", "Consolas", "'Liberation Mono'", "'Courier New'", "monospace"],
      },
      backgroundImage: {
        aurora: "linear-gradient(135deg, #00C78A, #0EA5E9, #A78BFA)",
      },
    },
  },
  plugins: [],
};
export default config;
