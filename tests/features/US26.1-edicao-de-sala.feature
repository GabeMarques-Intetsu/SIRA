# language: pt
# Rastreabilidade: US26.1 → F-26 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Edição de sala

  Cenário: Atualizar os dados de uma sala
    Dado que existe a sala "Lab 1" com capacidade "20"
    Quando eu altero a capacidade para "30" e atualizo os recursos
    Então a sala "Lab 1" passa a constar com capacidade "30" e os novos recursos

  Cenário: Tentar alterar a capacidade para um valor inválido
    Dado que existe a sala "Lab 1" com capacidade "30"
    Quando eu tento alterar a capacidade para "0"
    Então sou avisado de que a capacidade deve ser um número maior que zero
    E a capacidade da sala permanece "30"

  Cenário: Desativar uma sala preservando as reservas existentes
    Dado que a sala "Lab 1" possui uma reserva já confirmada da professora Ana
    Quando eu desativo a sala "Lab 1"
    Então a sala deixa de aceitar novas reservas
    E a reserva já confirmada da professora Ana permanece inalterada
