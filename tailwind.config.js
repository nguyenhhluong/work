/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        grok: {
          bg: '#000000',
          card: '#0f0f0f',
          secondary: '#161618',
          border: '#27272a',
          foreground: '#ffffff',
          accent: '#1d9bf0',
          muted: '#71717a',
          success: '#10b981',
          error: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      screens: {
        'xs': '400px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0, 0, 0.2, 1) forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glowPulse: {
          '0%, 100%': { borderColor: 'rgba(255, 255, 255, 0.1)', boxShadow: '0 0 20px rgba(255, 255, 255, 0.05), inset 0 0 5px rgba(255, 255, 255, 0.05)' },
          '50%': { borderColor: 'rgba(255, 255, 255, 0.4)', boxShadow: '0 0 40px rgba(255, 255, 255, 0.15), inset 0 0 10px rgba(255, 255, 255, 0.1)' },
        }
      }
    }
  },
  plugins: [],
}
