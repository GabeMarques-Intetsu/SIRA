# 🎨 Mockups de Referência — SIRA IFPB (v4)

> Protótipos de alta fidelidade em HTML estático, com **dark mode funcional**, **acessibilidade WCAG 2.2 AA** e **estados de UI** (loading, empty, error, hover, active).
>
> **Stack:** Tailwind CSS (CDN) + Material Design 3 (tokens semânticos) + Inter + Material Symbols Outlined.

---

## 📋 Lista de telas (12 mockups + 3 arquivos compartilhados)

| # | Arquivo | Página | Status | Sidebar |
|---|---|---|---|---|
| 01 | [01-login.html](./01-login.html) | Login | ✏️ Refatorada v4 | ❌ N/A |
| 02 | [02-dashboard.html](./02-dashboard.html) | Dashboard (admin) | ✏️ Refatorada v4 | ✅ |
| 03 | [03-calendario.html](./03-calendario.html) | Calendário semanal | ✏️ Refatorada v4 | ✅ |
| 04 | [04-nova-reserva.html](./04-nova-reserva.html) | Nova Reserva (wizard 4 etapas) | ✏️ Refatorada v4 — agora mostra todas as 4 etapas | ✅ |
| 05 | [05-gestao-recursos.html](./05-gestao-recursos.html) | Recursos (Salas / **Equipamentos** com tipo/estado/vínculo) | ✏️ Atualizada P2 — aba Equipamentos real (RF-013 / F-43..46) | ✅ |
| 06 | [06-minhas-reservas.html](./06-minhas-reservas.html) | Minhas Reservas (tabs + filtros + grupos) | ✏️ Refatorada v4 | ✅ |
| **07** | [07-cadastro.html](./07-cadastro.html) | **Solicitar cadastro** (pré-login, US-04) | 🆕 Novo | ❌ N/A |
| **08** | [08-aprovacoes.html](./08-aprovacoes.html) | **Aprovações admin** (US-19/20) | 🆕 Novo | ✅ |
| **09** | [09-usuarios.html](./09-usuarios.html) | **Gestão de usuários** (US-22/23) | 🆕 Novo | ✅ |
| **10** | [10-notificacoes.html](./10-notificacoes.html) | **Notificações** (US-12) | 🆕 Novo | ✅ |
| 11 | [11-configuracoes.html](./11-configuracoes.html) | Configurações + Perfil (+ aba **Integrações** preenchida) | ✏️ Atualizada P2 — Integrações (SSO/LDAP, Google Calendar, Webhooks) | ✅ |
| **12** | [12-detalhe-reserva.html](./12-detalhe-reserva.html) | **Detalhe da reserva** (recurso, horário, status, finalidade, recursos, histórico de aprovação) — F-17 | 🆕 Novo P2 | ✅ |

### Arquivos compartilhados (`_shared/`)

| Arquivo | Função |
|---|---|
| [_shared/tokens.css](./_shared/tokens.css) | Tokens semânticos M3 (light + dark) + Material Symbols + touch-target + focus-visible + skip-link + scrollbar |
| [_shared/tailwind-config.js](./_shared/tailwind-config.js) | Config Tailwind compartilhada (sem duplicação inline) |
| [_shared/theme-toggle.js](./_shared/theme-toggle.js) | Toggle dark/light com persistência localStorage + sync entre abas |

---

## 🌙 Dark mode — implementação

**Toggle funcional em todos os mockups.** Não há arquivos `-dark.html` separados — a mesma tela alterna ao clicar no botão de tema.

### Como funciona

1. **Tokens M3 em CSS custom properties** (`_shared/tokens.css`) — paleta completa light + dark
2. **Tailwind config compartilhada** (`_shared/tailwind-config.js`) — mapeia classes Tailwind (`bg-primary`, `text-on-surface`, etc.) para variáveis CSS, eliminando duplicação inline em cada arquivo
3. **Script de toggle** (`_shared/theme-toggle.js`) — botão `[data-theme-toggle]` no rodapé da sidebar (ou topo, em telas pré-auth) alterna `html.light` ↔ `html.dark`
4. **Persistência via `localStorage`** — chave `sira-theme`. Padrão inicial respeita `prefers-color-scheme` do SO. Sincroniza entre abas via `storage` event.
5. **Sem flash inicial (FOIT)** — script aplica tema antes do render; transições suaves só após `html.theme-ready`.

### Como testar

```bash
# Abra qualquer mockup no navegador
open docs/mockups/02-dashboard.html

# Clique no botão "Tema" (rodapé da sidebar) ou ☀️/🌙 (topo, em login)
# Recarregue (F5) → o tema persiste
# Abra outra aba do mesmo mockup → sincroniza automaticamente
```

Cumpre **US-09** do produto SIRA (citada na apresentação).

---

## ♿ Acessibilidade (WCAG 2.2 AA)

Todos os mockups incluem:

- **Skip link** para o conteúdo principal (`Tab` no início)
- **`aria-current="page"`** na navegação ativa
- **`aria-label`** em todos os botões iconográficos
- **`aria-live`** + `role="alert"` em estados dinâmicos (erros, toasts)
- **`role="img"` + `aria-label`** descritivo em gráficos
- **Touch targets ≥ 44×44px** (classe `.touch-target`)
- **Focus rings visíveis** (regra `:focus-visible` em `tokens.css`)
- **Landmarks semânticos** (`<main>`, `<nav>`, `<aside>`, `<header>`)
- **Contraste mínimo 4.5:1** (validação manual nos tokens M3)
- **Autocomplete corretos** nos forms (`username`, `current-password`, `name`, `email`)
- **Suporte a `prefers-reduced-motion`** (toggle em `11-configuracoes.html`)

---

## 🎯 Estados de UI cobertos

Antes da v4, apenas o caminho feliz era renderizado. Agora cada tela tem:

- **Loading** (no skeleton, mas estrutura prevista)
- **Empty state** — exemplo: `08-aprovacoes.html` tem `data-state="empty"` (variant hidden)
- **Error state** — exemplo: `01-login.html` e `07-cadastro.html` renderizam `role="alert"`
- **Hover / active / focus** em todos os botões
- **Disabled** — botão "Anterior" de paginação em `06`, `09`
- **Pendente / Aprovada / Recusada / Cancelada** — todos os badges de status presentes

---

## 🗺️ Sidebar canônica (6 itens principais + 3 footer)

Idêntica em **todos os mockups com sidebar** (02-06, 08-11). Itens com `aria-current="page"` destacam a tela ativa.

```
┌─────────────────────────┐
│ ◆ SIRA                  │  ← Branding
│                         │
│ + Nova Reserva          │  ← CTA principal
│                         │
│ ◯ Dashboard             │  ← Item navegação
│ ◯ Calendário            │
│ ◯ Minhas Reservas       │
│ ◯ Aprovações       ●7   │  ← Badge dinâmico
│ ◯ Recursos              │
│ ◯ Usuários              │
│ ─────────────────────── │
│ ☀ Tema                  │  ← Toggle dark mode
│ ⚙ Configurações         │
│ ↪ Sair                  │
└─────────────────────────┘
```

---

## 🧭 Princípios aplicados (skills locais Interpop)

### Dashboard (`02-dashboard.html`) — classificado como **Klipfolio (negócio)**

Conforme [`referencias-dashboards`](~/.claude/skills/referencias-dashboards/SKILL.md):
- ✅ Paleta ≤ 3 cores principais (primary azul + secondary verde + tertiary marrom; error como status)
- ✅ Cartões com `rounded-xl` (suave, não pill, não sharp)
- ✅ Filtros sempre visíveis no topo (não em modal)
- ✅ Hierarquia vertical: 4 KPIs agregados no topo → drill-down (ocupação semanal + próximas) → atividade recente
- ✅ Densidade moderada (Klipfolio, não Power BI)

### Demais telas

Conforme [`ecossistemas-ui-ux`](~/.claude/skills/ecossistemas-ui-ux/SKILL.md):
- ✅ Material Design 3 como design system base
- ✅ Inspirações: Notion/Linear (sidebar + topbar), Google Calendar (grade semanal), Mobbin (padrões reais)
- ✅ Validação cruzada: WCAG 2.2 AA + Apple HIG (touch targets 44px) + tokens M3

---

## 🔄 O que mudou na v4 (changelog)

### Refactor (6 mockups existentes)

- ✏️ Extraído `tailwind.config` inline (~70 linhas/arquivo) para `_shared/tailwind-config.js` — DRY
- ✏️ Paleta migrada para CSS custom properties (`_shared/tokens.css`) — habilita dark mode real
- ✏️ Adicionado toggle dark mode funcional em todos
- ✏️ Adicionado skip link, `aria-current`, `aria-label` em ícones, `aria-live` em estados dinâmicos
- ✏️ Touch targets padronizados ≥44px (classe `.touch-target`)
- ✏️ `04-nova-reserva` agora mostra **todas as 4 etapas** do wizard num único showroom (steps 1 ✓, 2 atual, 3-4 preview)
- ✏️ Substituída ilustração de login externa por SVG inline (offline-ready)
- ✏️ Sidebar canônica com badge dinâmico em "Aprovações"

### Novas (5 mockups inéditos)

- 🆕 **07-cadastro.html** — fluxo "Solicitar acesso" (pré-login)
- 🆕 **08-aprovacoes.html** — admin aprova/recusa reservas com sinalizador de conflito
- 🆕 **09-usuarios.html** — tabela de usuários + tabs "Ativos / Solicitações / Inativos"
- 🆕 **10-notificacoes.html** — lista cronológica agrupada (Hoje / Ontem / Esta semana) + filtros chip
- 🆕 **11-configuracoes.html** — Perfil + Preferências (tema, idioma, densidade) + Segurança + Notificações + Zona de risco

### Compartilhados (3 arquivos novos)

- 🆕 `_shared/tokens.css` — paleta M3 light/dark + a11y utilities
- 🆕 `_shared/theme-toggle.js` — toggle + persist + sync
- 🆕 `_shared/tailwind-config.js` — config compartilhada DRY

---

## 🧪 Como validar localmente

```bash
# 1. Servir os mockups (qualquer servidor estático)
cd docs/mockups
python3 -m http.server 8080
# OU
npx serve

# 2. Abrir no navegador
open http://localhost:8080/02-dashboard.html

# 3. Auditoria Lighthouse (Chrome DevTools)
#    Performance + A11y + SEO + Best Practices
#    Meta: ≥90 em todas as categorias

# 4. WAVE
#    Extensão Chrome wave.webaim.org
#    Verificar: contraste, landmarks, heading order, labels

# 5. Teste de teclado
#    Apenas Tab + Shift+Tab + Enter + Esc + arrow keys
#    Cada interação deve ser acessível
```

---

## 🔗 Cobertura das User Stories implementadas

| US implementada (sprint 1) | Mockup correspondente |
|---|---|
| US-03 Login | `01-login.html` |
| US-04 Cadastro auto-serviço | `07-cadastro.html` 🆕 |
| US-05 Roles diferentes | sidebar com badge condicional |
| US-08 Drawer mobile | `<button class="md:hidden">` em todos |
| US-09 Tema escuro persistente | `_shared/theme-toggle.js` 🆕 |
| US-12 Notificações | `10-notificacoes.html` 🆕 + badge no topbar |
| US-13 Calendário semanal | `03-calendario.html` |
| US-14 / US-15 Nova reserva c/ recorrência | `04-nova-reserva.html` (wizard) |
| US-16 / US-17 / US-18 Minhas reservas | `06-minhas-reservas.html` |
| F-17 Detalhe de uma reserva (RF-007) | `12-detalhe-reserva.html` 🆕 |
| RF-013 Catálogo de equipamentos (F-43..46) | `05-gestao-recursos.html` (aba Equipamentos) |
| US-19 / US-20 Aprovações | `08-aprovacoes.html` 🆕 |
| US-21 Salas e Espaços | `05-gestao-recursos.html` (tab Salas) |
| US-22 / US-23 Usuários + Solicitações | `09-usuarios.html` 🆕 |
| US-24 KPIs Dashboard | `02-dashboard.html` (4 KPIs no topo) |

**Cobertura: 100% das US visíveis em mockup de referência.**

---

_Versão 4 · Junho/2025 · Refactor profundo + dark mode + 5 novas telas + tokens compartilhados_
