# language: pt
# Rastreabilidade: US34.1 → F-34 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Lista de notificações

  Cenário: Professor abre o painel e vê suas notificações
    Dado que tenho notificações recebidas
    Quando abro o painel pelo ícone de notificações no topo
    Então vejo minhas notificações da mais recente para a mais antiga
    E cada uma mostra título, mensagem e data
    E as lidas e não lidas aparecem visualmente diferenciadas

  Cenário: Painel sem nenhuma notificação
    Dado que ainda não recebi nenhuma notificação
    Quando abro o painel de notificações
    Então vejo um aviso de caixa vazia

  Cenário: Contador mostra a quantidade de não lidas
    Dado que tenho três notificações por ler
    Quando observo o ícone de notificações no topo
    Então o contador indica três notificações não lidas
