# language: pt
# Rastreabilidade: US35.1 → F-35 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Notificação lida

  Cenário: Professor marca uma notificação como lida
    Dado que tenho uma notificação por ler no painel
    Quando clico nessa notificação
    Então ela passa a constar como lida
    E o contador de não lidas diminui em uma unidade

  Cenário: Notificação ligada a uma reserva leva ao detalhe
    Dado que recebi uma notificação sobre minha reserva
    Quando clico nessa notificação
    Então sou levado ao detalhe da reserva relacionada

  Cenário: Notificação sem item relacionado apenas é lida
    Dado que recebi um aviso geral sem reserva associada
    Quando clico nesse aviso
    Então ele é marcado como lido
    E permaneço no painel de notificações
