/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#fd615e',
          500: '#FD615E',
          600: '#e53e3e',
          700: '#c53030',
          800: '#9b2c2c',
          900: '#742a2a',
          950: '#451a1a',
        },
        secondary: {
          50: '#faf5f7',
          100: '#f4e8ed',
          200: '#ead7de',
          300: '#d9b9c5',
          400: '#c091a5',
          500: '#7F5971',
          600: '#6b4a5e',
          700: '#5a3f50',
          800: '#4a3344',
          900: '#3b2836',
          950: '#251a23',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        brandician: {
          accent: '#FD615E',
          main: '#7F5971',
          supporting: 'rgba(127, 89, 113, 0.25)',
          light: '#F8FAFC',
          white: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'system-ui', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"'],
        serif: ['Bitter', 'serif'],
        display: ['Bitter', 'serif'],
        menu: ['Source Sans Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
};