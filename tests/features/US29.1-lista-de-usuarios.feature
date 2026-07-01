# language: pt
# Rastreabilidade: US29.1 → F-29 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Lista de usuários

  Cenário: Administrador vê a lista completa de usuários
    Dado que estou autenticado como administrador
    Quando abro a tela de usuários cadastrados
    Então vejo todos os usuários com nome, e-mail e perfil
    E cada usuário oferece as ações de editar e excluir

  Cenário: Busca sem nenhum usuário correspondente
    Dado que estou na tela de usuários cadastrados
    Quando busco por "Zuleica"
    Então a lista fica vazia
    E vejo um aviso de que nenhum usuário foi encontrado

  Cenário: Filtro por perfil de professor
    Dado que estou na tela de usuários cadastrados
    Quando filtro pelo perfil de professor
    Então vejo apenas os usuários com perfil de professor
    E o usuário "Ana", de perfil professor, aparece na lista
