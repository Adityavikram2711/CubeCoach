/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cube: {
          white: "#f5f5f5",
          yellow: "#ffd500",
          red: "#c41e3a",
          orange: "#ff6b00",
          blue: "#0051ba",
          green: "#009e60",
        },
        accentPurple: "#8b5cf6",
      },
    },
  },
  plugins: [],
};
