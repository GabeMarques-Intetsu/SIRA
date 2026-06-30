# EP — Atividades Complementares (_Complementary Activities_)

> **Tipo**: Epic (root, **obrigatório**) · **Status**: 🚧 Em andamento (contínuo)
> **Prioridade global**: 🟠 Alta
> **Papel**: front-irmão dos Epics de funcionalidade (não tem Epic-pai)

---

## Visão de produto

Casa de todo trabalho **técnico, de configuração e de infraestrutura que NÃO está ligado diretamente a uma Feature ou User Story** e que, por isso (Regra 4 de [`05-convencoes-interpop.md`](../../../references/05-convencoes-interpop.md)), é uma **Cross-cutting Task `TX-NN`** — não uma Feature. Configuração técnica não é entregável ao cliente, mas precisa de um lar visível e rastreável para o time técnico.

> ⚠️ **Revisão pendente (migração Next.js)**: os TX abaixo foram consolidados na fase anterior (stack JS puro + Vite + GitHub Pages). Na **P3** serão revisados para a nova stack (**Next.js App Router + TypeScript + Tailwind + Supabase**).

## Tasks transversais sob este Epic (`TX-NN`)

| ID      | Tarefa técnica                                                                                                                                                                                                                                                                                                                        | Prioridade  | Status |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ |
| `TX-01` | Configuração base do projeto (scaffold **Next.js** App Router + TS + Tailwind, estrutura de pastas, scripts npm).                                                                                                                                                                                                                     | 🔴 Imediato | ⏳     |
| `TX-02` | Pipeline de deploy automático + CI (destino do Next.js; antes era GitHub Pages).                                                                                                                                                                                                                                                      | 🔴 Imediato | ⏳     |
| `TX-03` | Biblioteca de utilitários puros (formatação/parse de data, validação de e-mail institucional, geração de id, helpers) com testes.                                                                                                                                                                                                     | 🔴 Imediato | ⏳     |
| `TX-04` | Design system base **M3** (tokens claro/escuro + componentes primitivos) reutilizado pelas telas.                                                                                                                                                                                                                                     | 🔴 Imediato | ⏳     |
| `TX-05` | API centralizada de modais/diálogos (abertura/fechamento/empilhamento) usada pelas features.                                                                                                                                                                                                                                          | 🟠 Alta     | ⏳     |
| `TX-06` | Componentes padronizados de feedback e confirmação (toasts, diálogos de confirmação).                                                                                                                                                                                                                                                 | 🟠 Alta     | ⏳     |
| `TX-07` | Dev tooling: **ESLint + Prettier + Husky + lint-staged** configurados para o projeto Next.js.                                                                                                                                                                                                                                         | 🟠 Alta     | ⏳     |
| `TX-08` | Cliente **Supabase** + variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`) e tipos TypeScript gerados.                                                                                                                                                                                                                      | 🔴 Imediato | ⏳     |
| `TX-09` | Bucket **Supabase Storage** `resource-images` + policy de escrita (admin via service-role) e leitura — suporte a [F-47](../features/F-47-imagem-da-sala.md)/[F-48](../features/F-48-imagem-do-equipamento.md). Decisão: [ADR-008](../../planning/adrs/ADR-008-armazenamento-de-imagens-de-recursos.md).                               | 🟡 Normal   | ⏳     |
| `TX-10` | Migração: coluna `image_path text null` em `public.rooms` — suporte a [F-47](../features/F-47-imagem-da-sala.md).                                                                                                                                                                                                                     | 🟡 Normal   | ⏳     |
| `TX-11` | Migração: coluna `image_path text null` em `public.equipment` — suporte a [F-48](../features/F-48-imagem-do-equipamento.md).                                                                                                                                                                                                          | 🟡 Normal   | ⏳     |
| `TX-12` | Migração: tabela `public.reservation_holds` (recurso/kind, data, faixa de horário, `user_id`, `expires_at`) + RLS + índice por recurso+data+horário — suporte a [F-49](../features/F-49-reserva-temporaria-do-recurso-durante-a-solicit.md). Decisão: [ADR-009](../../planning/adrs/ADR-009-mecanismo-de-reserva-temporaria-hold.md). | 🟠 Alta     | ⏳     |
| `TX-13` | Limpeza de holds expirados — job agendado `pg_cron` (ou filtro `expires_at > now()` em toda leitura) — suporte a [F-49](../features/F-49-reserva-temporaria-do-recurso-durante-a-solicit.md).                                                                                                                                         | 🟠 Alta     | ⏳     |

## ADRs relacionadas

- [ADR-008](../../planning/adrs/ADR-008-armazenamento-de-imagens-de-recursos.md) — armazenamento de imagens de recursos (Supabase Storage), suporta TX-09/TX-10/TX-11.
- [ADR-009](../../planning/adrs/ADR-009-mecanismo-de-reserva-temporaria-hold.md) — mecanismo de reserva temporária (hold com expiração), suporta TX-12/TX-13.

_(registrar em `../../planning/adrs/` quando uma TX carregar decisão de design — ex.: destino de deploy, estrutura de pastas Next.js, padrão de acesso ao Supabase.)_
