# language: pt
# Rastreabilidade: US13.1 → F-13 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Calendário semanal

  Cenário: Grade mostra dias, horários e reservas alocadas
    Dado que o professor abre o calendário semanal
    Quando a semana atual é exibida
    Então a grade apresenta os sete dias da semana e os horários das 7h às 19h
    E o horário das 14h ocupado mostra a sala Lab 1 e o autor da reserva
    E os horários livres aparecem visualmente distintos dos ocupados

  Cenário: Semana atual é destacada na grade
    Dado que o professor abre o calendário semanal
    Quando a grade é apresentada
    Então a semana atual aparece destacada visualmente em relação às demais

  Cenário: Navegação para a próxima semana
    Dado que o professor está vendo a semana atual no calendário
    Quando ele avança para a próxima semana
    Então a grade passa a mostrar os sete dias e horários da semana seguinte
    E é possível voltar para a semana anterior
