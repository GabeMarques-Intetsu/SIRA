# language: pt
# Rastreabilidade: US20.1 → F-20 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Exportação de reservas em planilha

  Cenário: Gerar planilha das reservas filtradas
    Dado que estou na lista das minhas reservas com três reservas exibidas
    Quando eu peço para gerar a planilha
    Então recebo um arquivo com as três reservas exibidas
    E cada reserva traz data, horário de início, horário de fim, sala, situação e justificativa

  Cenário: Tentar gerar planilha sem reservas na lista
    Dado que apliquei filtros que não retornaram nenhuma reserva
    Quando eu peço para gerar a planilha
    Então sou avisado de que não há dados para gerar a planilha
    E nenhum arquivo é gerado

  Cenário: Abrir a planilha com acentuação preservada
    Dado que gerei a planilha de uma reserva da sala "Laboratório de Informática" com a justificativa "Aula de revisão"
    Quando eu abro o arquivo em um editor de planilhas comum
    Então o conteúdo aparece corretamente com a acentuação preservada
