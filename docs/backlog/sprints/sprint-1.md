# Sprint 1 — MVP em Vanilla JS + Vite

> **Período**: até 2026-05-07 (entrega `v1.0.0`) · **Meta**: entregar o MVP do SIRA
> (acesso, navegação, calendário, reservas e administração) como **protótipo
> funcional em Vanilla JS (ESM) + Vite + LocalStorage**.
> **Equipe**: 5 desenvolvedores · **Resultado**: **25 / 25 user stories entregues**.

> ℹ️ **Registro histórico.** Esta sprint usou **numeração própria de Features
> (F-01..F-24) e de User Stories (US-01..US-25)**, anterior à migração. O código
> daquela fase está preservado em [`legacy/`](../../../legacy/). O backlog **atual**
> (Sprint 2, Next.js) vive em [`../features/`](../features/) com numeração
> re-derivada. Fonte deste registro: `SIRA-Consolidado-Epics-Features-Membros.pdf`
> (raiz do projeto) + relatórios individuais dos 5 membros.

## Contexto

| Campo        | Valor                                                    |
| ------------ | -------------------------------------------------------- |
| Stack        | Vite 8 + Vanilla JS (ESM) + LocalStorage                 |
| Stakeholders | Coord. Diego Pessoa e Coord. Paulo Ditarso (entrevistas) |
| Épicos       | 13 (EP-01..EP-13)                                        |
| Features     | 24 (F-01..F-24)                                          |
| User Stories | 25 (US-01..US-25)                                        |

## Features na sprint (por épico)

| Épico                                 | Feature                                                          | US           | Status |
| ------------------------------------- | ---------------------------------------------------------------- | ------------ | ------ |
| EP-01 · Fundação Técnica              | F-01 · Scaffold Vite + ESM com deploy para GitHub Pages          | US-01        | ✅     |
| EP-01 · Fundação Técnica              | F-02 · Biblioteca de utilitários funcionais e design system base | US-02        | ✅     |
| EP-02 · Autenticação e Sessão         | F-03 · Login institucional com sessão persistente                | US-03        | ✅     |
| EP-02 · Autenticação e Sessão         | F-04 · Auto-serviço de cadastro de professor                     | US-04        | ✅     |
| EP-02 · Autenticação e Sessão         | F-05 · Encerramento de sessão                                    | US-05        | ✅     |
| EP-03 · Shell, Navegação e Roteamento | F-06 · Navegação contextual por perfil (sidebar + URLs limpas)   | US-06, US-07 | ✅     |
| EP-03 · Shell, Navegação e Roteamento | F-07 · Adaptação responsiva mobile (drawer + tabelas em cards)   | US-08        | ✅     |
| EP-03 · Shell, Navegação e Roteamento | F-08 · Tema claro/escuro persistente                             | US-09        | ✅     |
| EP-04 · Camada de Persistência        | F-09 · Dados isolados por usuário no LocalStorage                | US-10        | ✅     |
| EP-04 · Camada de Persistência        | F-10 · Sincronização aprovação → reserva → notificação           | US-11        | ✅     |
| EP-05 · Dashboard (Admin)             | F-11 · Painel administrativo de KPIs em tempo real               | US-12        | ✅     |
| EP-06 · Calendário (Home)             | F-12 · Grade semanal de reservas (7d × 12h)                      | US-13        | ✅     |
| EP-07 · Nova Reserva                  | F-13 · Busca anti-conflito de salas                              | US-14        | ✅     |
| EP-07 · Nova Reserva                  | F-14 · Reserva express com 1 clique                              | US-15        | ✅     |
| EP-08 · Minhas Reservas (CRUD)        | F-15 · Listagem de reservas pessoais com filtros e busca         | US-16        | ✅     |
| EP-08 · Minhas Reservas (CRUD)        | F-16 · Edição e cancelamento de reservas pendentes               | US-17        | ✅     |
| EP-08 · Minhas Reservas (CRUD)        | F-17 · Exportação de reservas para CSV                           | US-18        | ✅     |
| EP-09 · Fluxo de Aprovações           | F-18 · Fila consolidada de aprovações pendentes                  | US-19        | ✅     |
| EP-09 · Fluxo de Aprovações           | F-19 · Decisão de aprovação com notificação ao autor             | US-20        | ✅     |
| EP-10 · Gestão de Salas (Admin)       | F-20 · CRUD de salas com filtros e recursos                      | US-21        | ✅     |
| EP-11 · Gestão de Usuários (Admin)    | F-21 · CRUD de usuários                                          | US-22        | ✅     |
| EP-11 · Gestão de Usuários (Admin)    | F-22 · Revisão de solicitações de cadastro pendentes             | US-23        | ✅     |
| EP-12 · Notificações                  | F-23 · Caixa de notificações com marcação como lida              | US-24        | ✅     |
| EP-13 · Componentes Reutilizáveis     | F-24 · Sistema de modais centralizado                            | US-25        | ✅     |

## Distribuição por membro

| Membro              | Tema                                          | Features                           | User Stories                     |
| ------------------- | --------------------------------------------- | ---------------------------------- | -------------------------------- |
| **Gabriel Marques** | Fundação + Autenticação + Tema                | F-01, F-02, F-03, F-04, F-05, F-08 | US-01, 02, 03, 04, 05, 09        |
| **Ian Lucas**       | Shell + Navegação + Modais + Calendário       | F-05, F-06, F-07, F-12, F-24       | US-05.T-05.1, 06, 07, 08, 13, 25 |
| **Igor Gimenez**    | Persistência + Dashboard + Notificações       | F-09, F-10, F-11, F-23             | US-10, 11, 12, 24                |
| **José Henrique**   | Reservas (Nova Reserva + CRUD + CSV)          | F-13, F-14, F-15, F-16, F-17       | US-14, 15, 16, 17, 18            |
| **Pedro Sales**     | Administração (Aprovações + Salas + Usuários) | F-18, F-19, F-20, F-21, F-22       | US-19, 20, 21, 22, 23            |

> Snapshot do consolidado em **2026-05-07** (mid-sprint): 15/25 US mergeadas em
> `develop` (F-01..F-14 + F-24) e 10 restantes em branches `feature/*` (F-15..F-23).
> O fechamento da sprint consolidou as **25/25**.

## Retrospectiva

- **O que foi entregue**: o MVP completo do SIRA em Vanilla JS + Vite — acesso
  institucional, shell responsivo com tema persistente, calendário semanal,
  fluxo de nova reserva com anti-conflito, CRUD de reservas pessoais, dashboard
  de KPIs, fila de aprovações, CRUD de salas/usuários e notificações. Persistência
  por usuário em LocalStorage (com consolidação para admin).
- **O que evoluiu para a Sprint 2**: a **migração para Next.js (App Router) +
  TypeScript + Supabase** — trocando LocalStorage por Postgres + RLS (isolamento
  de dados **no banco**, ver [ADR-001](../../planning/adrs/ADR-001-schema-inicial-e-rls-supabase.md)),
  além de novas funcionalidades (imagem de recurso, reserva temporária, MFA, i18n
  preparado). O backlog re-derivado vive em [`../features/`](../features/).
