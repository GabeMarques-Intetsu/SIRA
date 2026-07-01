# language: pt
# Rastreabilidade: US21.1 → F-21 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Painel restrito e ordenação cronológica das solicitações

  Cenário: Apenas administrador acessa a fila
    Dado que um professor está logado
    Quando tenta acessar a fila de aprovações
    Então o acesso é negado

  Cenário: Fila lista pendentes das mais antigas primeiro
    Dado que existem três solicitações pendentes criadas em dias diferentes
    Quando o administrador acessa a fila de aprovações
    Então vê as três solicitações
    E elas aparecem da mais antiga para a mais recente

  Cenário: Fila vazia exibe mensagem
    Dado que não há solicitações pendentes
    Quando o administrador acessa a fila
    Então o sistema exibe "Nenhuma solicitação pendente"
