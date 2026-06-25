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
        background: "var(--background)",
        foreground: "var(--foreground)",
        sage: {
          50: "#f3f5f1",
          100: "#e2e8dd",
          200: "#c7d2c0",
          300: "#a9bca0",
          400: "#8ca580",
          500: "#708c62",
          600: "#576f4c",
          750: "#3c4d34",
          900: "#283423",
          950: "#141b11",
        },
        sand: {
          50: "#faf8f5",
          100: "#f5f2eb",
          200: "#e7dfd1",
          300: "#d9cbba",
          500: "#b3a183",
          800: "#6e604d",
          900: "#4b4134",
        },
        charcoal: {
          50: "#fafafa",
          100: "#f3f3f3",
          200: "#e7e7e7",
          300: "#d6d6d6",
          500: "#757575",
          800: "#373b39",
          900: "#2d312e",
          950: "#191c1a",
        },
      },
      animation: {
        "gradient-slow": "gradient-xy 20s ease infinite",
        "pulse-slow": "pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "gradient-xy": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "0% 50%",
          },
          "50%": {
            "background-size": "400% 400%",
            "background-position": "100% 50%",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
