/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,html}', './*.html'],
  theme: {
    extend: {
      colors: {
        // Deep navy blues for backgrounds
        navy: {
          50: '#E6F0FF',
          100: '#CCE0FF',
          200: '#99C2FF',
          300: '#66A3FF',
          400: '#3385FF',
          500: '#0066FF',
          600: '#0052CC',
          700: '#003D99',
          800: '#002966',
          900: '#001433',
          950: '#000D1A',
        },
        // Royal accents for highlights
        royal: {
          50: '#F0F5FF',
          100: '#E5F0FF',
          200: '#C7DBFF',
          300: '#A3C2FF',
          400: '#7FA9FF',
          500: '#5B90FF',
          600: '#3777FF',
          700: '#135EFF',
          800: '#0045EF',
          900: '#002C99',
          950: '#001A5C',
        },
        // Brand colors
        brand: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#8B5CF6',
          light: '#EFF6FF',
          dark: '#111827'
        },
        // Simple brand colors as requested
        brand: "#3B82F6",
        dark: "#111827",
        // Semantic colors
        semantic: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6'
        },
        // Midnight theme
        midnight: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617'
        }
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'raleway': ['Raleway', 'sans-serif'],
        'ibm-plex': ['IBM Plex Sans', 'sans-serif']
      },
      animation: {
        'text-gradient': 'text-gradient 3s ease infinite',
        'pulse': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
      },
      keyframes: {
        'text-gradient': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
    },
  },
  plugins: [],
};