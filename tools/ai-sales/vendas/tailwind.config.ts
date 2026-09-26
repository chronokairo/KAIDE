/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    '../shared/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#059669',
        secondary: '#d97706',
        background: '#f8fafc',
        surface: '#ffffff',
        'surface-container': '#f1f5f9',
        'surface-container-low': '#f8fafc',
        'surface-container-high': '#e2e8f0',
        'on-surface': '#0f172a',
        'on-surface-variant': '#475569',
        'on-primary': '#ffffff',
        'primary-container': '#d1fae5',
        'secondary-container': '#fef3c7',
        'outline-variant': '#cbd5e1',
        error: '#dc2626',
      },
      fontFamily: {
        'body-md': ['Inter', 'system-ui', 'sans-serif'],
        'headline-md': ['Manrope', 'sans-serif'],
        'label-md': ['Inter', 'system-ui', 'sans-serif'],
        'button': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'body-md': '0.9375rem',
        'headline-md': '1.25rem',
        'label-md': '0.75rem',
        'button': '0.875rem',
      },
      spacing: {
        'margin-desktop': '2rem',
      },
    },
  },
  plugins: [],
};
