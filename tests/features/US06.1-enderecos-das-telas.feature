# language: pt
# Rastreabilidade: US06.1 → F-06 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Endereços das telas

  Cenário: Voltar e avançar entre telas visitadas
    Dado que Ana visitou a tela de Calendário e depois a tela de Nova Reserva
    Quando ela usa o comando de voltar do navegador
    Então o sistema a leva de volta à tela de Calendário
    E o comando de avançar a traz novamente à tela de Nova Reserva

  Cenário: Endereço inexistente leva a página não encontrada
    Dado que Bruno está conectado no sistema
    Quando ele tenta abrir um endereço que não corresponde a nenhuma tela
    Então o sistema apresenta a tela de página não encontrada

  Cenário: Recarregar mantém a mesma tela
    Dado que Ana está na tela de Minhas Reservas
    Quando ela recarrega a página
    Então o sistema a mantém na tela de Minhas Reservas
