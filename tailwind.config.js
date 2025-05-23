/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      borderWidth: {
        '3': '3px',
      },
      ringWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
};