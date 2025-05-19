import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: "true",
      padding: "2rem",
    },
    extend: {
      colors: {
        darkBlueElements: "var(--dark-blue-elements)",
        veryDarkBlueBg: "var(--very-dark-blue-bg)",
        veryDarkBlueText: "var(--very-dark-blue-text)",
        darkGrayInput: "var(--dark-gray-input)",
        veryLightGrayBg: "var(--very-light-gray-bg)",
        whiteText: "var(--white-text)",
      },
      fontFamily: {
        sans: ['Nunito Sans"', "sans-serif"],
      },
      fontSize: {
        body: "14px",
        detail: "16px",
      },
      fontWeight: {
        light: "300",
        semibold: "600",
        bold: "800",
      },
      container: {
        center: "true",
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
    },
  },
};

export default config;
