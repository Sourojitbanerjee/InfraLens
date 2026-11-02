/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#07090E',
        surface: {
          50: '#141A24',
          100: '#10151E',
          200: '#0C1017',
          300: '#080C12',
          border: '#1E293B',
          'border-light': '#334155',
        },
        infra: {
          healthy: '#10B981',
          moderate: '#F59E0B',
          high: '#F97316',
          critical: '#EF4444',
          neon: '#06B6D4',
          cyan: '#00F0FF',
          amber: '#F59E0B',
          coral: '#EF4444',
          emerald: '#10B981',
          slate: '#64748B',
        },
        civic: {
          charcoal: '#07090E',
          graphite: '#0C1017',
          ink: '#141A24',
          panel: '#1A2233',
          border: '#1E293B',
          'border-subtle': '#2D3748',
          offwhite: '#E8EDF5',
          muted: '#8B9EC0',
        },
      },
      fontFamily: {
        display: [
          'Space Grotesk',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'IBM Plex Mono',
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 3s ease-in-out infinite',
        'radar-ping': 'radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        radarPing: {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0',
          },
        },
      },
    },
  },
  plugins: [],
}
