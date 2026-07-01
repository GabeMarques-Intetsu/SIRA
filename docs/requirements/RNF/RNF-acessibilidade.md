# RNF-acessibilidade — Acessibilidade WCAG 2.2 AA

> **Tipo**: Requisito Não-Funcional (transversal)
> **Prioridade**: 🟠 Alta
> **Status**: 📝 Proposto

---

## Enunciado

A interface atende às diretrizes WCAG 2.2 no nível AA, sendo operável por teclado e por leitores de tela, com contraste adequado, foco visível e respeito às preferências de acessibilidade do usuário.

### Métricas obrigatórias (quantitativas)

| Métrica                                       | Alvo                                                                             | Quando/como medir                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Contraste de texto normal                     | razão ≥ 4.5:1                                                                    | Verificador de contraste sobre texto e fundo em ambos os temas        |
| Contraste de texto grande e ícones essenciais | razão ≥ 3:1                                                                      | Verificador de contraste                                              |
| Navegação por teclado                         | 100% das ações alcançáveis e operáveis só com teclado                            | Teste manual percorrendo a tela com Tab/Shift+Tab/Enter/Espaço        |
| Foco visível                                  | 100% dos elementos focáveis exibem indicador de foco                             | Inspeção do estado `:focus-visible` em todos os controles             |
| Alvos de toque                                | ≥ 44×44 px (área de toque dos botões/ícones)                                     | Medição dos controles interativos (classe `touch-target` dos mockups) |
| Movimento reduzido                            | animações suprimidas quando `prefers-reduced-motion: reduce`                     | Teste com a preferência do sistema ativa                              |
| Estrutura semântica                           | landmarks e cabeçalhos corretos (`main`, `nav`, `header`, `h1..h2` hierárquicos) | Inspeção da árvore de acessibilidade                                  |
| Rótulos acessíveis                            | 100% dos controles têm nome acessível (`label`/`aria-label`/`aria-labelledby`)   | Auditoria automática (ex.: axe) + inspeção                            |
| Erros do tipo axe (níveis crítico/sério)      | 0 violações                                                                      | Execução de auditoria automática em cada tela                         |

## Realizado por (rastreabilidade ↓)

| Epic / Feature | Como atende                                                         |
| -------------- | ------------------------------------------------------------------- |
| EP-AC → TX-04  | Componentes primitivos acessíveis por padrão                        |
| EP-12 → F-38   | Opção "reduzir animações" e respeito a `prefers-reduced-motion`     |
| EP-02 → F-05   | Skip link, landmarks e navegação por teclado na navegação principal |

## Observações

Os mockups já trazem `skip-link`, `aria-label`, `aria-current`, `role="tablist"/"radiogroup"`, `aria-pressed` e a classe utilitária `touch-target` — estes padrões são o piso de conformidade a manter na implementação.
