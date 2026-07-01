# language: pt
# Rastreabilidade: US31.1 → F-31 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Exclusão de usuário

  Cenário: Administrador exclui um usuário após confirmar
    Dado que estou prestes a excluir o usuário "Bruno"
    Quando confirmo a exclusão
    Então "Bruno" deixa de constar na lista de usuários
    E "Bruno" não consegue mais acessar o sistema
    E as reservas de "Bruno" continuam preservadas e marcadas

  Cenário: Exclusão cancelada na confirmação
    Dado que iniciei a exclusão do usuário "Ana"
    Quando desisto na tela de confirmação
    Então "Ana" continua cadastrada e com acesso normal

  Cenário: Recomendação de desativar quando há histórico extenso
    Dado que o usuário "Ana" possui um histórico extenso de reservas
    Quando inicio a exclusão de "Ana"
    Então o sistema recomenda desativar a conta em vez de excluí-la
