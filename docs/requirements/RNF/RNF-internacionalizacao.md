# RNF-internacionalizacao — Suporte a múltiplos idiomas

> **Tipo**: Requisito Não-Funcional (transversal)
> **Prioridade**: 🟡 Normal
> **Status**: 📝 Proposto

---

## Enunciado

A interface oferece-se em português (Brasil), inglês e espanhol; o idioma escolhido pela pessoa reflete-se em toda a interface e nas mensagens, sem textos fixos no código.

### Métricas obrigatórias (quantitativas)

| Métrica                          | Alvo                                                            | Quando/como medir                                          |
| -------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| Idiomas suportados               | pt-BR, en, es (3 idiomas)                                       | Verificar a lista de idiomas selecionáveis em Preferências |
| Textos externalizados            | 100% dos textos de interface vêm de arquivos de tradução        | Inspeção: ausência de strings de UI fixas no código        |
| Cobertura de tradução por idioma | 100% das chaves traduzidas (sem chave faltante/exibida como id) | Comparação dos dicionários de cada idioma                  |
| Troca de idioma                  | aplicada em ≤ 1 s sem recarregar manualmente a página           | Teste alterando o idioma em Preferências                   |
| Formatação regional              | datas, horas e números no formato do idioma ativo               | Teste de exibição de uma reserva em cada idioma            |
| Atributo de idioma do documento  | `lang` reflete o idioma ativo                                   | Inspeção do elemento `html`                                |

## Realizado por (rastreabilidade ↓)

| Epic / Feature | Como atende                                           |
| -------------- | ----------------------------------------------------- |
| EP-12 → F-38   | Seleção de idioma (pt-BR/en/es) nas preferências      |
| EP-11 → F-34   | Mensagens de notificação respeitam o idioma escolhido |

## Observações

O idioma padrão é português (Brasil). A escolha de idioma persiste por usuário, junto às demais preferências de interface.
