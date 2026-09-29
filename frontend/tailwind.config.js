/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5fa',
          100: '#e1ebf4',
          200: '#c5d9e9',
          300: '#9abbd9',
          400: '#6899c4',
          500: '#467bb0', // primary button
          600: '#356091', // dark navy header
          700: '#2b4d75',
          800: '#254261',
          900: '#132842', // charcoal text
        },
        accent: {
          500: '#f97316', // subtle saffron/orange
          600: '#ea580c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
