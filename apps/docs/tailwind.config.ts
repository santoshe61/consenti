import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e8f0fb',
          100: '#c5d8f5',
          500: '#1565c0',
          600: '#1a3460',
          700: '#122547',
        },
        success: '#43a047',
      },
      fontFamily: {
        mono: ['Fira Code', 'ui-monospace', 'Courier New', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
