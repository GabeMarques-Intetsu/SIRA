# language: pt
# Rastreabilidade: US10.1 → F-10 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Proteção e privacidade de informações pessoais

  Cenário: Usuário não enxerga dados de outro no mesmo navegador
    Dado que a professora "Ana" está logada e possui reservas cadastradas
    E o professor "Bruno" usa o mesmo navegador
    Quando "Bruno" faz login
    Então o sistema exibe apenas as reservas de "Bruno"
    E nenhuma reserva de "Ana" aparece

  Cenário: Dados pessoais permanecem após o logout
    Dado que "Ana" possui reservas e está logada
    Quando "Ana" sai do sistema e entra novamente
    Então suas reservas anteriores continuam disponíveis
