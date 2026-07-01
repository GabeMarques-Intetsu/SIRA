# language: pt
# Rastreabilidade: US04.1 → F-04 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Encerramento de sessão

  Cenário: Sair leva à tela de acesso
    Dado que Ana está conectada na tela inicial
    Quando ela escolhe a opção de sair
    Então o sistema encerra a sessão dela
    E a leva para a tela de acesso

  Cenário: Dados da sessão somem da tela após sair
    Dado que Ana acabou de sair do sistema
    Quando a tela de acesso é exibida
    Então os dados pessoais da sessão de Ana deixam de ficar visíveis na tela

  Cenário: Sair de um usuário não afeta outro
    Dado que Ana e Bruno já usaram o sistema no mesmo computador
    Quando Ana sai da sessão dela
    Então os dados pessoais de Bruno permanecem preservados
    E ficam disponíveis quando ele entrar novamente
