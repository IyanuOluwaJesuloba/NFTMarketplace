import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2f5e9',
          100: '#e3ead3',
          200: '#c7d3a9',
          300: '#abbd80',
          400: '#8fa756',
          500: '#748c3b',
          600: '#5b702f',
          700: '#435423',
          800: '#2b3816',
          900: '#161c0b',
        },
        'army-green': {
          50: '#f0f4e8',
          100: '#dce8d0',
          200: '#c8dbb8',
          300: '#b4ce9f',
          400: '#a0c187',
          500: '#556b2f',
          600: '#4a5d28',
          700: '#3f4f21',
          800: '#34411a',
          900: '#293313',
        },
      },
    },
  },
  plugins: [],
}
export default config
