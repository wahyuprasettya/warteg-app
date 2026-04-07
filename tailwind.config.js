/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./App.{ts,tsx}", "./src/**/*.{ts,tsx}", "./global.css"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#A63D40",
          soft: "#F7E7D7",
          ink: "#2F2522",
          accent: "#E1A948",
          success: "#0E9F6E",
          muted: "#8B7E74",
          card: "#FFF9F1",
        },
      },
      fontFamily: {
        poppins: "Poppins-Regular",
        "poppins-medium": "Poppins-Medium",
        "poppins-semibold": "Poppins-SemiBold",
        "poppins-bold": "Poppins-Bold",
      },
    },
  },
  plugins: [],
};
