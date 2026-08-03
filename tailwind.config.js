/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        jp: {
          dark: '#0B0F19',
          card: '#151C2C',
          border: '#2A344B',
          accent: '#6366F1',
          crimson: '#EF4444',
          gold: '#F59E0B',
          emerald: '#10B981',
          cyan: '#06B6D4',
          purple: '#A855F7',
          pink: '#EC4899',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        jp: ['"Noto Sans JP"', '"Hiragino Kaku Gothic Pro"', 'Meiryo', 'sans-serif'],
      },
      animation: {
        'card-flip': 'flip 0.6s ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(99, 102, 241, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
