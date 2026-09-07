/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        // Warna dasar / latar
        cream: '#F5F7F3',
        // Warna utama (identitas aplikasi) - teal dalam, terasa tenang & terpercaya
        brand: {
          50: '#E9F1EC',
          100: '#C9DDD1',
          400: '#2E6B4A',
          500: '#1E4E32',
          600: '#173F28',
          700: '#0F2E1D'
        },
        // Aksen hangat - untuk highlight & angka penting
        gold: {
          100: '#FCEFCB',
          400: '#F0B429',
          500: '#DE9F14',
          600: '#B5810A'
        },
        // Status
        ok: { 100: '#DEEEE2', 500: '#3F7D5C', 600: '#2F6047' },
        warn: { 100: '#F7EFD2', 500: '#C9A227', 600: '#A9860F' },
        danger: { 100: '#F5DFDA', 500: '#B44B3D', 600: '#943A2F' },
        ink: {
          900: '#1A241F',
          700: '#3A4A42',
          500: '#65786F',
          300: '#AEBBB4',
          100: '#E7ECE9'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(32, 48, 45, 0.06), 0 1px 1px rgba(32, 48, 45, 0.04)'
      },
      borderRadius: {
        card: '10px'
      }
    }
  },
  plugins: []
}