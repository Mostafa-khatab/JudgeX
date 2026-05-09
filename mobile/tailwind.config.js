/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
        },
        dark: {
          DEFAULT: '#09090b',
          card: '#18181b',
          border: '#27272a',
        },
        sky: {
          400: '#38bdf8',
          500: '#0ea5e9',
        }
      },
    },
  },
  plugins: [],
}
