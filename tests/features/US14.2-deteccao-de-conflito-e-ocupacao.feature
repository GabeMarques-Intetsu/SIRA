# language: pt
# Rastreabilidade: US14.2 → F-14 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Detecção de conflito e ocupação

  Cenário: Sala com reserva aprovada conflitante é excluída
    Dado que a sala "Lab 1" tem uma reserva aprovada das 14h às 15h
    Quando o professor busca salas para o intervalo das 14h30 às 16h
    Então "Lab 1" não aparece nos resultados

  Cenário: Reserva pendente também gera conflito
    Dado que a sala "Lab 2" tem uma reserva pendente das 14h às 16h
    Quando o professor busca salas para esse mesmo horário
    Então "Lab 2" não aparece nos resultados

  Cenário: Reserva recusada não gera conflito
    Dado que a sala "Lab 3" tem apenas uma reserva recusada das 14h às 16h
    Quando o professor busca salas para esse horário
    Então "Lab 3" aparece nos resultados
