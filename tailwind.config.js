/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        ink: {
          950: '#0a0a0a',
          900: '#121212',
          700: '#2a2a2a',
          500: '#6b6b6b',
          100: '#f5f5f5',
        },
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0.2' },
        },
      },
      animation: {
        blink: 'blink 1s steps(1) infinite',
      },
    },
  },
  plugins: [],
};
