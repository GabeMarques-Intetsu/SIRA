# language: pt
# Rastreabilidade: US12.1 → F-12 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Indicadores do painel

  Cenário: Painel exibe os indicadores do período
    Dado que o administrador acessa o painel de indicadores
    Quando o período possui reservas registradas
    Então o painel mostra o total de reservas, a taxa de aprovação, as salas mais ocupadas e os professores ativos

  Cenário: Período sem dados mostra indicadores zerados com aviso
    Dado que o administrador acessa o painel de indicadores
    Quando não há nenhuma reserva no período selecionado
    Então o painel mostra os indicadores zerados
    E exibe um aviso de ausência de dados no período

  Cenário: Indicadores se atualizam quando uma reserva muda
    Dado que o administrador está com o painel aberto
    Quando uma reserva da professora Ana para o Lab 1 é aprovada
    Então os indicadores do painel passam a refletir a mudança sem recarregar a tela
