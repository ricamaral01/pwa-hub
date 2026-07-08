/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        blue: '#2563EB',
        slate: '#334155',
        gray: '#64748B',
        lightGray: '#F1F5F9',
        green: '#166534',
        orange: '#9A3412',
        red: '#991B1B',
        purple: '#6D28D9',
      },
    },
  },
  plugins: [],
}
