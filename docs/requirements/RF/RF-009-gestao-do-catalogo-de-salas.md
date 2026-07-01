# RF-009 — Gestão do catálogo de salas

> **Tipo**: Requisito Funcional
> **Prioridade**: 🟡 Normal
> **Status**: 📝 Proposto

---

## Enunciado de negócio (sem termo técnico)

> **O sistema permite que o administrador cadastre, liste, edite e exclua salas, com seus recursos e estado de atividade.**
>
> **O sistema permite que o administrador anexe uma imagem opcional à sala no cadastro e na edição, exibindo-a nos cards e no detalhe da sala; quando não há imagem, mostra o ícone padrão.**

## Justificativa

CRUD completo de salas e seus recursos (datashow, ar-condicionado, lousa interativa, etc.) por parte do administrador. Inclui filtros por status (ativa/inativa) e tipo, além de validação para impedir exclusão de salas com reservas futuras. No dia 1 o seed inicial cobre as salas existentes, mas o CRUD é necessário para evolução.

A imagem da sala é um enriquecimento de reconhecimento visual: ajuda o professor a identificar o espaço de relance na busca e no catálogo. É opcional, com formato e tamanho limitados ([RNF-imagem-de-recurso](../RNF/RNF-imagem-de-recurso.md)), e a ausência de imagem mantém o ícone padrão de hoje.

## Revisão (registro de mudança — o documento é a fonte da verdade)

| Data | Mudança | Origem |
| --- | --- | --- |
| 2026-06-26 | Adicionado o enunciado de **imagem opcional da sala** (anexar no cadastro/edição; exibir nos cards e no detalhe; ícone padrão quando ausente). Cobre a Feature [F-47](../../backlog/features/F-47-imagem-da-sala.md). Limites em [RNF-imagem-de-recurso](../RNF/RNF-imagem-de-recurso.md). Decisão técnica em [ADR-008](../../planning/adrs/ADR-008-armazenamento-de-imagens-de-recursos.md). | Solicitação do produto |

## Realizado por (rastreabilidade ↓)

| Epic | Feature(s) | Status |
| --- | --- | --- |
| [EP-09](../../backlog/epics/EP-09-gestao-de-salas-admin.md) | [F-24 Cadastro de nova sala](../../backlog/features/F-24-cadastro-de-nova-sala.md) | 📝 |
| [EP-09](../../backlog/epics/EP-09-gestao-de-salas-admin.md) | [F-25 Listagem de salas com filtros e recursos](../../backlog/features/F-25-listagem-de-salas-com-filtros-e-recursos.md) | 📝 |
| [EP-09](../../backlog/epics/EP-09-gestao-de-salas-admin.md) | [F-26 Edição de sala](../../backlog/features/F-26-edicao-de-sala.md) | 📝 |
| [EP-09](../../backlog/epics/EP-09-gestao-de-salas-admin.md) | [F-27 Exclusão de sala](../../backlog/features/F-27-exclusao-de-sala.md) | 📝 |
| [EP-09](../../backlog/epics/EP-09-gestao-de-salas-admin.md) | [F-47 Imagem da sala](../../backlog/features/F-47-imagem-da-sala.md) | 📝 |

## RNFs que limitam

- [RNF-imagem-de-recurso](../RNF/RNF-imagem-de-recurso.md) — formato (JPG/PNG/WebP), tamanho máximo (2 MB) e pré-visualização da imagem.

## Restrições e fora-de-escopo

- Detalhe verificável de cada capacidade vive nas CAs das Features acima.
- A imagem da sala é opcional; a ausência mantém o ícone padrão atual.
