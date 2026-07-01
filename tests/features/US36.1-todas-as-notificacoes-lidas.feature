# language: pt
# Rastreabilidade: US36.1 → F-36 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Todas as notificações lidas

  Cenário: Professor marca todas as notificações como lidas
    Dado que tenho várias notificações por ler
    Quando uso a ação de marcar todas como lidas
    Então todas passam a constar como lidas
    E o contador de não lidas fica zerado

  Cenário: Ação não atinge notificações de outro usuário
    Dado que "Ana" e "Bruno" possuem notificações por ler
    Quando "Ana" marca todas as suas notificações como lidas
    Então as notificações de "Bruno" continuam por ler

  Cenário: Ação acionada sem notificações por ler
    Dado que não tenho nenhuma notificação por ler
    Quando uso a ação de marcar todas como lidas
    Então o contador de não lidas permanece zerado
