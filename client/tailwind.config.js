/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#1E3A8A',
          blueDark: '#172554',
          green: '#15803D',
          amber: '#B45309',
          red: '#B91C1C'
        }
      }
    },
  },
  plugins: [],
}
