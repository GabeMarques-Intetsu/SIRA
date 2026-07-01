/*
 * SIRA — Theme toggle (light/dark) com persistência em localStorage.
 *
 * Carrega em cada mockup como:
 *   <script src="./_shared/theme-toggle.js"></script>
 *
 * Botão de toggle precisa ter o atributo: data-theme-toggle
 *
 * Persistência: chave "sira-theme" em localStorage.
 * Padrão inicial: respeita prefers-color-scheme do SO.
 *
 * Cumpre US-09 do produto SIRA ("tema escuro com persistência").
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'sira-theme';
  const HTML = document.documentElement;

  /* ─── 1. Aplicar tema o mais cedo possível (evita flash FOIT) ──────── */
  function getInitialTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (_) {
      /* localStorage indisponível (ex: privado), seguir para fallback */
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(theme) {
    HTML.classList.remove('light', 'dark');
    HTML.classList.add(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {}
    /* Atualizar ícone + aria-label de todos os toggles na página */
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
      btn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'
      );
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
  }

  /* Aplica IMEDIATAMENTE — antes do DOMContentLoaded — para evitar flash */
  applyTheme(getInitialTheme());

  /* ─── 2. Habilitar transições só depois do tema aplicado ───────────── */
  window.addEventListener('DOMContentLoaded', () => {
    /* O CSS usa `html.theme-ready` para liberar transições suaves
       sem causar flash de transição no carregamento inicial */
    requestAnimationFrame(() => HTML.classList.add('theme-ready'));

    /* ─── 3. Wire-up dos botões de toggle ───────────────────────────── */
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const current = HTML.classList.contains('dark') ? 'dark' : 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    });

    /* ─── 4. Aplica ícone/aria inicial nos toggles ──────────────────── */
    applyTheme(HTML.classList.contains('dark') ? 'dark' : 'light');
  });

  /* ─── 5. Sincroniza entre abas (storage event) ─────────────────────── */
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
      applyTheme(e.newValue);
    }
  });

  /* ─── 6. API global para QA/testes manuais ─────────────────────────── */
  window.SIRA_setTheme = applyTheme;
})();
