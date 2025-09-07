module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'text-theme-foreground',
    'bg-theme-background',
    'border-theme-primary',
    'bg-theme-primary',
    'text-theme-primary',
    'bg-theme-secondary',
    'text-theme-secondary',
    'bg-theme-accent',
    'text-theme-accent'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-ibm-plex-mono)', 'monospace'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      colors: {
        'theme': {
          'primary': '#1A018D',
          'secondary': '#FF5E32',
          'accent': '#B6CF4F',
          'background-light': '#EFE7D4',
          'background-dark': '#000000',
          'foreground-light': '#000000',
          'foreground-dark': '#EFE7D4',
        }
      },
      textColor: {
        'theme': {
          'primary': 'var(--primary)',
          'secondary': 'var(--secondary)',
          'accent': 'var(--accent)',
          'base': 'var(--foreground)',
        }
      },
      backgroundColor: {
        'theme': {
          'primary': 'var(--primary)',
          'secondary': 'var(--secondary)',
          'accent': 'var(--accent)',
          'base': 'var(--background)',
        }
      },
      animation: {
        'scroll': 'scroll 30s linear infinite',
        'marquee': 'marquee 25s linear infinite',
        'slideLeft': 'slideLeft 25s linear infinite',
      }
    },
  },
  plugins: [
    require('./src/lib/theme-plugin')
  ],
}; 