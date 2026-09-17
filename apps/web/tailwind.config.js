/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    '../../packages/*/src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        // colorhunt.co/palette/2a7c1376c457fff8cffbe6c2, plus two derived
        // neutrals: the palette's four colours alone cannot carry body text
        // at readable contrast on cream.
        cream: '#FFF8CF', // page
        sand: '#FBE6C2', // raised surface
        moss: '#2A7C13', // primary accent — 4.9:1 on cream
        leaf: '#76C457', // secondary accent
        bark: '#16300A', // primary text — 13.4:1 on cream
        sage: '#4A5C3A', // muted text — 6.8:1 on cream
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
