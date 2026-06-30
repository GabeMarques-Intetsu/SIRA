# language: pt
# Rastreabilidade: US11.1 → F-11 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Propagação da decisão de reserva

  Cenário: Aprovação atualiza status, notificação e contadores juntos
    Dado que o administrador tem uma reserva pendente da professora Ana para o Lab 1 às 14h
    Quando ele aprova essa reserva
    Então o novo status aprovado aparece imediatamente em todas as telas relacionadas
    E Ana recebe a notificação da aprovação
    E os contadores de pendências do menu, do painel e da fila de aprovações são reduzidos na mesma ação

  Cenário: Falha ao registrar a decisão não deixa estado pela metade
    Dado que o administrador está recusando a reserva do professor Bruno para o Lab 1 às 14h
    Quando ocorre uma falha durante o registro da decisão
    Então a decisão não é aplicada em nenhum lugar
    E o status, a notificação e os contadores permanecem como estavam antes da tentativa

  Cenário: Recusa gera notificação correspondente ao autor
    Dado que o administrador tem uma reserva pendente da professora Ana
    Quando ele recusa essa reserva
    Então o status passa a recusado em todas as telas relacionadas
    E Ana recebe a notificação informando a recusa da sua reserva
