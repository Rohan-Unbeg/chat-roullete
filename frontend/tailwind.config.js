/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Outfit', 'sans-serif'],
        anime: ['Zen Dots', 'cursive'],
      },
      colors: {
        anime: {
          primary: '#ff007f',
          secondary: '#7000ff',
          accent: '#00f0ff',
          dark: '#0a081a',
          deeper: '#060412',
          light: '#fbeaff',
          pink: '#ff5cb8',
          violet: '#a855f7',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'speed-lines': 'speed-lines 3s linear infinite',
        'kanji-fall': 'kanji-fall 12s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'spin-reverse': 'spin-reverse 6s linear infinite',
        'summon-pulse': 'summon-pulse 2s ease-in-out infinite',
        'flash-in': 'flash-in 0.6s ease-out',
        'typewriter': 'typewriter 3s steps(30) infinite',
        'bounce-dot': 'bounce-dot 1.4s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'scale-burst': 'scale-burst 0.3s ease-out',
        'border-rotate': 'border-rotate 4s linear infinite',
        'fade-in-up': 'fade-in-up 0.8s ease-out',
        'hero-entrance': 'hero-entrance 1s ease-out',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4', filter: 'blur(20px)' },
          '50%': { opacity: '0.8', filter: 'blur(30px)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'speed-lines': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'kanji-fall': {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.3' },
          '90%': { opacity: '0.3' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
        },
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'summon-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.15)', opacity: '1' },
        },
        'flash-in': {
          '0%': { opacity: '0', transform: 'scale(1.3)' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        'scale-burst': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        'border-rotate': {
          '0%': { '--border-angle': '0deg' },
          '100%': { '--border-angle': '360deg' },
        },
        'fade-in-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'hero-entrance': {
          '0%': { transform: 'scale(0.8)', opacity: '0', filter: 'blur(10px)' },
          '100%': { transform: 'scale(1)', opacity: '1', filter: 'blur(0)' },
        },
      },
    },
  },
  plugins: [],
}
