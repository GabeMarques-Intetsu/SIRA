# language: pt
# Rastreabilidade: US02.1 → F-02 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Continuidade de sessão

  Cenário: Recarregar a página mantém a conexão
    Dado que Ana entrou no sistema e está na tela inicial
    Quando ela recarrega a página
    Então ela continua conectada sem precisar informar e-mail e senha novamente

  Cenário: Encerramento impede restauração automática
    Dado que Ana encerrou a sessão dela
    Quando ela abre o sistema de novo
    Então o sistema não a reconecta automaticamente
    E apresenta a tela de acesso

  Cenário: Reabrir o navegador preserva perfil e permissões
    Dado que Bruno é professor e entrou no sistema
    Quando ele fecha e reabre o navegador enquanto a sessão ainda é válida
    Então ele continua conectado
    E mantém o perfil de professor e as mesmas permissões de antes
