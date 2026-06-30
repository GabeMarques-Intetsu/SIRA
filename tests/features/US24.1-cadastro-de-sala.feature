# language: pt
# Rastreabilidade: US24.1 → F-24 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Cadastro de sala

  Cenário: Cadastrar uma nova sala com dados válidos
    Dado que estou na tela de cadastro de salas
    Quando eu informo o nome "Lab 2", a capacidade "30", os recursos disponíveis e a localização
    Então a sala "Lab 2" é cadastrada
    E fica imediatamente disponível para reserva

  Cenário: Tentar cadastrar sala com capacidade inválida
    Dado que estou na tela de cadastro de salas
    Quando eu informo o nome "Lab 2" e a capacidade "0"
    Então sou avisado de que a capacidade deve ser um número maior que zero
    E a sala não é cadastrada

  Cenário: Tentar cadastrar sala com nome já existente
    Dado que já existe uma sala chamada "Lab 1"
    Quando eu tento cadastrar uma nova sala com o nome "Lab 1"
    Então sou avisado de que já existe uma sala com esse nome
    E a sala não é cadastrada
