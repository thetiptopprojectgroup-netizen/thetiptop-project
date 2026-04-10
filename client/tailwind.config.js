/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette principale inspirée du thé
        'tea': {
          50: '#f7f6f3',
          100: '#edeae4',
          200: '#ddd7ca',
          300: '#c7bda8',
          400: '#b09f85',
          500: '#9d8a6d',
          600: '#907a61',
          700: '#786452',
          800: '#635346',
          900: '#52453b',
          950: '#2c241e',
        },
        // Vert matcha
        'matcha': {
          50: '#f3f6f3',
          100: '#e3ebe3',
          200: '#c8d7c8',
          300: '#a0b9a1',
          400: '#749577',
          500: '#537856',
          600: '#3f5f43',
          700: '#334c37',
          800: '#2b3e2e',
          900: '#243427',
          950: '#111c14',
        },
        // Or/Bronze pour le luxe
        'gold': {
          50: '#fdfaf3',
          100: '#faf2df',
          200: '#f4e2be',
          300: '#eccb93',
          400: '#e3ae66',
          500: '#db9645',
          600: '#cd7d3a',
          700: '#aa6232',
          800: '#894f2e',
          900: '#704228',
          950: '#3c2013',
        },
        // Crème/Beige
        'cream': {
          50: '#fefdfb',
          100: '#fcf9f3',
          200: '#f8f1e4',
          300: '#f2e5ce',
          400: '#e9d1ac',
          500: '#dfba8a',
          600: '#d19e68',
          700: '#b9824f',
          800: '#976944',
          900: '#7a573a',
          950: '#422c1d',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        serif: ['Poppins', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'tea-pattern': "url('/images/tea-pattern.svg')",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'steam': 'steam 4s ease-out infinite',
        'pour': 'pour 2s ease-in-out',
        'shake': 'shake 0.5s ease-in-out',
        'confetti': 'confetti 1s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        steam: {
          '0%': { opacity: 0, transform: 'translateY(0) scale(1)' },
          '50%': { opacity: 0.8 },
          '100%': { opacity: 0, transform: 'translateY(-40px) scale(1.5)' },
        },
        pour: {
          '0%': { transform: 'rotate(-45deg)' },
          '50%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-45deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: 0 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      boxShadow: {
        'tea': '0 10px 40px -10px rgba(83, 120, 86, 0.3)',
        'gold': '0 10px 40px -10px rgba(219, 150, 69, 0.3)',
        'soft': '0 2px 20px rgba(0, 0, 0, 0.08)',
        'elevated': '0 20px 60px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
