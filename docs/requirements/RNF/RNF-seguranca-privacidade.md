# RNF-seguranca-privacidade — Segurança e Privacidade de Dados por Usuário

> **Tipo**: Requisito Não-Funcional (transversal)
> **Prioridade**: 🔴 Imediato
> **Status**: 📝 Proposto

---

## Enunciado

Os dados pessoais de reserva de cada usuário ficam isolados dos demais no mesmo navegador; nenhum usuário acessa dados de outro.

### Métricas obrigatórias (quantitativas)

| Métrica | Alvo | Quando/como medir |
| --- | --- | --- |
| Vazamento de dados entre usuários | 0 ocorrências | Teste: usuário A logado nunca enxerga reservas/dados do usuário B no mesmo navegador |
| Chaves pessoais prefixadas por usuário | 100% das chaves pessoais com prefixo de usuário | Inspeção do armazenamento local + teste de getStore() validando o id antes de retornar |
| Acesso a chave de outro usuário | retorna vazio silenciosamente | Teste unitário de acesso cruzado |
| Excesso de quota de armazenamento | tratado com mensagem amigável (sem quebra) | Teste de estouro de quota |

## Realizado por (rastreabilidade ↓)

| Epic / Feature | Como atende |
| --- | --- |
| EP-03 → F-10 | ver CAs da feature | 

## Observações

Alinha-se à LGPD (minimização, isolamento e não-exposição de dados pessoais).
