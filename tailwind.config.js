/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        surface: {
          50:  '#1a1a2e',
          100: '#16213e',
          200: '#0f3460',
          card: 'rgba(255,255,255,0.05)',
        },
        brand: {
          bg: '#FAFAFA',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          primary: '#6366F1',
          primaryHover: '#4F46E5',
          textMain: '#0F172A',
          textBody: '#334155',
          textMuted: '#64748B',
        }
      },
      borderRadius: {
        'r-sm': '8px',
        'r-md': '16px',
        'r-lg': '24px',
        'r-xl': '32px',
      },
      boxShadow: {
        'brand-soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 10px -1px rgba(0, 0, 0, 0.03)',
        'brand-hover': '0 12px 30px -4px rgba(99, 102, 241, 0.12), 0 4px 12px -2px rgba(99, 102, 241, 0.08)',
        'brand-elevated': '0 20px 40px -4px rgba(0, 0, 0, 0.1), 0 10px 20px -2px rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0a1628 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        glow:    { '0%': { boxShadow: '0 0 20px rgba(124,58,237,0.3)' }, '100%': { boxShadow: '0 0 40px rgba(124,58,237,0.6)' } },
      }
    },
  },
  plugins: [],
}
