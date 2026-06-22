/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heebo: ['Heebo', 'Assistant', 'Arial', 'sans-serif'],
      },
      colors: {
        notion: {
          bg: 'var(--notion-bg)',
          surface: 'var(--notion-surface)',
          border: 'var(--notion-border)',
          text: 'var(--notion-text)',
          muted: 'var(--notion-muted)',
          accent: 'var(--notion-accent)',
          accentHover: 'var(--notion-accent-hover)',
        },
      },
      boxShadow: {
        notion: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'notion-lg': '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
