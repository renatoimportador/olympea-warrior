/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0A0F14',
        'bg-secondary': '#0E141B',
        'bg-card': '#131C25',
        'bg-card-hover': '#1A2530',
        'border-dark': '#1E2D3D',
        'border-accent-light': 'rgba(0,229,255,0.2)',
        'text-primary': '#FFFFFF',
        'text-secondary': '#8B9DB0',
        accent: '#00E5FF',
        'accent-secondary': '#00B8D4',
        'accent-glow': 'rgba(0,229,255,0.12)',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        rx: '#00E5FF',
        scaling: '#FBBF24',
        beginner: '#34D399',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #00E5FF 0%, #00B8D4 100%)',
        'gradient-card': 'linear-gradient(145deg, #131C25 0%, #0E141B 100%)',
        'gradient-success': 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
        'gradient-streak': 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.3)',
        'card-glow': '0 0 20px rgba(0,229,255,0.08)',
        'card-glow-hover': '0 0 30px rgba(0,229,255,0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,229,255,0.08)' },
          '50%': { boxShadow: '0 0 30px rgba(0,229,255,0.15)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
