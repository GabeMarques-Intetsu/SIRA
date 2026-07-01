# RF-003 — Isolamento e continuidade dos dados pessoais de reserva

> **Tipo**: Requisito Funcional
> **Prioridade**: 🔴 Imediato
> **Status**: 📝 Proposto

---

## Enunciado de negócio (sem termo técnico)

> **O sistema mantém os dados de cada usuário isolados dos demais no mesmo navegador e propaga automaticamente a aprovação de uma reserva para a agenda e as notificações do solicitante.**

## Justificativa

Camada de armazenamento local responsável por (a) isolar dados de cada usuário no LocalStorage evitando vazamento de informações em PCs compartilhados e (b) manter consistência entre os módulos de aprovação, reserva e notificação via mecanismo de sincronização atômica. Sem esta camada o aplicativo não mantém estado entre sessões.

## Realizado por (rastreabilidade ↓)

| Epic                                                         | Feature(s)                                                                                                                                         | Status |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| [EP-03](../../backlog/epics/EP-03-camada-de-persistencia.md) | [F-10 Isolamento de Segurança e Privacidade de Dados por Usuário](../../backlog/features/F-10-isolamento-de-seguranca-e-privacidade-de-dados-p.md) | 📝     |
| [EP-03](../../backlog/epics/EP-03-camada-de-persistencia.md) | [F-11 Sincronização aprovação -> reserva -> notificacão](../../backlog/features/F-11-sincronizacao-aprovacao-reserva-notificacao.md)               | 📝     |

## Restrições e fora-de-escopo

- Detalhe verificável de cada capacidade vive nas CAs das Features acima.
