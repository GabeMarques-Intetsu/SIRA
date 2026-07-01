# RNF-imagem-de-recurso — Formato e tamanho da imagem de salas e equipamentos

> **Tipo**: Requisito Não-Funcional (usabilidade + limite quantitativo)
> **Prioridade**: 🟡 Normal
> **Status**: 📝 Proposto

---

## Enunciado

A imagem opcional de uma sala ou de um equipamento é restrita a formatos e a um tamanho que garantam carregamento rápido nos cards e no detalhe do recurso, com pré-visualização antes de salvar e queda graciosa para o ícone padrão quando não houver imagem.

### Métricas obrigatórias (quantitativas)

| Métrica                   | Alvo                       | Quando/como medir                                      |
| ------------------------- | -------------------------- | ------------------------------------------------------ |
| Formatos aceitos          | apenas JPG, PNG ou WebP    | Validação na escolha do arquivo (rejeita os demais)    |
| Tamanho máximo do arquivo | ≤ 2 MB por imagem          | Validação na escolha do arquivo, antes do envio        |
| Imagens por recurso       | exatamente 1 (opcional)    | Cada sala/equipamento tem no máximo uma imagem         |
| Pré-visualização          | exibida antes de salvar    | Teste de UI no cadastro/edição                         |
| Ausência de imagem        | exibe o ícone padrão atual | Teste de UI no card e no detalhe do recurso sem imagem |

## Realizado por (rastreabilidade ↓)

| Epic / Feature                                                                             | Como atende                                                  |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| EP-09 → [F-47 Imagem da sala](../../backlog/features/F-47-imagem-da-sala.md)               | CAs de formato, tamanho, pré-visualização e queda para ícone |
| EP-09 → [F-48 Imagem do equipamento](../../backlog/features/F-48-imagem-do-equipamento.md) | CAs de formato, tamanho, pré-visualização e queda para ícone |

## Restrições e fora-de-escopo

- Não há edição de imagem (recorte, rotação, filtros) dentro do sistema; aceita-se o arquivo como enviado.
- Decisão técnica de armazenamento e validação registrada em [ADR-008](../../planning/adrs/ADR-008-armazenamento-de-imagens-de-recursos.md).
