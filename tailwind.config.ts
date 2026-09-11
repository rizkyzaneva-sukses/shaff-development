import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#202124",
        paper: "#f7f8f6",
        sage: "#738b69",
        terracotta: "#bf6d4e"
      }
    }
  },
  plugins: []
};

export default config;
