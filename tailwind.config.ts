import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Brétema brand palette (Decision 21) ─────────────────────────────
        bretema: {
          // Atlantic green — primary brand colour
          'green-900': '#1A2E24',
          'green-800': '#2D4A3E',
          'green-700': '#3D5A3E',
          'green-600': '#4A7060',
          'green-100': '#9EC4B0',
          'green-50':  '#F0F5F2',
          // Stone — app background
          'stone-100': '#F5F3EF',
          'stone-50':  '#E8E5DF',
          // Data colours
          'amber':     '#C4862A',
          'blue':      '#185FA5',
          'atlantic':  '#B8D4E8',
          // Text
          'text-primary':   '#1A1A1A',
          'text-secondary': '#5A5A5A',
          'text-tertiary':  '#9A9A9A',
          // Surfaces
          'surface':        '#FFFFFF',
          'surface-raised': '#F5F3EF',
          // Alert severity — foreground, background and text colours
          'alert-yellow':       '#F9C74F',
          'alert-yellow-bg':    '#FFF8E1',
          'alert-yellow-text':  '#7A5800',
          'alert-orange':       '#F4845F',
          'alert-orange-bg':    '#FFF0EB',
          'alert-orange-text':  '#6B2500',
          'alert-red':          '#E63946',
          'alert-red-bg':       '#FFF0F0',
          'alert-red-text':     '#FFFFFF',
        },
        // ── Legacy tokens (kept for backwards compatibility) ─────────────────
        sky: {
          DEFAULT: '#3b82f6',
          light: '#93c5fd',
          dark: '#1d4ed8',
        },
        alert: {
          yellow: '#F9C74F',
          orange: '#F4845F',
          red:    '#E63946',
        },
        // Neutral scale
        neutral: {
          950: '#0a0a0a',
          900: '#171717',
          800: '#262626',
          700: '#404040',
          600: '#525252',
          500: '#737373',
          400: '#a3a3a3',
          300: '#d4d4d4',
          200: '#e5e5e5',
          100: '#f5f5f5',
        },
      },
      spacing: {
        // 4px base scale — explicit tokens for map UI
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '112': '28rem',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config
