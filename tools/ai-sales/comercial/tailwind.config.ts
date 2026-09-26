import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', '../shared/src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        /* ── Primary: ANNA deep navy ──────────────────── */
        primary: '#001B50',
        'on-primary': '#ffffff',
        'primary-container': '#1A3A72',
        'on-primary-container': '#A8C8F0',
        'primary-fixed': '#D4E4FF',
        'primary-fixed-dim': '#A8C8F0',
        'on-primary-fixed': '#001238',
        'on-primary-fixed-variant': '#1A3A72',
        'inverse-primary': '#A8C8F0',
        'surface-tint': '#1A6BB0',

        /* ── Secondary: ANNA green (logo border) ──────── */
        secondary: '#3D8C20',
        'on-secondary': '#ffffff',
        'secondary-container': '#C8F0A0',
        'on-secondary-container': '#0A2800',
        'secondary-fixed': '#C8F0A0',
        'secondary-fixed-dim': '#90D460',
        'on-secondary-fixed': '#082000',
        'on-secondary-fixed-variant': '#1A5A08',

        /* ── Tertiary: ANNA medium blue (icon) ────────── */
        tertiary: '#1A6BB0',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#1A4B8C',
        'on-tertiary-container': '#C4E4FF',
        'tertiary-fixed': '#D0E8FF',
        'tertiary-fixed-dim': '#A0CCFF',
        'on-tertiary-fixed': '#001C40',
        'on-tertiary-fixed-variant': '#1A4B8C',

        /* ── Error ────────────────────────────────────── */
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        /* ── Surface / Background ─────────────────────── */
        surface: '#f4f7fb',
        'on-surface': '#191c1e',
        'surface-variant': '#dde3ea',
        'on-surface-variant': '#41484f',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eef2f7',
        'surface-container': '#e8edf4',
        'surface-container-high': '#e2e8f0',
        'surface-container-highest': '#dce3eb',
        'surface-bright': '#f4f7fb',
        'surface-dim': '#d4dbe4',
        'inverse-surface': '#2d3339',
        'inverse-on-surface': '#edf1f7',
        background: '#f4f7fb',
        'on-background': '#191c1e',

        /* ── Outline ──────────────────────────────────── */
        outline: '#70788a',
        'outline-variant': '#bec6d4',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        'chat-gap': '12px',
        'container-max': '1200px',
        'section-padding': '64px',
        'margin-desktop': '40px',
        gutter: '24px',
        'margin-mobile': '16px',
        base: '8px',
      },
      fontFamily: {
        'headline-lg-mobile': ['Manrope', 'sans-serif'],
        'label-md': ['"JetBrains Mono"', 'monospace'],
        'body-lg': ['Inter', 'sans-serif'],
        'headline-lg': ['Manrope', 'sans-serif'],
        button: ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'display-lg': ['Manrope', 'sans-serif'],
        'headline-md': ['Manrope', 'sans-serif'],
        'body-sm': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.02em', fontWeight: '500' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }],
        button: ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};

export default config;
