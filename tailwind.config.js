/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        retro: {
          dark: '#121218',
          card: '#1a1a24',
          border: '#323246',
          primary: '#e11d48',
          accent: '#06b6d4',
          yellow: '#eab308',
          green: '#22c55e',
          chalkboard: '#1b3b2b',
        }
      }
    },
  },
  plugins: [],
}
