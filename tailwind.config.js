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
          bg: 'var(--color-bg)',
          card: 'var(--color-surface)',
          card2: 'var(--color-surface2)',
          accent: 'var(--color-accent)',
        },
        theme: {
          text: 'rgb(var(--color-text) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          'text-inv': 'rgb(var(--color-text-inv) / <alpha-value>)',
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
