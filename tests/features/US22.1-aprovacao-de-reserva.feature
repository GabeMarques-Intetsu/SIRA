# language: pt
# Rastreabilidade: US22.1 → F-22 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Aprovação de reserva

  Cenário: Aprovar uma reserva pendente
    Dado que existe uma reserva pendente da professora Ana para o "Lab 1"
    Quando eu aprovo essa reserva
    Então a situação da reserva passa para aprovada
    E a professora Ana recebe um aviso automático informando a aprovação

  Cenário: Não aprovar uma reserva que já está aprovada
    Dado que existe uma reserva do professor Bruno para o "Lab 1" que já está aprovada
    Quando eu tento aprovar essa reserva novamente
    Então a ação de aprovar não está disponível
    E a situação da reserva permanece aprovada

  Cenário: Aprovação atualiza os demais painéis
    Dado que existe uma reserva pendente da professora Ana para o "Lab 1"
    Quando eu aprovo essa reserva
    Então o calendário, o painel e a fila passam a refletir a reserva aprovada imediatamente
