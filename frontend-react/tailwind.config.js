/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aws-navy': '#232f3e',
        'aws-orange': '#ff9900',
      }
    },
  },
  plugins: [],
}