# language: pt
# Rastreabilidade: US21.2 → F-21 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Filtragem, pesquisa e ações na fila

  Cenário: Filtro por sala
    Dado que há solicitações pendentes para várias salas
    Quando o administrador filtra pela sala "Lab 1"
    Então a fila mostra apenas solicitações da sala "Lab 1"

  Cenário: Aprovar atualiza a contagem de pendências
    Dado que há duas solicitações pendentes
    Quando o administrador aprova uma delas
    Então o contador de pendências passa a indicar uma solicitação
    E a solicitação aprovada sai da fila
