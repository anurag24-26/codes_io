/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7ff",
          100: "#e9edff",
          200: "#c9d3ff",
          300: "#a3b1ff",
          400: "#7c8bff",
          500: "#5865f2",
          600: "#4650cf",
          700: "#363da3",
          800: "#282e78",
          900: "#1b1f52",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.85rem",
        "2xl": "1.1rem",
      },
    },
  },
  plugins: [],
};
