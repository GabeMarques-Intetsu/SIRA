# RNF-design-system-m3 — Consistência visual com Material Design 3

> **Tipo**: Requisito Não-Funcional (transversal)
> **Prioridade**: 🟠 Alta
> **Status**: 📝 Proposto

---

## Enunciado

A interface segue um único sistema de design baseado no Material Design 3, com tokens de cor, tipografia, espaçamento e forma definidos uma só vez e reutilizados em todas as telas, nos modos claro e escuro.

### Métricas obrigatórias (quantitativas)

| Métrica                  | Alvo                                                                           | Quando/como medir                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Cores fora dos tokens M3 | 0 valores de cor "soltos" (hexadecimais avulsos) nas telas                     | Inspeção das telas: toda cor referencia uma variável de token (ex.: `--md-sys-color-primary`) definida em `tokens.css` |
| Cobertura de tema        | 100% das telas renderizam corretamente em claro e escuro                       | Teste visual de cada tela nos dois temas, sem texto ilegível                                                           |
| Escala tipográfica       | 100% dos textos usam um papel da escala M3 (display/headline/title/body/label) | Inspeção: nenhum tamanho de fonte arbitrário fora da escala                                                            |
| Componentes reutilizados | botões, campos, cards, chips e diálogos vêm de um conjunto único               | Inspeção: ausência de variações duplicadas do mesmo componente                                                         |
| Tokens de elevação/forma | raios e sombras usam os tokens definidos (sem valores improvisados)            | Inspeção dos cards e diálogos                                                                                          |

## Realizado por (rastreabilidade ↓)

| Epic / Feature | Como atende                                                 |
| -------------- | ----------------------------------------------------------- |
| EP-AC → TX-04  | Design system base (tokens + primitivos) sob M3             |
| EP-12 → F-38   | Preferência de tema claro/escuro/sistema respeita os tokens |
| EP-09 → F-44   | Cards de equipamentos consistentes com os de salas          |

## Observações

A fonte de verdade de design são os mockups em `docs/mockups/` e o arquivo `docs/mockups/_shared/tokens.css`. Os tokens cobrem `primary`, `secondary`, `tertiary`, `surface`/`surface-container-*`, `outline-variant`, `error` e variantes `on-*`, além de papéis tipográficos `text-headline-*`, `text-body-*` e `text-label-*`.
