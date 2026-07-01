# language: pt
# Rastreabilidade: US08.1 → F-08 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Listas em tela pequena

  Cenário: Listagem vira cartões no celular
    Dado que Ana acessa Minhas Reservas pelo celular
    Quando a lista é exibida
    Então cada reserva aparece como um cartão empilhado
    E cada valor exibe o rótulo do campo correspondente

  Cenário: Sem rolagem para o lado
    Dado que Bruno consulta a lista de Aprovações pelo celular
    Quando a lista é exibida em cartões
    Então não é necessário rolar a tela para o lado para ver as informações

  Cenário: Tabela completa em tela grande
    Dado que Ana acessa a lista de Salas em um computador de tela grande
    Quando a lista é exibida
    Então as informações voltam a aparecer no formato de tabela
