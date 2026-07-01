# language: pt
# Rastreabilidade: US23.1 → F-23 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Recusa de reserva

  Cenário: Recusar uma reserva informando o motivo
    Dado que existe uma reserva pendente do professor Bruno para o "Lab 1"
    Quando eu recuso a reserva com o motivo "Sala em manutenção no horário solicitado"
    Então a situação da reserva passa para recusada
    E o professor Bruno recebe um aviso com o motivo "Sala em manutenção no horário solicitado"

  Cenário: Tentar recusar sem informar o motivo
    Dado que existe uma reserva pendente da professora Ana para o "Lab 1"
    Quando eu tento recusar a reserva sem escrever o motivo
    Então sou avisado de que o motivo é obrigatório
    E a situação da reserva permanece pendente

  Cenário: Autor cria uma nova reserva corrigida após a recusa
    Dado que a reserva do professor Bruno para o "Lab 1" foi recusada
    Quando o professor Bruno cria uma nova reserva ajustada para outro horário
    Então a nova reserva é registrada como pendente para análise
