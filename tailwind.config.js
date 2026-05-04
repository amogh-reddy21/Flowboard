/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#090B12',
        surface:  '#0F1221',
        card:     '#1A1F32',
        elevated: '#1F2538',
        border:   'rgba(255,255,255,0.08)',
        'border-subtle': 'rgba(255,255,255,0.05)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'card-foreground': 'var(--card-foreground)',
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        'primary-foreground': 'var(--primary-foreground)',
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)', foreground: '#ffffff' },
        input: 'var(--input)',
        ring: 'var(--ring)',
        primary: {
          DEFAULT: '#F59E0B',
          foreground: '#0B0D14',
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        text: {
          primary:   '#F0F2FF',
          secondary: '#8B93B5',
          muted:     '#4E5678',
          inverse:   '#090B12',
        },
        priority: {
          urgent: '#EF4444',
          high:   '#F97316',
          medium: '#818CF8',
          low:    '#334155',
          none:   'transparent',
        },
        status: {
          todo:     '#64748B',
          progress: '#38BDF8',
          review:   '#A78BFA',
          done:     '#34D399',
        },
      },
      fontFamily: {
        sans:    ['"Geist Variable"', 'system-ui', 'sans-serif'],
        display: ['Syne', '"Geist Variable"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        sm:           '0 1px 2px rgba(0,0,0,0.3)',
        DEFAULT:      '0 2px 4px rgba(0,0,0,0.4)',
        md:           '0 4px 8px rgba(0,0,0,0.5)',
        lg:           '0 8px 24px rgba(0,0,0,0.6)',
        xl:           '0 16px 40px rgba(0,0,0,0.7)',
        glow:         '0 0 0 2px rgba(245,158,11,0.25)',
        card:         '0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.35)',
        'card-hover': '0 1px 0 rgba(255,255,255,0.07), 0 4px 20px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in':   'fadeIn 150ms ease-out',
        'slide-up':  'slideUp 200ms cubic-bezier(0.34,1.56,0.64,1)',
        'slide-in':  'slideIn 250ms cubic-bezier(0.4,0,0.2,1)',
        'scale-in':  'scaleIn 150ms cubic-bezier(0.34,1.56,0.64,1)',
        shimmer:     'shimmer 1.5s infinite',
        'btn-pulse': 'btnPulse 10s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 },                                to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(8px)' },  to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn:  { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn:  { from: { opacity: 0, transform: 'scale(0.95)' },      to: { opacity: 1, transform: 'scale(1)' } },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' },             '100%': { backgroundPosition: '200% 0' } },
        btnPulse: {
          '0%, 88%, 100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0)' },
          '90%':           { boxShadow: '0 0 0 6px rgba(245,158,11,0.2)' },
          '95%':           { boxShadow: '0 0 0 0 rgba(245,158,11,0)' },
        },
      },
    },
  },
  plugins: [
    function({ addVariant }) {
      addVariant('data-open', '&[data-open]')
      addVariant('data-closed', '&[data-closed]')
      addVariant('data-ending-style', '&[data-ending-style]')
      addVariant('data-starting-style', '&[data-starting-style]')
    }
  ],
}
