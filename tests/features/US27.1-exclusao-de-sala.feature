# language: pt
# Rastreabilidade: US27.1 → F-27 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Exclusão de sala

  Cenário: Excluir uma sala sem reservas futuras
    Dado que a sala "Lab 1" não possui reservas futuras
    Quando eu solicito a exclusão e confirmo a operação
    Então a sala "Lab 1" é excluída
    E deixa de aparecer nas listagens e na busca

  Cenário: Tentar excluir uma sala com reservas futuras
    Dado que a sala "Lab 1" possui uma reserva futura da professora Ana
    Quando eu solicito a exclusão da sala "Lab 1"
    Então a exclusão é bloqueada
    E sou orientado a migrar ou cancelar as reservas antes de excluir

  Cenário: Desistir da exclusão na confirmação
    Dado que a sala "Lab 2" não possui reservas futuras
    Quando eu solicito a exclusão e não confirmo a operação
    Então a sala "Lab 2" continua disponível nas listagens e na busca
