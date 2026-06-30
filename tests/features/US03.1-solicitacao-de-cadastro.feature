# language: pt
# Rastreabilidade: US03.1 → F-03 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Solicitação de cadastro

  Cenário: Envio de solicitação completa
    Dado que Ana está na tela de acesso e abre o formulário de solicitação de cadastro
    Quando ela informa nome, o e-mail "ana@ifpb.edu.br", o departamento e uma senha e envia
    Então o sistema registra a solicitação como pendente de aprovação
    E avisa Ana de que o pedido aguarda análise do administrador

  Cenário: Solicitação com e-mail de outro domínio
    Dado que Bruno abriu o formulário de solicitação de cadastro
    Quando ele informa o e-mail "bruno@hotmail.com" e envia
    Então o sistema recusa a solicitação
    E exibe um aviso de que somente e-mails institucionais são aceitos

  Cenário: Acesso bloqueado enquanto pendente
    Dado que a solicitação de Ana com o e-mail "ana@ifpb.edu.br" está pendente de aprovação
    Quando ela tenta entrar no sistema com esse e-mail e a senha informada
    Então o sistema não permite o acesso
    E informa que o cadastro ainda aguarda aprovação
