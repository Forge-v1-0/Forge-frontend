/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── All colours reference CSS variables ─────────────────
      // This means Tailwind utilities (text-accent, bg-surface, etc.)
      // automatically inherit the design token system.
      colors: {
        base:     'var(--bg-base)',
        surface:  'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        border:   'var(--bg-border)',

        accent: {
          DEFAULT: 'var(--accent)',
          warm:    'var(--accent-warm)',
          dim:     'var(--accent-dim)',
          glow:    'var(--accent-glow)',
        },

        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted:     'var(--text-muted)',

        success: 'var(--success)',
        error:   'var(--error)',
        danger:  'var(--error)',
        info:    'var(--info)',
        warning: 'var(--warning)',
      },

      // ─── Typography ───────────────────────────────────────────
      fontFamily: {
        sans:    ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },

      // ─── Radius ───────────────────────────────────────────────
      borderRadius: {
        DEFAULT: 'var(--radius-md)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },

      // ─── Motion ───────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: '150ms',
        fast:    '150ms',
        normal:  '250ms',
        slow:    '400ms',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring:          'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ─── Shadows (glow using ember, not blue) ─────────────────
      boxShadow: {
        glow:    '0 0 24px var(--accent-glow)',
        'glow-sm': '0 0 10px var(--accent-dim)',
        surface: '0 1px 3px rgba(0,0,0,0.4)',
      },

      // ─── Keyframes ────────────────────────────────────────────
      keyframes: {
        'forge-blink': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0' },
        },
        'forge-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':       { opacity: '0.4', transform: 'scale(0.85)' },
        },
        'forge-spin': {
          to: { transform: 'rotate(360deg)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%':   { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },

      animation: {
        'blink':     'forge-blink 1s step-end infinite',
        'pulse-dot': 'forge-pulse 2s ease-in-out infinite',
        'spin-slow': 'forge-spin 0.8s linear infinite',
        'fade-in':   'fade-in 200ms ease forwards',
        'slide-up':  'slide-up 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in':  'slide-in 150ms ease forwards',
      },
    },
  },
  plugins: [],
}
