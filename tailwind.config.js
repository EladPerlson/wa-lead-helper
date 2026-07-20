/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heebo: ['Heebo', 'Outfit', 'Arial', 'sans-serif'],
        brand: ['Outfit', 'Heebo', 'sans-serif'],
      },
      colors: {
        notion: {
          bg: 'var(--notion-bg)',
          surface: 'var(--notion-surface)',
          surface2: 'var(--notion-surface-2)',
          border: 'var(--notion-border)',
          text: 'var(--notion-text)',
          muted: 'var(--notion-muted)',
          accent: 'var(--notion-accent)',
          accentHover: 'var(--notion-accent-hover)',
          soft: 'var(--notion-accent-soft)',
          glow: 'var(--notion-glow)',
          glass: 'var(--notion-glass)',
          rail: 'var(--notion-rail)',
          railText: 'var(--notion-rail-text)',
          danger: 'var(--notion-danger)',
          success: 'var(--notion-success)',
        },
        brand: {
          ink: '#222831',
          slate: '#393E46',
          teal: '#00ADB5',
          mist: '#EEEEEE',
        },
      },
      boxShadow: {
        notion: '0 4px 20px rgba(0, 0, 0, 0.12)',
        'notion-lg': '0 12px 40px rgba(0, 0, 0, 0.28)',
        glow: '0 0 24px var(--notion-glow)',
        'glow-sm': '0 0 12px var(--notion-glow)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.75rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        rise: 'rise 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0.6' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        rise: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
