# language: pt
# Rastreabilidade: US09.1 → F-09 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Tema da interface

  Cenário: Usuário ativa o tema escuro e a escolha é lembrada
    Dado que Ana está usando o sistema no tema claro
    Quando ela aciona o controle de troca de tema para escuro
    Então toda a interface passa a ser exibida no tema escuro
    E ao entrar novamente no sistema o tema escuro continua aplicado

  Cenário: Tema aplicado já no carregamento sem piscar a cor errada
    Dado que Bruno deixou o tema escuro definido no acesso anterior
    Quando ele abre o sistema novamente
    Então a tela aparece diretamente no tema escuro
    E não há nenhum instante em que a cor clara errada é mostrada

  Cenário: Troca de tema afeta todas as telas de forma consistente
    Dado que Ana ativou o tema escuro na tela inicial
    Quando ela navega para a tela de minhas reservas e para o calendário
    Então todas essas telas são exibidas no tema escuro de forma consistente
