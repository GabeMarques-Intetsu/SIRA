# language: pt
# Rastreabilidade: US05.1 → F-05 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Menu por perfil

  Cenário: Professor vê apenas suas seções
    Dado que Ana entrou no sistema como professora
    Quando ela observa o menu lateral
    Então ela vê Minhas Reservas, Nova Reserva, Calendário e Notificações
    E não vê as seções de gestão do administrador

  Cenário: Administrador vê as seções de gestão
    Dado que Bruno entrou no sistema como administrador
    Quando ele observa o menu lateral
    Então ele vê as seções Salas, Usuários, Aprovações e Painel

  Cenário: Contador de pendências junto ao item
    Dado que Ana tem 3 notificações ainda não lidas
    Quando ela observa o item Notificações no menu lateral
    Então o número 3 aparece ao lado do item
    E reflete a quantidade real de pendências
