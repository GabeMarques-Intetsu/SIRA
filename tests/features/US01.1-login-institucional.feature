# language: pt
# Rastreabilidade: US01.1 → F-01 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Login institucional

  Cenário: Acesso com credenciais válidas
    Dado que Ana tem uma conta ativa com o e-mail "ana@ifpb.edu.br"
    Quando ela informa o e-mail "ana@ifpb.edu.br" e a senha correta e confirma o acesso
    Então o sistema a leva para a tela inicial do perfil dela

  Cenário: Acesso com e-mail de outro domínio
    Dado que Bruno está na tela de acesso
    Quando ele informa o e-mail "bruno@gmail.com" e uma senha e confirma o acesso
    Então o sistema recusa a entrada
    E exibe um aviso de que somente e-mails institucionais são aceitos

  Cenário: Acesso de conta inativa
    Dado que Ana tem uma conta inativa com o e-mail "ana@ifpb.edu.br"
    Quando ela informa o e-mail "ana@ifpb.edu.br" e a senha correta e confirma o acesso
    Então o sistema recusa a entrada
    E exibe um aviso de que a conta está inativa
