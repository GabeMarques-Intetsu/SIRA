# language: pt
# Rastreabilidade: US14.1 → F-14 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Interface de filtros e restrições básicas de horários

  Cenário: Busca com critérios válidos lista salas compatíveis
    Dado que o professor está na tela de nova reserva
    Quando informa a data de amanhã, das 14h às 16h, e marca o recurso "datashow"
    E confirma a busca
    Então o sistema lista apenas salas com datashow disponíveis no horário
    E as salas aparecem ordenadas por capacidade crescente

  Cenário: Horário de início posterior ao fim é barrado
    Dado que o professor está na tela de nova reserva
    Quando informa início às 16h e fim às 14h
    Então o sistema exibe aviso de horário inválido
    E não realiza a busca

  Cenário: Data anterior a hoje é barrada
    Dado que o professor está na tela de nova reserva
    Quando informa uma data anterior ao dia atual
    Então o sistema exibe aviso de data inválida
