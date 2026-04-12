import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#132033",
        mist: "#EEF3F7",
        steel: "#5E6B7A",
        line: "#D8E0E8",
        brand: {
          DEFAULT: "#12344A",
          50: "#E9F2F6",
          100: "#D8E8EF",
          500: "#12344A",
          600: "#0F2D3F",
          700: "#0A2230",
        },
        accent: {
          amber: "#D89A31",
          coral: "#C95B4D",
          teal: "#2D7C7A",
        },
      },
      boxShadow: {
        panel: "0 12px 30px rgba(15, 29, 45, 0.08)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(19, 52, 74, 0.09) 1px, transparent 0)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

export default config;
