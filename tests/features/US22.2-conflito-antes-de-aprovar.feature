# language: pt
# Rastreabilidade: US22.2 -> F-22 (conflito antes de aprovar)
Funcionalidade: Detecção de conflito na aprovação

  Cenário: Sinalizar conflito ao analisar a solicitação
    Dado que existe uma reserva aprovada para o "Lab 1" das 14h às 15h
    E uma solicitação pendente para o mesmo "Lab 1" das 14h30 às 16h
    Quando o administrador analisa a solicitação pendente
    Então o sistema sinaliza o conflito de horário com a reserva já aprovada

  Cenário: Aprovar em conflito exige confirmação
    Dado que a solicitação pendente está sinalizada como em conflito
    Quando o administrador tenta aprová-la
    Então o sistema pede uma confirmação explícita antes de concluir a aprovação
