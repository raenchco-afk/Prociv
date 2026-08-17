/** Config equivalente al que estaba embebido en index.html (CDN). */
module.exports = {
  darkMode: 'class',
  content: ['./content/*.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          black: '#000000',
          dark: '#05070B',
          card: '#0B0F19',
          cardHover: '#111827',
          blue: '#054BA6',
          blueLight: '#4C94E8',
          blueDark: '#033571',
          titanium: '#94A3B8',
          border: 'rgba(5, 75, 166, 0.18)',
          borderLight: 'rgba(76, 148, 232, 0.32)',
        },
      },
      boxShadow: {
        'glow-blue': '0 0 50px -10px rgba(5, 75, 166, 0.55)',
        'glow-cyan': '0 0 50px -10px rgba(76, 148, 232, 0.45)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.7)',
      },
    },
  },
  plugins: [],
};
