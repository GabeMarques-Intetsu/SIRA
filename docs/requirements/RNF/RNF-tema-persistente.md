# RNF-tema-persistente — Tema aplicado sem piscar e sincronizado

> **Tipo**: Requisito Não-Funcional (transversal)
> **Prioridade**: 🟡 Normal
> **Status**: 📝 Proposto

---

## Enunciado

O tema escolhido (claro, escuro ou o do sistema) é aplicado antes da primeira pintura da tela, sem piscar de cores indevidas, e mantém-se consistente entre recargas e entre abas abertas.

### Métricas obrigatórias (quantitativas)

| Métrica                     | Alvo                                            | Quando/como medir                                                                                   |
| --------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Flash de tema errado (FOUC) | 0 ocorrências                                   | Recarregar a página com tema escuro salvo e observar que nenhum quadro é renderizado em claro antes |
| Aplicação do tema           | antes do primeiro paint                         | O tema é definido no documento antes do conteúdo visível ser pintado                                |
| Persistência entre recargas | 100% — tema mantido após F5                     | Teste: escolher tema, recarregar, verificar tema preservado                                         |
| Sincronização entre abas    | tema replicado em ≤ 1 s nas demais abas abertas | Abrir duas abas, trocar o tema em uma, observar a outra atualizar                                   |
| Modo "sistema"              | acompanha `prefers-color-scheme` em tempo real  | Alterar o tema do sistema operacional com o modo "Sistema" ativo                                    |
| Persistência por usuário    | preferência atrelada à conta da pessoa          | Teste: trocar de usuário e verificar que cada um mantém o próprio tema                              |

## Realizado por (rastreabilidade ↓)

| Epic / Feature | Como atende                                           |
| -------------- | ----------------------------------------------------- |
| EP-02 → F-09   | Tema claro/escuro persistente (alternância existente) |
| EP-12 → F-38   | Preferência de tema claro/escuro/sistema              |

## Observações

O comportamento de aplicação antecipada do tema já está prototipado em `docs/mockups/_shared/theme-toggle.js`. A opção "Sistema" estende a alternância atual (que hoje cobre claro/escuro) para também seguir a preferência do sistema operacional.
