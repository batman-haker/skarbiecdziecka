/** @type {import('tailwindcss').Config} */
module.exports = {
  // Look for Tailwind classes in these files
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 🌃 CYBERPUNK NEON COLORS
      colors: {
        // Cyberpunk neons
        neon: {
          pink: '#FF006E',
          cyan: '#00F0FF',
          purple: '#B026FF',
          yellow: '#FFFF00',
          green: '#39FF14',
          orange: '#FF6600',
        },
        cyber: {
          bg: '#0a0a0f',
          dark: '#13131a',
          darker: '#080810',
          card: '#1a1a2e',
          border: '#2d2d44',
        },
      },
      // Custom fonts (add to public/fonts if needed)
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cal)', 'system-ui', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
      // Cyberpunk animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'flicker': 'flicker 3s linear infinite',
        'scan': 'scan 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': {
            boxShadow: '0 0 5px #FF006E, 0 0 10px #FF006E, 0 0 15px #FF006E',
          },
          '100%': {
            boxShadow: '0 0 10px #FF006E, 0 0 20px #FF006E, 0 0 30px #FF006E, 0 0 40px #FF006E',
          },
        },
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': {
            opacity: '1',
          },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': {
            opacity: '0.8',
          },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      boxShadow: {
        'neon-pink': '0 0 10px #FF006E, 0 0 20px #FF006E, 0 0 30px #FF006E',
        'neon-cyan': '0 0 10px #00F0FF, 0 0 20px #00F0FF, 0 0 30px #00F0FF',
        'neon-purple': '0 0 10px #B026FF, 0 0 20px #B026FF, 0 0 30px #B026FF',
        'neon-yellow': '0 0 10px #FFFF00, 0 0 20px #FFFF00, 0 0 30px #FFFF00',
        'neon-green': '0 0 10px #39FF14, 0 0 20px #39FF14, 0 0 30px #39FF14',
      },
    },
  },
  plugins: [
    // Add Tailwind plugins here
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
};
