import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans:    ['Geist', 'system-ui', 'sans-serif'],
        mono:    ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: 'var(--border)',
        input:  'var(--input)',
        ring:   'var(--ring)',
        background: 'var(--background)',
        foreground:  'var(--foreground)',
        primary: {
          DEFAULT:    'var(--pulse-500)',
          foreground: 'var(--white)',
          hover:      'var(--pulse-600)',
        },
        secondary: {
          DEFAULT:    'var(--ink-100)',
          foreground: 'var(--ink-800)',
        },
        muted: {
          DEFAULT:    'var(--ink-100)',
          foreground: 'var(--ink-500)',
        },
        accent: {
          DEFAULT:    'var(--ink-100)',
          foreground: 'var(--ink-800)',
        },
        destructive: {
          DEFAULT:    'var(--hot-500)',
          foreground: 'var(--white)',
        },
        card: {
          DEFAULT:    'var(--white)',
          foreground: 'var(--ink-800)',
        },
        pulse:  { 500: 'var(--pulse-500)', 600: 'var(--pulse-600)' },
        hot:    { 50: 'var(--hot-50)',  500: 'var(--hot-500)',  600: 'var(--hot-600)' },
        warm:   { 50: 'var(--warm-50)', 500: 'var(--warm-500)', 600: 'var(--warm-600)' },
        cold:   { 50: 'var(--cold-50)', 500: 'var(--cold-500)' },
        won:    { 50: 'var(--won-50)',  500: 'var(--won-500)',  600: 'var(--won-600)' },
        ai:     { 50: 'var(--ai-50)',   500: 'var(--ai-500)',   600: 'var(--ai-600)' },
        ink: {
          50:  'var(--ink-50)',
          100: 'var(--ink-100)',
          150: 'var(--ink-150)',
          200: 'var(--ink-200)',
          300: 'var(--ink-300)',
          400: 'var(--ink-400)',
          500: 'var(--ink-500)',
          600: 'var(--ink-600)',
          700: 'var(--ink-700)',
          800: 'var(--ink-800)',
          900: 'var(--ink-900)',
          950: 'var(--ink-950)',
        },
      },
      borderRadius: {
        xs:   '6px',
        sm:   '8px',
        md:   '10px',
        lg:   '14px',
        xl:   '20px',
        '2xl':'28px',
        full: '999px',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        'glow-primary': 'var(--glow-primary)',
        'glow-won':     'var(--glow-won)',
        'glow-hot':     'var(--glow-hot)',
        'focus-ring':   'var(--focus-ring)',
      },
      transitionTimingFunction: {
        'ease-out':    'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '180ms',
        slow: '280ms',
      },
    },
  },
  plugins: [],
}

export default config
