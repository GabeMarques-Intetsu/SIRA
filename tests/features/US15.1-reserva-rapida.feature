# language: pt
# Rastreabilidade: US15.1 → F-15 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Reserva rápida

  Cenário: Reserva em um clique entra como pendente com confirmação
    Dado que a professora Ana está no detalhe do Lab 1 com o horário das 14h livre
    Quando ela reserva esse horário em um único passo
    Então a reserva é criada como pendente no fluxo de aprovação
    E Ana recebe uma confirmação visível da ação

  Cenário: Reserva rápida bloqueada por conflito de horário
    Dado que a professora Ana está no detalhe do Lab 1 com o horário das 14h já ocupado
    Quando ela tenta reservar esse horário em um único passo
    Então a reserva não é criada
    E o sistema informa que o horário está em conflito com outra reserva

  Cenário: Reserva rápida respeita as mesmas regras de conflito da busca
    Dado que o professor Bruno está no detalhe do Lab 1 com o horário das 16h livre
    Quando ele reserva esse horário em um único passo
    Então a reserva entra como pendente seguindo as mesmas regras de conflito aplicadas na busca
