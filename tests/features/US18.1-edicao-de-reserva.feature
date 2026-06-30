# language: pt
# Rastreabilidade: US18.1 → F-18 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Edição de reserva

  Cenário: Alteração de reserva pendente
    Dado que a professora Ana tem uma reserva pendente do Lab 1 às 14h
    Quando ela altera o horário para as 16h
    Então a reserva pendente passa a constar para as 16h

  Cenário: Reserva aprovada fica somente para leitura
    Dado que o professor Bruno tem uma reserva do Lab 1 já aprovada
    Quando ele abre essa reserva para alterar o horário
    Então o sistema não permite a edição
    E mantém a reserva apenas para leitura preservando o histórico da decisão

  Cenário: Edição bloqueada por conflito de horário
    Dado que a professora Ana tem uma reserva pendente do Lab 1 às 14h
    Quando ela altera o horário para as 16h, que já está ocupado por outra reserva
    Então a alteração não é aplicada
    E o sistema informa que o novo horário está em conflito
