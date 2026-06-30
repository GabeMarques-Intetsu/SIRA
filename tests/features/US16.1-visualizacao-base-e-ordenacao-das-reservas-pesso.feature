# language: pt
# Rastreabilidade: US16.1 → F-16 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Visualização base e ordenação das reservas pessoais

  Cenário: Lista mostra só as reservas do usuário, mais recentes primeiro
    Dado que a professora "Ana" possui várias reservas em datas diferentes
    Quando acessa "Minhas Reservas"
    Então vê apenas as suas reservas
    E elas aparecem ordenadas da mais recente para a mais antiga

  Cenário: Lista vazia exibe mensagem
    Dado que o professor não possui nenhuma reserva
    Quando acessa "Minhas Reservas"
    Então o sistema exibe "Nenhuma reserva encontrada"
