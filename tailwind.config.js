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
        theme: {
          bg: 'var(--theme-bg)',
          card: 'var(--theme-card)',
          surface: 'var(--theme-surface)',
          border: 'var(--theme-border)',
          borderLight: 'var(--theme-border-light)',
          text: 'var(--theme-text)',
          textMuted: 'var(--theme-text-muted)',
          primary: 'var(--theme-primary)',
        },
        nothing: {
          bg: '#000000',
          card: '#121212',
          surface: '#1A1A1A',
          border: '#262626',
          borderLight: '#404040',
          red: '#FF0033',
          gray: '#8E8E93',
          lightGray: '#D1D1D6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        jp: ['"Noto Sans JP"', '"Hiragino Kaku Gothic Pro"', 'Meiryo', 'sans-serif'],
      },
      animation: {
        'card-flip': 'flip 0.6s ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'float': 'float 15s ease-in infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(99, 102, 241, 0.8)' },
        },
        float: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-50vh) scale(1.2)' },
          '100%': { transform: 'translateY(-100vh) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
