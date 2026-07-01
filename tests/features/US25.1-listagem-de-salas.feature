# language: pt
# Rastreabilidade: US25.1 → F-25 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Listagem de salas

  Cenário: Visualizar as salas com capacidade e recursos
    Dado que existem as salas "Lab 1" e "Lab 2" cadastradas
    Quando eu abro a listagem de salas
    Então vejo cada sala com sua capacidade e seus recursos
    E vejo a quantidade de reservas atuais e próximas de cada sala

  Cenário: Filtrar salas por situação e recurso sem resultados
    Dado que nenhuma sala ativa possui o recurso "projetor"
    Quando eu filtro por salas ativas com o recurso "projetor"
    Então a listagem aparece vazia
    E sou informado de que nenhuma sala atende ao filtro

  Cenário: Diferenciar salas inativas das ativas
    Dado que a sala "Lab 1" está ativa e a sala "Lab 2" está inativa
    Quando eu abro a listagem de salas
    Então a sala "Lab 2" aparece visualmente diferenciada como inativa
