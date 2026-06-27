# language: pt
# Rastreabilidade: US16.2 → F-16 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Filtragem combinada, busca por texto e otimização

  Cenário: Filtros por status e período combinam
    Dado que "Ana" tem reservas aprovadas e pendentes em vários períodos
    Quando filtra por status "aprovada" e período "mês corrente"
    Então a lista mostra apenas reservas aprovadas do mês corrente

  Cenário: Busca por nome de sala
    Dado que "Ana" tem reservas em diferentes salas
    Quando digita "Lab 1" na busca
    Então a lista mostra apenas reservas da sala "Lab 1"
