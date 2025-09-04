// Custom plugin to add theme-related CSS classes
module.exports = function({ addUtilities }) {
  const newUtilities = {
    '.text-theme-foreground': {
      color: 'var(--foreground)',
    },
    '.bg-theme-background': {
      backgroundColor: 'var(--background)',
    },
    '.border-theme-primary': {
      borderColor: 'var(--primary)',
    },
    '.bg-theme-primary': {
      backgroundColor: 'var(--primary)',
    },
    '.text-theme-primary': {
      color: 'var(--primary)',
    },
    '.bg-theme-secondary': {
      backgroundColor: 'var(--secondary)',
    },
    '.text-theme-secondary': {
      color: 'var(--secondary)',
    },
    '.bg-theme-accent': {
      backgroundColor: 'var(--accent)',
    },
    '.text-theme-accent': {
      color: 'var(--accent)',
    },
  }

  addUtilities(newUtilities)
}
