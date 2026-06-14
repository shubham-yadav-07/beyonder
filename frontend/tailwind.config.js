/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'bg-critical-bg','bg-high-bg','bg-medium-bg','bg-safe-bg','bg-info-bg',
    'bg-critical','bg-high','bg-medium','bg-safe','bg-info',
    'border-critical-border','border-high-border','border-medium-border','border-safe-border','border-info-border',
    'text-critical','text-high','text-medium','text-safe','text-info',
    'border-l-critical','border-l-high','border-l-medium','border-l-safe',
    'ring-critical','ring-high','ring-medium','ring-safe',
  ],
  theme: {
    extend: {
      colors: {
        bg:       'var(--color-bg)',
        surface:  'var(--color-surface)',
        elevated: 'var(--color-elevated)',
        overlay:  'var(--color-overlay)',
        border:   'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',

        'text-primary':   'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted':     'var(--color-text-muted)',
        'text-xmuted':    'var(--color-text-xmuted)',

        accent: {
          DEFAULT: 'var(--color-accent)',
          hover:   'var(--color-accent-hover)',
          subtle:  'var(--color-accent-subtle)',
          text:    'var(--color-accent-text)',
        },

        // Semantic severity — fixed to have -bg and -border sub-keys
        critical: {
          DEFAULT: '#e8405a',
          bg:      'rgba(232,64,90,.12)',
          border:  'rgba(232,64,90,.3)',
        },
        high: {
          DEFAULT: '#f27c35',
          bg:      'rgba(242,124,53,.12)',
          border:  'rgba(242,124,53,.3)',
        },
        medium: {
          DEFAULT: '#d4a017',
          bg:      'rgba(212,160,23,.12)',
          border:  'rgba(212,160,23,.3)',
        },
        safe: {
          DEFAULT: '#22c982',
          bg:      'rgba(34,201,130,.12)',
          border:  'rgba(34,201,130,.3)',
        },
        info: {
          DEFAULT: '#38b6f5',
          bg:      'rgba(56,182,245,.12)',
          border:  'rgba(56,182,245,.3)',
        },
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body:    ['"Figtree"', 'sans-serif'],
        mono:    ['"Fira Code"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      animation: {
        'fade-up':    'fadeUp .35s ease both',
        'fade-in':    'fadeIn .25s ease both',
        'pulse-dot':  'pulseDot 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.6s linear infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity:'0', transform:'translateY(12px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        fadeIn:   { from: { opacity:'0' }, to: { opacity:'1' } },
        pulseDot: { '0%,100%': { opacity:'1', transform:'scale(1)' }, '50%': { opacity:'.4', transform:'scale(.7)' } },
        shimmer:  { from: { backgroundPosition:'-200% 0' }, to: { backgroundPosition:'200% 0' } },
      },
      boxShadow: {
        card:       'var(--shadow-card)',
        'card-hover':'var(--shadow-card-hover)',
        accent:     '0 0 0 1px var(--color-accent), 0 0 24px rgba(99,102,241,.2)',
        critical:   '0 0 0 1px rgba(232,64,90,.4), 0 0 20px rgba(232,64,90,.15)',
        glow:       '0 0 32px rgba(99,102,241,.25)',
      },
    },
  },
  plugins: [],
}
