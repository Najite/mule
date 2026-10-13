/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        ring: 'hsl(var(--ring))',
        input: 'hsl(var(--input))',
        canvas: {
          DEFAULT: '#08090C',
          subtle: '#0D0F15',
          raised: '#12151D',
          overlay: '#181C27',
        },
        signal: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          light: '#FBBF24',
          subtle: 'rgba(245, 158, 11, 0.12)',
        },
        risk: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          subtle: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.35)',
        },
        verified: {
          DEFAULT: '#10B981',
          subtle: 'rgba(16, 185, 129, 0.12)',
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
          subtle: 'rgba(255, 255, 255, 0.08)',
          medium: 'rgba(255, 255, 255, 0.16)',
          strong: 'rgba(255, 255, 255, 0.24)',
        },
        text: {
          primary: '#F5F5F7',
          secondary: '#9BA3AF',
          muted: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SF Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-dash': 'flowDash 20s linear infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        flowDash: {
          to: { strokeDashoffset: '-100' },
        },
      },
    },
  },
  plugins: [],
};
