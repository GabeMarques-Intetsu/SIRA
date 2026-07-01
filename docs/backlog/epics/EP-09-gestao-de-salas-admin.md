# EP-09 — Gestão de Recursos (Salas e Equipamentos) (Admin)

> **Tipo**: Epic
> **Status**: 📝 Proposto
> **Prioridade global**: 🟡 Normal
> **Origem (requisitos)**: [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md), [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md)
> **Origem (OpenProject)**: #27381 · projeto `2026-1-reservaativos-equipe-5`

---

## Visão de produto

Gestão completa dos **recursos reserváveis do campus — salas e equipamentos** — por parte do administrador, reunidos em uma única tela de Recursos com abas. Para **salas**: CRUD completo com seus recursos (datashow, ar-condicionado, lousa interativa, etc.). Para **equipamentos** (projetores, microfones, câmeras, notebooks etc.): CRUD completo com tipo, estado de disponibilidade e vínculo a um bloco ou sala. Em ambos há filtros por estado (ativo/inativo/em manutenção) e busca, além de validação que impede excluir um recurso com reservas futuras. No dia 1 o seed inicial cobre os recursos existentes, mas o CRUD é necessário para evolução.

## Requisitos realizados (rastreabilidade ↑)

| RF                                                                           | Requisito                          | Tipo      |
| ---------------------------------------------------------------------------- | ---------------------------------- | --------- |
| [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md)        | Gestão do catálogo de salas        | Funcional |
| [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md) | Gestão do catálogo de equipamentos | Funcional |

## Features sob este Epic (rastreabilidade ↓)

| ID   | Nome                                          | Status      | Arquivo                                                                   |
| ---- | --------------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| F-24 | Cadastro de nova sala                         | 📝 Proposto | [F-24](../features/F-24-cadastro-de-nova-sala.md)                         |
| F-25 | Listagem de salas com filtros e recursos      | 📝 Proposto | [F-25](../features/F-25-listagem-de-salas-com-filtros-e-recursos.md)      |
| F-26 | Edição de sala                                | 📝 Proposto | [F-26](../features/F-26-edicao-de-sala.md)                                |
| F-27 | Exclusão de sala                              | 📝 Proposto | [F-27](../features/F-27-exclusao-de-sala.md)                              |
| F-43 | Cadastro de novo equipamento                  | 📝 Proposto | [F-43](../features/F-43-cadastro-de-novo-equipamento.md)                  |
| F-44 | Listagem de equipamentos com filtros e estado | 📝 Proposto | [F-44](../features/F-44-listagem-de-equipamentos-com-filtros-e-estado.md) |
| F-45 | Edição de equipamento                         | 📝 Proposto | [F-45](../features/F-45-edicao-de-equipamento.md)                         |
| F-46 | Exclusão de equipamento                       | 📝 Proposto | [F-46](../features/F-46-exclusao-de-equipamento.md)                       |
