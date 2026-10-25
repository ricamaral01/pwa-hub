/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8edf4',
          100: '#c5d0e3',
          200: '#9db0d0',
          300: '#7590bc',
          400: '#5678ae',
          500: '#3761a0',
          600: '#1e3a5f',   // Azul principal Concrefer
          700: '#162b47',
          800: '#0e1d30',
          900: '#060e18',
        },
        status: {
          aprovado:  '#16a34a',
          revisao:   '#d97706',
          obsoleto:  '#6b7280',
          pendente:  '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
