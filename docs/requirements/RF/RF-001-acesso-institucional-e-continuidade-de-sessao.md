# RF-001 — Acesso institucional e continuidade de sessão

> **Tipo**: Requisito Funcional
> **Prioridade**: 🔴 Imediato
> **Status**: 📝 Proposto

---

## Enunciado de negócio (sem termo técnico)

> **O sistema permite que o professor acesse a plataforma com seu e-mail institucional e senha, mantenha-se conectado entre recargas da página, solicite seu próprio cadastro e encerre a sessão quando desejar.**

## Justificativa

Garante que apenas professores cadastrados acessem o sistema. Inclui login pelo e-mail institucional, persistência de sessão entre recargas (F5), auto-serviço de cadastro de professor (com aprovação posterior do admin) e logout seguro. É o portão de entrada de todos os fluxos do sistema.

## Realizado por (rastreabilidade ↓)

| Epic | Feature(s) | Status |
| --- | --- | --- |
| [EP-01](../../backlog/epics/EP-01-autenticacao-e-sessao.md) | [F-01 Login institucional por e-mail](../../backlog/features/F-01-login-institucional-por-e-mail.md) | 📝 |
| [EP-01](../../backlog/epics/EP-01-autenticacao-e-sessao.md) | [F-02 Persistência de sessão entre recargas](../../backlog/features/F-02-persistencia-de-sessao-entre-recargas.md) | 📝 |
| [EP-01](../../backlog/epics/EP-01-autenticacao-e-sessao.md) | [F-03 Auto-servico de cadastro de professor](../../backlog/features/F-03-auto-servico-de-cadastro-de-professor.md) | 📝 |
| [EP-01](../../backlog/epics/EP-01-autenticacao-e-sessao.md) | [F-04 Encerramento de sessão (logout)](../../backlog/features/F-04-encerramento-de-sessao-logout.md) | 📝 |

## Restrições e fora-de-escopo

- Detalhe verificável de cada capacidade vive nas CAs das Features acima.
