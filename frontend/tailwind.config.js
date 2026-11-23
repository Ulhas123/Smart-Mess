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
        background: '#09090b', // Deep carbon black
        surface: '#121214',    // Obsidian surface
        'surface-elevated': '#18181b',
        'surface-highlight': '#27272a',
        accent: '#f4f4f5',
        muted: '#71717a',
        border: 'rgba(255, 255, 255, 0.1)',
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
        gold: '#d4af37',
        emerald: '#10b981',
        ruby: '#f43f5e',
        amber: '#f59e0b',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Instrument Serif"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'circ-out': 'cubic-bezier(0, 0.55, 0.45, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
}
