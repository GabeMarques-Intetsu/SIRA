# ADR-008: Armazenar imagens de salas e equipamentos no Supabase Storage com caminho referenciado em coluna

## Status

Accepted

ADR de tier 1 (transversal). Fundamenta a Feature de imagem opcional de recursos ([F-47 Imagem da sala](../../backlog/features/F-47-imagem-da-sala.md), [F-48 Imagem do equipamento](../../backlog/features/F-48-imagem-do-equipamento.md)), estendendo [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md) e [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md). Limites quantitativos em [RNF-imagem-de-recurso](../../requirements/RNF/RNF-imagem-de-recurso.md).

## Context

Salas e equipamentos passam a aceitar uma imagem opcional, exibida nos cards e no detalhe; sem imagem, mantém-se o ícone padrão. É preciso decidir **onde** o binário fica guardado e **como** a linha do recurso o referencia, sem quebrar o modelo relacional de [ADR-001](./ADR-001-schema-inicial-e-rls-supabase.md) nem o acesso protegido por RLS.

Forças em jogo:

- **Apenas admin escreve recursos** (RLS `rooms_write`/`equipment_write` exige `is_admin()`, ADR-001). O upload da imagem deve herdar essa mesma restrição.
- **Leitura ampla**: qualquer autenticado lê o catálogo; a imagem precisa carregar rápido no card e na busca ([RNF-imagem-de-recurso](../../requirements/RNF/RNF-imagem-de-recurso.md): JPG/PNG/WebP ≤ 2 MB).
- **Service-role já existe** server-side ([ADR-002](./ADR-002-provisionamento-de-contas-via-service-role.md)) — caminho natural para a escrita privilegiada do binário.
- **ADR-007** já antecipou Storage como dependência externa (item _d_, upload de foto de perfil); este ADR concretiza a adoção para recursos.

Opções consideradas:

### Eixo 1 — Onde guardar o binário

1. **Supabase Storage (bucket dedicado)** — objetos fora da tabela; URL pública ou assinada; CDN do Storage serve a imagem. Mantém a linha do recurso enxuta.
2. **Base64 numa coluna `bytea`/`text`** — binário dentro da linha. Infla cada SELECT do catálogo (mesmo quando a imagem não é necessária), estoura toast de payload, polui a query de listagem.
3. **Serviço externo (S3/Cloudinary)** — capacidade extra (transformações), mas adiciona provedor, credenciais e custo fora do ambiente Supabase já existente; desnecessário para 1 imagem ≤ 2 MB por recurso.

### Eixo 2 — Como a linha referencia a imagem

1. **Coluna `image_path text null`** (chave do objeto no bucket) em `rooms` e `equipment` — nulo = sem imagem = ícone padrão. A URL é derivada do path em tempo de leitura.
2. **Guardar a URL pública completa** — quebra ao trocar de bucket/projeto; acopla a linha à URL.

### Eixo 3 — Leitura

1. **Bucket público** (leitura anônima do objeto) — simples; a imagem do catálogo não é dado sensível (é o espaço físico, não dado pessoal).
2. **URL assinada** (expira) — controle fino, custo de gerar a assinatura a cada render do card.

## Decision

- **Eixo 1 → Supabase Storage, bucket dedicado `resource-images`.** Binário fora da tabela; rejeitado base64 (infla o catálogo) e serviço externo (provedor desnecessário).
- **Eixo 2 → coluna `image_path text null`** em `public.rooms` e `public.equipment` (migrações **TX-10**/**TX-11**). `null` = sem imagem → ícone padrão (CA09 de F-47/F-48). A linha guarda a **chave do objeto** (ex.: `rooms/<id>.webp`), não a URL completa.
- **Eixo 3 → leitura pública** do bucket (a imagem do recurso não é dado pessoal); **escrita restrita a admin via service-role server-side** (Server Action), espelhando `*_write`. Validação de tipo (JPG/PNG/WebP) e tamanho (≤ 2 MB) no client **e** no server antes do upload, conforme [RNF-imagem-de-recurso](../../requirements/RNF/RNF-imagem-de-recurso.md).
- **Substituir/remover** (CA06/CA07): ao trocar a imagem, o objeto anterior é apagado; ao remover, limpa-se `image_path` e o objeto.

Convenção de chave: `<kind>/<resource_id>.<ext>` (uma imagem por recurso, CA04), o que torna a substituição idempotente.

## Consequences

**Positivas:**

- Catálogo continua leve: o SELECT de listagem não carrega binário; só o path (derivado em URL na renderização).
- Escrita herda a mesma fronteira de admin já provada em ADR-001/ADR-002 — sem nova superfície de autorização.
- Trocar projeto/bucket não quebra dados: guarda-se o path, não a URL.
- `image_path` nulável dá a queda graciosa para o ícone padrão sem ramo especial no schema.

**Negativas / trade-offs aceitos:**

- Leitura pública do bucket expõe a URL do objeto a quem a obtiver; aceitável por não ser dado pessoal (é o espaço/equipamento). Se um dia a imagem virar sensível, troca-se para URL assinada sem mudar o schema (só a leitura).
- Consistência objeto ↔ linha não é transacional: um upload bem-sucedido seguido de falha no UPDATE pode deixar objeto órfão. Mitiga-se com chave determinística (`<kind>/<id>.<ext>`, sobrescrita idempotente) e limpeza no caminho de erro.
- Validação de tipo/tamanho precisa existir nos dois lados (client p/ UX, server p/ garantia), pequena duplicação aceitável.

## Cross-ref

- Requisitos: [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md), [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md); [RNF-imagem-de-recurso](../../requirements/RNF/RNF-imagem-de-recurso.md).
- Backlog: [F-47](../../backlog/features/F-47-imagem-da-sala.md), [F-48](../../backlog/features/F-48-imagem-do-equipamento.md); TX-09 (bucket+policy), TX-10 (`rooms.image_path`), TX-11 (`equipment.image_path`) em [EP-atividades-complementares](../../backlog/epics/EP-atividades-complementares.md).
- Relacionado: [ADR-001](./ADR-001-schema-inicial-e-rls-supabase.md) (schema + RLS), [ADR-002](./ADR-002-provisionamento-de-contas-via-service-role.md) (service-role server-only), [ADR-007](./ADR-007-funcionalidades-dependentes-de-infra-externa.md) (Storage antecipado, item _d_).
- Implementação prevista: `supabase/migrations/0007_*` (colunas + bucket/policy), `src/app/(app)/_resources/resource-form.tsx`, `resource-actions.ts`, `src/schemas/resource.ts`, `src/lib/resources.ts`.
- Handoff: `backend-architect` (bucket/policy/upload server-side), `cyber-security-architect` (decisão público vs assinado, validação de tipo/tamanho no server).
