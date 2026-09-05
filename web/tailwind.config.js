/** @type {import('tailwindcss').Config} */
export default {
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
          50: '#EAF2F1',
          100: '#CFE3E1',
          400: '#2C7A74',
          500: '#1F5F5B',
          600: '#194B48',
          700: '#123634'
        },
        // Aksen hangat - untuk highlight & angka penting
        gold: {
          100: '#F6E9D2',
          400: '#D9A448',
          500: '#C98A3B',
          600: '#A76F2C'
        },
        // Status
        ok: { 100: '#DEEEE2', 500: '#3F7D5C', 600: '#2F6047' },
        warn: { 100: '#F7EFD2', 500: '#C9A227', 600: '#A9860F' },
        danger: { 100: '#F5DFDA', 500: '#B44B3D', 600: '#943A2F' },
        ink: {
          900: '#20302D',
          700: '#3B4B47',
          500: '#647A75',
          300: '#A9BAB5',
          100: '#E4E9E6'
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
