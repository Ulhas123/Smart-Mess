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
        iiita: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c2d8eb',
          300: '#94bfe0',
          400: '#5f9fd1',
          500: '#3982bf',
          600: '#2867a3',
          700: '#215384',
          800: '#1d466f',
          900: '#07294D',
          950: '#04162a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
