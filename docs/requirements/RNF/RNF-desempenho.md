# RNF-desempenho — Desempenho de listas, busca e publicação

> **Tipo**: Requisito Não-Funcional (transversal)
> **Prioridade**: 🟠 Alta
> **Status**: 📝 Proposto

---

## Enunciado

As telas de lista, a busca de salas e a publicação do sistema respondem dentro de limites perceptíveis aceitáveis.

### Métricas obrigatórias (quantitativas)

| Métrica | Alvo | Quando/como medir |
| --- | --- | --- |
| Listas grandes | paginação ou rolagem virtual a partir de 50 itens | Teste de UI com ≥50 reservas |
| Tempo total de publicação (deploy) | ≤ 5 minutos com cache vazio | Medição no workflow de CI |
| Detecção de conflito de horário | resultado imediato ao buscar salas | Teste do motor de conflito sobre o conjunto de reservas |

## Realizado por (rastreabilidade ↓)

| Epic / Feature | Como atende |
| --- | --- |
| EP-07 → F-16 | ver CAs da feature | 
| EP-12 → TX-02 | ver CAs da feature | 
| EP-06 → F-14 | ver CAs da feature | 
