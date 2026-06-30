# language: pt
# Rastreabilidade: US17.1 → F-17 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Detalhe da reserva

  Cenário: Detalhe mostra os dados e o histórico de aprovação
    Dado que a professora Ana tem uma reserva do Lab 1 às 14h já aprovada
    Quando ela abre o detalhe dessa reserva a partir da listagem
    Então o detalhe mostra a sala, o horário, o status, a justificativa e os recursos solicitados
    E mostra o histórico de aprovação com o responsável e a data

  Cenário: Professor não acessa o detalhe de reserva de outra pessoa
    Dado que a professora Ana está conectada ao sistema
    Quando ela tenta abrir o detalhe de uma reserva do professor Bruno
    Então o sistema não exibe o detalhe
    E informa que ela só pode acessar as próprias reservas

  Cenário: Detalhe acessível a partir de uma notificação
    Dado que a professora Ana recebeu uma notificação sobre a sua reserva do Lab 1
    Quando ela abre essa notificação
    Então o detalhe da reserva correspondente é apresentado
