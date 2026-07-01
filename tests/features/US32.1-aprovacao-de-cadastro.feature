# language: pt
# Rastreabilidade: US32.1 → F-32 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Aprovação de cadastro

  Cenário: Administrador aprova um pedido de cadastro
    Dado que existe uma solicitação pendente de "Ana", com e-mail "ana@ifpb.edu.br"
    Quando aprovo a solicitação
    Então o usuário "Ana" é criado e habilitado a acessar
    E "Ana" é avisada de que já pode entrar
    E a solicitação sai da fila de pendentes

  Cenário: Pessoa sem perfil de administrador tenta aprovar
    Dado que estou autenticada como professora
    Quando tento abrir a fila de solicitações pendentes
    Então a ação de aprovar não fica disponível para mim

  Cenário: Fila de pendentes sem nenhuma solicitação
    Dado que não há solicitações de cadastro pendentes
    Quando abro a fila de pendentes
    Então vejo um aviso de que não há solicitações a aprovar
