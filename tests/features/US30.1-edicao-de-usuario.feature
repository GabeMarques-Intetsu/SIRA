# language: pt
# Rastreabilidade: US30.1 → F-30 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Edição de usuário

  Cenário: Administrador altera nome e perfil de um usuário
    Dado que estou editando o usuário "Ana"
    Quando troco o nome para "Ana Paula" e o perfil para administrador
    E confirmo a alteração
    Então os novos dados de "Ana Paula" ficam salvos

  Cenário: Tentativa de alterar o e-mail de um usuário
    Dado que estou editando o usuário "Bruno"
    Quando abro o formulário de edição
    Então o campo de e-mail aparece bloqueado para alteração
    E só posso modificar nome, perfil e senha

  Cenário: Administrador redefine a senha de um usuário
    Dado que estou editando o usuário "Bruno"
    Quando informo uma nova senha e confirmo
    Então a nova senha de "Bruno" passa a valer no próximo acesso dele
