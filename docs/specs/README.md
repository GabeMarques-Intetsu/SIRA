# specs/ — Camada navegável de análise e projeto do SIRA

> Esta pasta é a **visão por tela/funcionalidade** do SIRA: um índice navegável
> que conecta o **requisito** (o _quê_), a **feature de backlog** (o _quê/quando_)
> e o **código** que implementa (o _como_). Não duplica o backlog — **rastreia**.
>
> - O **porquê / o quê** canônico vive em [`../docs/requirements/`](../requirements/) (RF/RNF).
> - O **quê/quando** detalhado (CA, US, BDD, Task) vive em [`../docs/backlog/`](../backlog/).
> - As **decisões** vivem em [`../docs/planning/adrs/`](../planning/adrs/) (ADR-001..007).
> - As **convenções de desenvolvimento** vivem em [`../AGENTS.md`](../../AGENTS.md).
> - O **produto** vive em [`../PRD.md`](../../PRD.md).

## Como ler uma spec

Cada arquivo de tela traz, na ordem:

1. **Rastreabilidade** — RF de origem, Feature(s), código que implementa, `.feature` de teste.
2. **User Stories** — "Como… quero… para…".
3. **Critérios de Aceitação** — regras testáveis.
4. **Cenário(s) BDD** em Gherkin pt-BR (extraídos de `docs/backlog/` e `tests/features/`).
5. **Diagrama Mermaid** de fluxo, quando esclarece o comportamento.

## Índice de specs

| Spec                                    | Tela / funcionalidade                     | RF             | Features               | Código (entrada)                                        |
| --------------------------------------- | ----------------------------------------- | -------------- | ---------------------- | ------------------------------------------------------- |
| [autenticacao](./autenticacao.md)       | Login, cadastro, logout, sessão           | RF-001         | F-01..F-04             | `src/app/(auth)/`, `src/lib/auth.ts`                    |
| [calendario](./calendario.md)           | Grade semanal 7d × 12h                    | RF-005         | F-13                   | `src/app/(app)/calendario/`                             |
| [nova-reserva](./nova-reserva.md)       | Assistente de reserva + conflito          | RF-006         | F-14, F-15             | `src/app/(app)/nova-reserva/`                           |
| [minhas-reservas](./minhas-reservas.md) | Lista, detalhe, edição, cancelamento, CSV | RF-007         | F-16..F-20             | `src/app/(app)/minhas-reservas/`                        |
| [notificacoes](./notificacoes.md)       | Central de notificações                   | RF-011         | F-34..F-36             | `src/app/(app)/notificacoes/`                           |
| [painel](./painel.md)                   | KPIs administrativos                      | RF-004         | F-12                   | `src/app/(app)/painel/`                                 |
| [aprovacoes](./aprovacoes.md)           | Fila de aprovação/recusa                  | RF-008         | F-21..F-23             | `src/app/(app)/aprovacoes/`                             |
| [recursos](./recursos.md)               | Salas e equipamentos (CRUD)               | RF-009, RF-013 | F-24..F-27, F-43..F-46 | `src/app/(app)/salas/`, `/equipamentos/`, `_resources/` |
| [usuarios](./usuarios.md)               | Usuários + solicitações de cadastro       | RF-010         | F-28..F-33             | `src/app/(app)/usuarios/`                               |
| [configuracoes](./configuracoes.md)     | Perfil, preferências, segurança, conta    | RF-012         | F-37..F-42             | `src/app/(app)/configuracoes/`                          |

Transversais ao app: navegação por perfil e responsividade (RF-002 / F-05..F-09)
e isolamento de dados (RF-003 / F-10) estão descritos em
[`arquitetura.md`](./arquitetura.md) e detalhados no backlog.

## Visão de arquitetura

Para o panorama de componentes, o fluxo de autenticação e o fluxo de aprovação
de reserva (com diagramas Mermaid), ver [`arquitetura.md`](./arquitetura.md).
