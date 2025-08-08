/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ufc-red': '#D20A11',
        'ufc-blue': '#0A1428',
        'ufc-gold': '#FFD700',
        'ufc-dark': '#1A1A1A',
        'ufc-gray': '#2A2A2A',
        'ufc-lightgray': '#F5F5F5',
        ufc: {
          red: '#D20A11',
          blue: '#0A1428',
          gold: '#FFD700',
          dark: '#1A1A1A',
          gray: '#2A2A2A',
          lightgray: '#F5F5F5'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
} 