/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#091426',
        'primary-container': '#1B2A4A',
        'on-primary': '#FFFFFF',
        secondary: '#745939',
        'secondary-container': '#FFDDB8',
        'on-secondary-container': '#2A1800',
        surface: '#FAF9F7',
        'on-surface': '#1C1C1A',
        'on-surface-variant': '#5E6066',
        'surface-container-lowest': '#FFFFFF',
        'surface-container': '#F3F0EB',
        'surface-container-high': '#EAE6DF',
        'outline-variant': '#E2DFD8',
        error: '#BA1A1A',
        'error-container': '#FFDAD6',
        'on-error-container': '#410002',
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
