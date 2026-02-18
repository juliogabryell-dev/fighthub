/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#C41E3A',
          'red-dark': '#a01830',
          gold: '#D4AF37',
        },
        dark: {
          bg: '#0a0a0f',
          card: '#1a1a2e',
          card2: '#16213e',
          accent: '#0f3460',
        },
      },
      fontFamily: {
        bebas: ['var(--font-bebas)', 'sans-serif'],
        barlow: ['var(--font-barlow)', 'sans-serif'],
        'barlow-condensed': ['var(--font-barlow-condensed)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
