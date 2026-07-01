# language: pt
# Rastreabilidade: US28.1 → F-28 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Cadastro de usuário

  Cenário: Criar um usuário com dados válidos
    Dado que estou na tela de cadastro de usuários
    Quando eu informo o nome "Ana", o e-mail "ana@ifpb.edu.br", o perfil de professor e uma senha inicial
    Então o usuário "Ana" é criado
    E já fica ativo, sem passar pela aprovação de solicitação

  Cenário: Tentar criar usuário com e-mail já existente
    Dado que já existe um usuário com o e-mail "ana@ifpb.edu.br"
    Quando eu tento criar um novo usuário com o e-mail "ana@ifpb.edu.br"
    Então sou avisado de que já existe um usuário com esse e-mail
    E o usuário não é criado

  Cenário: Tentar criar usuário sem informar o perfil
    Dado que estou na tela de cadastro de usuários
    Quando eu informo o nome "Bruno", o e-mail "bruno@ifpb.edu.br" e a senha inicial, mas não escolho o perfil
    Então sou avisado de que o perfil é obrigatório
    E o usuário não é criado
