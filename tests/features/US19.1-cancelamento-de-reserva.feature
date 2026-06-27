# language: pt
# Rastreabilidade: US19.1 → F-19 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Cancelamento de reserva

  Cenário: Cancelamento de reserva pendente libera o horário
    Dado que a professora Ana tem uma reserva pendente do Lab 1 às 14h
    Quando ela cancela a reserva e confirma a ação
    Então a reserva passa para o status cancelada
    E o horário das 14h do Lab 1 fica liberado
    E a reserva permanece visível apenas como histórico

  Cenário: Cancelamento não permitido para reserva já aprovada
    Dado que o professor Bruno tem uma reserva do Lab 1 já aprovada
    Quando ele tenta cancelar essa reserva
    Então o sistema não permite o cancelamento
    E informa que só é possível cancelar reservas ainda pendentes

  Cenário: Cancelamento exige confirmação explícita
    Dado que a professora Ana tem uma reserva pendente do Lab 1 às 14h
    Quando ela aciona o cancelamento mas não confirma a ação
    Então a reserva continua pendente
    E o horário das 14h do Lab 1 permanece reservado
