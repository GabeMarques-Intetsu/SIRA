# PRD — SIRA (Sistema de Reserva de Salas e Equipamentos)

> **Product Requirements Document** · IFPB · disciplinas de Programação para Web 2 e
> Engenharia de Requisitos de Software.
> Documento síntese: consolida o **porquê**, o **quê** e o **estado real** do produto,
> apontando para as fontes de verdade detalhadas (`docs/requirements/`, `docs/backlog/`,
> `docs/planning/adrs/`, `docs/specs/` e o código em `src/`).

| Campo                            | Valor                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Produto                          | SIRA — reserva de salas e equipamentos do campus                                                          |
| Status                           | ✅ **Em produção na Vercel** — <https://sira-jet.vercel.app> (Sprint 2 · Next.js + Supabase)              |
| Stack                            | Next.js 16 (App Router) · TypeScript · Tailwind v4 (Material Design 3) · Supabase (Postgres + RLS + RPCs) |
| Perfis                           | `professor`, `admin` (coordenação)                                                                        |
| Última conferência de requisitos | 2026-07-01                                                                                                |

---

## 1. Visão e problema

No campus, a reserva de salas e equipamentos depende de processos informais (mensagens,
planilhas, mural), o que gera **conflitos de horário**, falta de rastreabilidade de quem
reservou o quê e ausência de um fluxo claro de aprovação. Não há uma visão consolidada da
ocupação nem um canal único para o professor solicitar e acompanhar suas reservas.

O **SIRA** centraliza esse fluxo numa aplicação web: o professor solicita reservas com
checagem automática de disponibilidade, o administrador aprova ou recusa em uma fila única,
e o solicitante é notificado da decisão. O isolamento dos dados pessoais é garantido **no
banco** (Row-Level Security), não na aplicação — requisito que motivou a migração do
protótipo legado (LocalStorage) para Supabase/Postgres (ver [ADR-001](docs/planning/adrs/ADR-001-schema-inicial-e-rls-supabase.md)).

## 2. Objetivos

| #   | Objetivo                                                                                  | Requisito raiz                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O1  | Permitir que professores solicitem reservas vendo apenas recursos sem conflito de horário | [RF-006](docs/requirements/RF/RF-006-solicitacao-de-reserva-com-checagem-de-disponibi.md)                                                                                                                                                 |
| O2  | Dar ao administrador uma fila única para aprovar/recusar, notificando o autor             | [RF-008](docs/requirements/RF/RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md)                                                                                                                                                    |
| O3  | Garantir isolamento de dados por usuário **no banco** (0 vazamentos entre contas)         | [RF-003](docs/requirements/RF/RF-003-isolamento-e-continuidade-dos-dados-pessoais-de-.md), [RNF-segurança](docs/requirements/RNF/RNF-seguranca-privacidade.md)                                                                            |
| O4  | Oferecer uma visão semanal de ocupação para enxergar conflitos rapidamente                | [RF-005](docs/requirements/RF/RF-005-visualizacao-semanal-das-reservas.md)                                                                                                                                                                |
| O5  | Manter o catálogo de salas, equipamentos e usuários sob gestão do administrador           | [RF-009](docs/requirements/RF/RF-009-gestao-do-catalogo-de-salas.md), [RF-010](docs/requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md), [RF-013](docs/requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md) |
| O6  | Entregar uma interface acessível (WCAG 2.2 AA), responsável e consistente (M3)            | RNFs de acessibilidade, responsividade e design system                                                                                                                                                                                    |

## 3. Personas

Derivadas dos papéis reais de autorização do sistema (`user_role`: `professor`, `admin`).

### P-01 — Professor

- **Quem**: docente do campus com e-mail institucional `@ifpb.edu.br`.
- **Objetivo**: reservar salas/equipamentos para suas aulas e atividades, sem conflito.
- **Comportamento típico**: busca um recurso por data/horário/recursos, solicita a reserva,
  acompanha a decisão pelas notificações e gerencia suas próprias reservas.
- **Permissões**: vê e gere **apenas** os próprios dados (reservas, perfil, preferências,
  notificações). RLS garante isso no banco.
- **Tela inicial**: `/calendario`.

### P-02 — Administrador / Coordenador

- **Quem**: coordenação responsável pela gestão dos recursos do campus.
- **Objetivo**: decidir solicitações de reserva, manter os catálogos e administrar usuários.
- **Comportamento típico**: revisa a fila de aprovações, aprova/recusa com justificativa,
  cadastra/edita salas, equipamentos e usuários, e acompanha indicadores no painel.
- **Permissões**: enxerga e gere tudo (predicado `is_admin()` nas policies RLS). O admin
  **também reserva**, mas **não pode avaliar a própria solicitação** (segregação de funções,
  imposta no servidor).
- **Tela inicial**: `/painel`.

> Detalhe canônico de personas: [`docs/requirements/personas-e-cenarios.md`](docs/requirements/personas-e-cenarios.md).

## 4. Escopo

### Dentro do MVP (implementado)

- Acesso institucional (login por e-mail `@ifpb.edu.br`), auto-serviço de cadastro de
  professor com aprovação posterior, sessão persistente e logout.
- Navegação contextual por perfil (sidebar filtrada), URLs limpas (App Router), drawer
  mobile e tema claro/escuro persistente.
- Solicitação de reserva com checagem de disponibilidade (sala ou equipamento) e detecção
  de conflito **no banco** (RPCs).
- Gestão das próprias reservas (listar, filtrar, buscar, ver, editar e cancelar pendentes,
  exportar CSV).
- Fila de aprovações com aprovação/recusa (justificativa obrigatória na recusa) e
  notificação automática ao autor.
- Catálogos de salas e equipamentos (CRUD admin) e gestão de usuários + solicitações de
  cadastro.
- Central de notificações (lista + marcar como lida individual/em massa).
- Configurações da conta (perfil, preferências, segurança, notificações, zona de risco).
- **Verificação em duas etapas (2FA/TOTP) com exigência no acesso (AAL2)** — após a
  senha, contas com 2FA ativo passam pela tela `/verificar-2fa` (F-39 / ADR-010).
- **Imagem de recurso** (salas/equipamentos) via Supabase Storage e **reserva
  temporária (hold)** que bloqueia o recurso durante a solicitação (F-47/F-48/F-49).

### Fora do MVP (preparado, não plenamente operante)

Registrado de forma rastreável em [ADR-007](docs/planning/adrs/ADR-007-funcionalidades-dependentes-de-infra-externa.md) —
cada item tem o estado persistido e o caminho de habilitação documentado:

| Item                                 | Estado hoje                                   | Depende de           |
| ------------------------------------ | --------------------------------------------- | -------------------- |
| Envio de e-mails de senha (recovery) | `action_link` gerado e repassado manualmente  | SMTP no Supabase     |
| Revisão/revogação de sessões         | não implementado                              | Admin API de sessões |
| Upload de foto de perfil             | não implementado                              | Supabase Storage     |
| Internacionalização (en/es)          | `language` persiste; sem troca real de textos | catálogo i18n        |
| Painel em "tempo real" verdadeiro    | re-fetch por navegação                        | Supabase Realtime    |

## 5. Requisitos funcionais

Resumo dos RF (fonte: [`docs/requirements/RF/`](docs/requirements/RF/)). Cada RF é
realizado por um Epic e suas Features no [backlog](docs/backlog/).

| RF                                                                                        | Necessidade                                                             | Prioridade  |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------- |
| [RF-001](docs/requirements/RF/RF-001-acesso-institucional-e-continuidade-de-sessao.md)    | Acesso institucional, sessão persistente, auto-cadastro e logout        | 🔴 Imediato |
| [RF-002](docs/requirements/RF/RF-002-navegacao-contextual-por-perfil-e-adaptacao-ao-d.md) | Navegação por perfil, URLs limpas, mobile e tema persistente            | 🟠 Alta     |
| [RF-003](docs/requirements/RF/RF-003-isolamento-e-continuidade-dos-dados-pessoais-de-.md) | Isolamento dos dados pessoais e propagação aprovação→agenda→notificação | 🔴 Imediato |
| [RF-004](docs/requirements/RF/RF-004-painel-administrativo-de-indicadores-em-tempo-re.md) | Painel administrativo de indicadores                                    | 🟢 Baixa    |
| [RF-005](docs/requirements/RF/RF-005-visualizacao-semanal-das-reservas.md)                | Grade semanal de reservas (7d × 12h)                                    | 🟡 Normal   |
| [RF-006](docs/requirements/RF/RF-006-solicitacao-de-reserva-com-checagem-de-disponibi.md) | Solicitação de reserva com checagem de disponibilidade                  | 🟠 Alta     |
| [RF-007](docs/requirements/RF/RF-007-gestao-das-proprias-reservas.md)                     | Gestão das próprias reservas (CRUD + filtros + CSV)                     | 🟠 Alta     |
| [RF-008](docs/requirements/RF/RF-008-aprovacao-e-recusa-de-solicitacoes-de-reserva.md)    | Aprovação e recusa de solicitações de reserva                           | 🟠 Alta     |
| [RF-009](docs/requirements/RF/RF-009-gestao-do-catalogo-de-salas.md)                      | Gestão do catálogo de salas                                             | 🟡 Normal   |
| [RF-010](docs/requirements/RF/RF-010-gestao-de-usuarios-e-solicitacoes-de-cadastro.md)    | Gestão de usuários e solicitações de cadastro                           | 🟠 Alta     |
| [RF-011](docs/requirements/RF/RF-011-central-de-notificacoes-do-usuario.md)               | Central de notificações                                                 | 🟠 Alta     |
| [RF-012](docs/requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md)            | Configurações da conta e preferências                                   | 🟠 Alta     |
| [RF-013](docs/requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md)               | Gestão do catálogo de equipamentos                                      | 🟡 Normal   |

## 6. Requisitos não-funcionais

Fonte: [`docs/requirements/RNF/`](docs/requirements/RNF/) — todos com métricas quantitativas.

- **Segurança e privacidade ([RNF-segurança](docs/requirements/RNF/RNF-seguranca-privacidade.md), 🔴):**
  isolamento por usuário com **0 vazamentos** entre contas. No SIRA atual isso é garantido por
  **RLS habilitado em todas as tabelas** + função `is_admin()` como predicado de admin
  ([ADR-001](docs/planning/adrs/ADR-001-schema-inicial-e-rls-supabase.md)). Operações
  privilegiadas (criar/excluir conta, redefinir senha) usam um cliente **service-role
  server-only** que nunca chega ao browser
  ([ADR-002](docs/planning/adrs/ADR-002-provisionamento-de-contas-via-service-role.md)).
  Alinhamento **LGPD**: minimização, isolamento, portabilidade (exportar dados) e eliminação
  (excluir conta) na tela de Configurações.
- **Acessibilidade ([RNF-acessibilidade](docs/requirements/RNF/RNF-acessibilidade.md), WCAG 2.2 AA):**
  contraste ≥ 4.5:1 (texto normal), navegação 100% por teclado, foco visível, alvos de toque
  ≥ 44×44 px, respeito a `prefers-reduced-motion`, **0 violações axe críticas/sérias**.
  Verificado por `npm run test:a11y` (Playwright + axe-core).
- **Desempenho ([RNF-desempenho](docs/requirements/RNF/RNF-desempenho.md)):** paginação/virtualização
  a partir de 50 itens; deploy ≤ 5 min; detecção de conflito imediata.
- **Design system M3 ([RNF-design-system](docs/requirements/RNF/RNF-design-system-m3.md)):**
  0 cores fora dos tokens, 100% das telas em claro e escuro, escala tipográfica M3.
- **Tema persistente ([RNF-tema](docs/requirements/RNF/RNF-tema-persistente.md)):** 0 FOUC,
  aplicação antes do primeiro paint, persistência entre recargas e por usuário.
- **Responsividade ([RNF-responsividade](docs/requirements/RNF/RNF-responsividade-mobile.md)):**
  drawer no celular, tabelas viram cards.
- **Internacionalização ([RNF-i18n](docs/requirements/RNF/RNF-internacionalizacao.md)):** pt-BR
  hoje; en/es preparados (ver ADR-007).
- **Imagem de recurso ([RNF-imagem](docs/requirements/RNF/RNF-imagem-de-recurso.md)):** formatos
  JPG/PNG/WebP até 2 MB, validados no client e no servidor (ver [ADR-008](docs/planning/adrs/ADR-008-armazenamento-de-imagens-de-recursos.md)).
- **Reserva temporária ([RNF-reserva-temporária](docs/requirements/RNF/RNF-reserva-temporaria.md)):**
  bloqueio do recurso durante a solicitação com expiração em 10 min; 0 reservas simultâneas no mesmo
  horário (ver [ADR-009](docs/planning/adrs/ADR-009-mecanismo-de-reserva-temporaria-hold.md)).

## 7. Telas e funcionalidades implementadas

Mapeamento das rotas reais (`src/app/(app)/`) por perfil. Detalhe navegável por tela em
[`docs/specs/`](docs/specs/).

| #   | Tela / rota                               | Perfil            | Função                                                                                                                         | Spec                                                           |
| --- | ----------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| 1   | `/login`, `/cadastro`, `/redefinir-senha` | público           | Acesso institucional, auto-cadastro, recuperação de senha                                                                      | [docs/specs/autenticacao.md](docs/specs/autenticacao.md)       |
| 2   | `/calendario`                             | professor + admin | Grade semanal 7d × 12h com eventos por status                                                                                  | [docs/specs/calendario.md](docs/specs/calendario.md)           |
| 3   | `/nova-reserva`                           | professor + admin | Wizard de busca e solicitação de reserva (sala/equipamento) com **reserva temporária** do recurso durante a solicitação (F-49) | [docs/specs/nova-reserva.md](docs/specs/nova-reserva.md)       |
| 4   | `/minhas-reservas` (+ `/[id]`)            | professor + admin | CRUD das próprias reservas + filtros + CSV                                                                                     | [docs/specs/minhas-reservas.md](docs/specs/minhas-reservas.md) |
| 5   | `/notificacoes`                           | professor + admin | Central de notificações com marcação como lida                                                                                 | [docs/specs/notificacoes.md](docs/specs/notificacoes.md)       |
| 6   | `/painel`                                 | admin             | Indicadores operacionais (KPIs)                                                                                                | [docs/specs/painel.md](docs/specs/painel.md)                   |
| 7   | `/aprovacoes`                             | admin             | Fila de aprovações + aprovar/recusar                                                                                           | [docs/specs/aprovacoes.md](docs/specs/aprovacoes.md)           |
| 8   | `/salas`, `/equipamentos`                 | admin             | CRUD de salas e equipamentos (Recursos), com **imagem** do recurso (F-47/F-48)                                                 | [docs/specs/recursos.md](docs/specs/recursos.md)               |
| 9   | `/usuarios`                               | admin             | CRUD de usuários + aprovação de cadastros                                                                                      | [docs/specs/usuarios.md](docs/specs/usuarios.md)               |
| —   | `/configuracoes`                          | professor + admin | Perfil, preferências, segurança, notificações, zona de risco                                                                   | [docs/specs/configuracoes.md](docs/specs/configuracoes.md)     |

> O admin também acessa Calendário, Nova Reserva, Minhas Reservas e Notificações (ele também
> reserva); por isso a contagem de "9 telas" considera os agrupamentos do menu — auth,
> calendário, nova-reserva, minhas-reservas, notificações, painel, aprovações, recursos
> (salas+equipamentos), usuários — somada à tela transversal de configurações.

## 8. Métricas de sucesso

| Métrica                                      | Alvo                                        | Origem               |
| -------------------------------------------- | ------------------------------------------- | -------------------- |
| Vazamento de dados entre usuários            | 0 ocorrências                               | RNF-segurança        |
| Conflito de horário em reservas aprovadas    | 0 (bloqueado por RPC + guarda anti-corrida) | RF-006 / RF-008      |
| Violações axe críticas/sérias por tela       | 0                                           | RNF-acessibilidade   |
| Contraste mínimo de texto                    | ≥ 4.5:1                                     | RNF-acessibilidade   |
| Cobertura de tema (claro + escuro)           | 100% das telas                              | RNF-design-system    |
| Notificação ao autor após decisão de reserva | 100% das decisões                           | RF-008 / F-22 / F-23 |
| Tempo de deploy                              | ≤ 5 min                                     | RNF-desempenho       |

## 9. Roadmap e itens fora do MVP

A base do produto (acesso, reserva, aprovação, catálogos, notificações, configurações) está
implementada sobre Next.js + Supabase. A evolução prevista concentra-se na **habilitação de
infraestrutura externa**, já preparada no código e rastreada em
[ADR-007](docs/planning/adrs/ADR-007-funcionalidades-dependentes-de-infra-externa.md):

1. **SMTP** → e-mails de recuperação de senha automáticos.
2. **MFA/TOTP** → segunda etapa de verificação (flag já persistida).
3. **Sessões** → revisão e revogação de sessões abertas via Admin API.
4. **Storage** → upload de foto de perfil.
5. **i18n** → catálogo de mensagens en/es (preferência `language` já persiste).
6. **Realtime** → painel verdadeiramente em tempo real (hoje re-fetch por navegação).

Decisões de produto adjacentes registradas em ADR: o estado "Concluída" é **derivado em
runtime** (não há valor no enum — [ADR-006](docs/planning/adrs/ADR-006-status-concluida-ausente-do-enum-reservation-status.md)).

---

## Rastreabilidade

Este PRD é uma camada de síntese. As fontes de verdade são:

- **Porquê / o quê** → [`docs/requirements/`](docs/requirements/) (RF, RNF, personas)
- **Quem faz o quê, quando** → [`docs/backlog/`](docs/backlog/) (Epics, Features, US, CA, BDD, Tasks)
- **Como (decisões)** → [`docs/planning/adrs/`](docs/planning/adrs/) (ADR-001..007)
- **Como (projeto por tela)** → [`docs/specs/`](docs/specs/)
- **Convenções de implementação** → [`AGENTS.md`](AGENTS.md)
  </content>
  </invoke>
