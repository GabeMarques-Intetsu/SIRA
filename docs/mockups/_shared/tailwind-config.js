/*
 * SIRA — Configuração Tailwind compartilhada.
 * Faz Tailwind reconhecer os tokens M3 expostos em tokens.css via
 * CSS custom properties, eliminando a duplicação do `tailwind.config.colors`
 * inline em cada arquivo HTML.
 *
 * Carrega em cada mockup como:
 *   <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
 *   <script src="./_shared/tailwind-config.js"></script>
 */
(function () {
  'use strict';

  /* Helper: gera "rgb(var(--token))" para Tailwind opacity-aware classes.
     Como tokens.css fornece HEX, usamos a versão sem opacity-aware
     (Tailwind aceita `var(--token)` direto em cor sólida). */
  const c = (name) => `var(--color-${name})`;

  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          /* Surface family */
          background: c('background'),
          surface: c('surface'),
          'surface-bright': c('surface-bright'),
          'surface-dim': c('surface-dim'),
          'surface-container-lowest': c('surface-container-lowest'),
          'surface-container-low': c('surface-container-low'),
          'surface-container': c('surface-container'),
          'surface-container-high': c('surface-container-high'),
          'surface-container-highest': c('surface-container-highest'),
          'surface-variant': c('surface-variant'),
          'surface-tint': c('surface-tint'),

          /* On-surface family */
          'on-background': c('on-background'),
          'on-surface': c('on-surface'),
          'on-surface-variant': c('on-surface-variant'),
          outline: c('outline'),
          'outline-variant': c('outline-variant'),

          /* Primary */
          primary: c('primary'),
          'on-primary': c('on-primary'),
          'primary-container': c('primary-container'),
          'on-primary-container': c('on-primary-container'),
          'primary-fixed': c('primary-fixed'),
          'on-primary-fixed': c('on-primary-fixed'),
          'primary-fixed-dim': c('primary-fixed-dim'),
          'on-primary-fixed-variant': c('on-primary-fixed-variant'),

          /* Secondary */
          secondary: c('secondary'),
          'on-secondary': c('on-secondary'),
          'secondary-container': c('secondary-container'),
          'on-secondary-container': c('on-secondary-container'),
          'secondary-fixed': c('secondary-fixed'),
          'on-secondary-fixed': c('on-secondary-fixed'),
          'secondary-fixed-dim': c('secondary-fixed-dim'),
          'on-secondary-fixed-variant': c('on-secondary-fixed-variant'),

          /* Tertiary */
          tertiary: c('tertiary'),
          'on-tertiary': c('on-tertiary'),
          'tertiary-container': c('tertiary-container'),
          'on-tertiary-container': c('on-tertiary-container'),
          'tertiary-fixed': c('tertiary-fixed'),
          'on-tertiary-fixed': c('on-tertiary-fixed'),
          'tertiary-fixed-dim': c('tertiary-fixed-dim'),
          'on-tertiary-fixed-variant': c('on-tertiary-fixed-variant'),

          /* Error */
          error: c('error'),
          'on-error': c('on-error'),
          'error-container': c('error-container'),
          'on-error-container': c('on-error-container'),

          /* Inverse */
          'inverse-surface': c('inverse-surface'),
          'inverse-on-surface': c('inverse-on-surface'),
          'inverse-primary': c('inverse-primary'),
        },
        borderRadius: {
          DEFAULT: '0.25rem',
          lg: '0.5rem',
          xl: '0.75rem',
          '2xl': '1rem',
          full: '9999px',
        },
        spacing: {
          xs: '4px',
          sm: '8px',
          md: '16px',
          lg: '24px',
          xl: '32px',
          xxl: '48px',
          gutter: '16px',
          'margin-mobile': '16px',
          'margin-desktop': '32px',
          'max-width': '1280px',
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        },
        fontSize: {
          'label-sm': ['12px', { lineHeight: '1', fontWeight: '600' }],
          'label-md': ['14px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '500' }],
          'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
          'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
          'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
          'headline-sm': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
          'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
          'headline-lg-mobile': ['24px', { lineHeight: '1.2', fontWeight: '700' }],
          'headline-lg': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        },
        boxShadow: {
          sm: 'var(--shadow-sm)',
          md: 'var(--shadow-md)',
          lg: 'var(--shadow-lg)',
        },
      },
    },
  };
})();
