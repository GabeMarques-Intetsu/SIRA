# language: pt
# Rastreabilidade: US33.1 → F-33 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Recusa de cadastro

  Cenário: Administrador recusa um pedido com justificativa
    Dado que existe uma solicitação pendente de "Bruno"
    Quando recuso a solicitação informando o motivo "E-mail não pertence à instituição"
    Então "Bruno" é avisado do motivo da recusa
    E o usuário "Bruno" não é criado
    E a solicitação sai da fila de pendentes

  Cenário: Tentativa de recusar sem informar o motivo
    Dado que estou recusando a solicitação de "Bruno"
    Quando confirmo a recusa sem escrever uma justificativa
    Então o sistema não conclui a recusa
    E me pede para informar o motivo

  Cenário: Solicitante consulta o motivo da recusa
    Dado que a solicitação de "Bruno" foi recusada com o motivo "E-mail não pertence à instituição"
    Quando "Bruno" verifica o aviso recebido
    Então ele lê o motivo informado pelo administrador
