// [Apresentação] Importação dos estilos globais e componentes de UI
import './style.css';
import './home.css';
import './auth.css';

import { el, render } from './utils/dom.js';
import { createSidebar } from './components/sidebar.js';
import { initModalListeners } from './components/modal.js';

// [Apresentação] Importação modular das páginas (View Layer)
import { renderDashboard } from './modules/dashboard.js';
import { renderCalendar } from './modules/calendar.js';
import { renderReservations } from './modules/reservations.js';
import { renderApprovals } from './modules/approvals.js';
import { renderRooms } from './modules/rooms.js';
import { renderUsers } from './modules/users.js';
import { renderNotifications } from './modules/notifications.js';
import { renderNovaReserva } from './modules/novaReserva.js';

import { tryRestoreSession, login, CURRENT_USER } from './data/store.js';

// [Apresentação] Roteador Funcional (Dispatcher)
const PAGE_RENDERERS = {
  dashboard: renderDashboard,
  calendario: renderCalendar,
  reservas: renderReservations,
  aprovacoes: renderApprovals,
  salas: renderRooms,
  usuarios: renderUsers,
  notificacoes: renderNotifications,
  novaReserva: renderNovaReserva,
};

// ── Funções de Autenticação ──
function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  const loginBox = el(
    'div',
    {
      class: 'login-container',
      style: { padding: '40px', textAlign: 'center' },
    },
    el('h1', {}, 'SIRA - Login'),
    el('input', { id: 'emailInput', placeholder: 'Email' }),
    el(
      'button',
      {
        onClick: () => {
          const email = document.getElementById('emailInput').value;
          if (login(email)) location.reload();
          else alert('Usuário não encontrado.');
        },
      },
      'Entrar',
    ),
    el('button', { onClick: () => renderSignup() }, 'Cadastrar-se'),
  );
  app.appendChild(loginBox);
}

function renderSignup() {
  const app = document.getElementById('app');
  app.innerHTML =
    '<h1>Tela de Cadastro</h1><button onclick="location.reload()">Voltar</button>';
}

function bootstrap() {
  tryRestoreSession();

  if (!CURRENT_USER) {
    renderLogin();
    return;
  }

  const app = document.getElementById('app');
  app.innerHTML = '';

  const shell = el('div', { class: 'sira-shell' });
  const sidebarContainer = document.createElement('div');
  const main = el('div', { class: 'main' });

  const pageContainer = el('div', {
    class: 'page active',
    style: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      overflow: 'hidden',
    },
  });

  main.appendChild(pageContainer);

  // ── T-08.2: OVERLAY DE FECHAMENTO (Parte 1: Criação) ──
  // [Apresentação] Criamos um elemento de fundo que escurece a tela no mobile.
  // Ao clicar nele, removemos a classe 'open' tanto da sidebar quanto do próprio overlay.
  const overlay = el('div', { class: 'sidebar-overlay' });
  overlay.addEventListener('click', () => {
    sidebarContainer.querySelector('.sidebar')?.classList.remove('open');
    overlay.classList.remove('open');
  });
  document.body.appendChild(overlay);

  function navigate(pageName) {
    if (!CURRENT_USER) return;

    const isAdmin = CURRENT_USER.role === 'admin';
    const allowedForUser = ['reservas', 'calendario', 'novaReserva'];

    if (!isAdmin && !allowedForUser.includes(pageName)) {
      pageName = 'calendario';
    }

    const renderer = PAGE_RENDERERS[pageName];
    if (!renderer) return;

    if (window.location.pathname !== `/${pageName}`) {
      window.history.pushState({}, '', `/${pageName}`);
    }

    pageContainer.innerHTML = '';
    renderer(pageContainer);
  }

  // ── T-08.1 e T-08.2: BOTÃO HAMBÚRGUER E ABERTURA DO OVERLAY ──
  const topbarObserver = new MutationObserver(() => {
    const topbar = pageContainer.querySelector('.topbar');
    if (topbar && !topbar.querySelector('.hamburger')) {
      const hbtn = el(
        'button',
        {
          class: 'hamburger',
          onClick: () => {
            sidebarContainer.querySelector('.sidebar')?.classList.add('open');
            // T-08.2: Faz o overlay aparecer quando o menu abre
            overlay.classList.add('open');
          },
        },
        el('span', {}),
      );
      topbar.prepend(hbtn);
    }
  });
  topbarObserver.observe(pageContainer, { childList: true, subtree: true });

  createSidebar(sidebarContainer, CURRENT_USER, navigate, () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('sira-theme', isDark ? 'dark' : 'light');
  });

  shell.appendChild(sidebarContainer);
  shell.appendChild(main);
  app.appendChild(shell);

  initModalListeners();

  window.addEventListener('popstate', () => {
    let path = window.location.pathname.replace(/^\//, '');
    if (!path || !PAGE_RENDERERS[path]) path = 'calendario';
    navigate(path);
  });

  let initialPage = window.location.pathname.replace(/^\//, '');
  if (!PAGE_RENDERERS[initialPage]) initialPage = 'calendario';

  navigate(initialPage);
}

bootstrap();
