# EP-03 — Camada de Persistência

> **Tipo**: Epic
> **Status**: 📝 Proposto
> **Prioridade global**: 🔴 Imediato
> **Origem (requisitos)**: [RF-003](../../requirements/RF/RF-003-isolamento-e-continuidade-dos-dados-pessoais-de-.md)
> **Origem (OpenProject)**: #27357 · projeto `2026-1-reservaativos-equipe-5`

---

## Visão de produto

Camada de armazenamento local responsável por (a) isolar dados de cada usuário no LocalStorage evitando vazamento de informações em PCs compartilhados e (b) manter consistência entre os módulos de aprovação, reserva e notificação via mecanismo de sincronização atômica. Sem esta camada o aplicativo não mantém estado entre sessões.

## Requisitos realizados (rastreabilidade ↑)

| RF | Requisito | Tipo |
| --- | --- | --- |
| [RF-003](../../requirements/RF/RF-003-isolamento-e-continuidade-dos-dados-pessoais-de-.md) | Isolamento e continuidade dos dados pessoais de reserva | Funcional |

## Features sob este Epic (rastreabilidade ↓)

| ID | Nome | Status | Arquivo |
| --- | --- | --- | --- |
| F-10 | Isolamento de Segurança e Privacidade de Dados por Usuário | 📝 Proposto | [F-10](../features/F-10-isolamento-de-seguranca-e-privacidade-de-dados-p.md) |
| F-11 | Sincronização aprovação -> reserva -> notificacão | 📝 Proposto | [F-11](../features/F-11-sincronizacao-aprovacao-reserva-notificacao.md) |
