# language: pt
# Rastreabilidade: US21.3 -> F-21 (indicadores da fila de aprovacoes)
Funcionalidade: Indicadores da fila de aprovações

  Cenário: Exibir o tempo médio de aprovação
    Dado que existem reservas já decididas no período
    Quando o administrador abre a fila de aprovações
    Então vê o tempo médio entre a criação da solicitação e a decisão

  Cenário: Indicadores atualizam ao decidir
    Dado que o administrador está com a fila aberta
    Quando aprova uma solicitação pendente
    Então os indicadores de pendentes e aprovadas se atualizam sem recarregar a página
