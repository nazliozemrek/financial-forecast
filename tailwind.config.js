/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'fade-in':'fadeIn 0.5s ease-in-out both',
      },
      keyframes: {
        fadeIn: {
          '0%':{ opacity: 0},
          '100%':{ opacity:1 },
        },
      },
      fontFamily: {
        sans:['Manrope','ui-sans-serif','system-ui','sans-serif'],
      }
    },
  },
  plugins: [],
}
