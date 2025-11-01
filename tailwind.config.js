/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'lora': ['Lora', 'serif'],
      },
      colors: {
        dark: {
          bg: '#1a1a1a',
          card: '#262626',
          border: '#404040',
          text: '#e5e5e5',
          muted: '#a3a3a3',
        }
      }
    },
  },
  plugins: [],
}
