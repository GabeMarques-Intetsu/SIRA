# RF-013 — Gestão do catálogo de equipamentos

> **Tipo**: Requisito Funcional
> **Prioridade**: 🟡 Normal
> **Status**: 📝 Proposto

---

## Enunciado de negócio (sem termo técnico)

> **O sistema permite que o administrador cadastre, liste, edite e exclua equipamentos, com seu tipo, estado de disponibilidade e vínculo a um bloco ou sala.**
>
> **O sistema permite que o administrador anexe uma imagem opcional ao equipamento no cadastro e na edição, exibindo-a nos cards e no detalhe do equipamento; quando não há imagem, mostra o ícone padrão.**

## Justificativa

Amplia a gestão de recursos para além das salas: além de espaços físicos, o campus possui equipamentos reserváveis (projetores, microfones, câmeras, notebooks etc.). O administrador precisa de um CRUD completo de equipamentos espelhando o de salas — com tipo do equipamento, estado de disponibilidade (ativo, inativo ou em manutenção) e o vínculo a um bloco ou a uma sala específica. A tela de Recursos reúne salas e equipamentos em abas, com os mesmos filtros por estado e busca. Equipamentos em manutenção ou inativos não devem aparecer como disponíveis para reserva, e não se permite excluir equipamento com reservas futuras.

## Realizado por (rastreabilidade ↓)

| Epic | Feature(s) | Status |
| --- | --- | --- |
| [EP-09](../../backlog/epics/EP-09-gestao-de-salas-admin.md) | [F-43 Cadastro de novo equipamento](../../backlog/features/F-43-cadastro-de-novo-equipamento.md) | 📝 |
| [EP-09](../../backlog/epics/EP-09-gestao-de-salas-admin.md) | [F-44 Listagem de equipamentos com filtros e estado](../../backlog/features/F-44-listagem-de-equipamentos-com-filtros-e-estado.md) | 📝 |
| [EP-09](../../backlog/epics/EP-09-gestao-de-salas-admin.md) | [F-45 Edição de equipamento](../../backlog/features/F-45-edicao-de-equipamento.md) | 📝 |
| [EP-09](../../backlog/epics/EP-09-gestao-de-salas-admin.md) | [F-46 Exclusão de equipamento](../../backlog/features/F-46-exclusao-de-equipamento.md) | 📝 |
| [EP-09](../../backlog/epics/EP-09-gestao-de-salas-admin.md) | [F-48 Imagem do equipamento](../../backlog/features/F-48-imagem-do-equipamento.md) | 📝 |

## Revisão (registro de mudança — o documento é a fonte da verdade)

| Data | Mudança | Origem |
| --- | --- | --- |
| 2026-06-26 | Adicionado o enunciado de **imagem opcional do equipamento** (anexar no cadastro/edição; exibir nos cards e no detalhe; ícone padrão quando ausente). Cobre a Feature [F-48](../../backlog/features/F-48-imagem-do-equipamento.md). Limites em [RNF-imagem-de-recurso](../RNF/RNF-imagem-de-recurso.md). Decisão técnica em [ADR-008](../../planning/adrs/ADR-008-armazenamento-de-imagens-de-recursos.md). | Solicitação do produto |

## RNFs que limitam

- [RNF-design-system-m3](../RNF/RNF-design-system-m3.md) — cards e estados visuais consistentes com a gestão de salas.
- [RNF-responsividade-mobile](../RNF/RNF-responsividade-mobile.md) — grade de cards e abas operáveis no celular.
- [RNF-imagem-de-recurso](../RNF/RNF-imagem-de-recurso.md) — formato (JPG/PNG/WebP), tamanho máximo (2 MB) e pré-visualização da imagem.

## Restrições e fora-de-escopo

- Equipamento com estado "inativo" ou "em manutenção" nunca aparece como disponível para reserva.
- Não se permite excluir equipamento com reservas futuras (mesma regra das salas).
- O seed inicial pode cobrir os equipamentos existentes; o CRUD é necessário para evolução.
- Detalhe verificável de cada capacidade vive nas CAs das Features acima.
