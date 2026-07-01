# language: pt
# Rastreabilidade: US10.2 → F-10 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Resiliência contra falhas de armazenamento

  Cenário: Armazenamento cheio é tratado com aviso amigável
    Dado que o armazenamento do navegador está cheio
    Quando o usuário tenta salvar uma nova reserva
    Então o sistema exibe uma mensagem amigável de armazenamento cheio
    E não trava nem perde os dados já salvos

  Cenário: Acesso a dado de outro usuário não retorna nada
    Dado que o usuário "Bruno" está logado
    Quando o sistema tenta acessar um dado pertencente a "Ana"
    Então nada é retornado
