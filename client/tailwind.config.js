/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Cairo', 'Tajawal', 'sans-serif'],
        body: ['"IBM Plex Sans Arabic"', 'Tajawal', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        navy: {
          50: '#EEF2F9',
          100: '#D7E1F0',
          200: '#AFC3E1',
          300: '#7F9BCB',
          400: '#4D6CA0',
          500: '#1F3A6E',
          600: '#15294F',
          700: '#0F2A5C',
          800: '#0A1F44',
          900: '#061530',
          950: '#040E20',
        },
        gold: {
          50: '#FBF6E7',
          100: '#F5E9C2',
          200: '#ECD896',
          300: '#E2C766',
          400: '#D9BA4C',
          500: '#D4AF37',
          600: '#B8941F',
          700: '#93761A',
          800: '#6E5814',
          900: '#4A3B0D',
        },
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(155deg, #0A1F44 0%, #0F2A5C 45%, #061530 100%)',
        'gold-foil': 'linear-gradient(110deg, #B8941F 0%, #ECD896 28%, #D4AF37 50%, #F5E9C2 65%, #B8941F 100%)',
        'gold-line': 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(10, 31, 68, 0.12)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        gold: '0 0 0 1px rgba(212,175,55,0.35), 0 8px 24px -4px rgba(212,175,55,0.25)',
        card: '0 18px 40px -8px rgba(10,31,68,0.25)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: 0, transform: 'scale(0.96)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3.5s linear infinite',
        'fade-up': 'fade-up 0.35s ease-out',
        'pop-in': 'pop-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
