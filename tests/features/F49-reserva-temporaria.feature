# language: pt
# Rastreabilidade: F-49 (reserva temporária / hold) → RF-006/RF-008 ·
#   RNF-reserva-temporaria · CA01..CA10. Espelha a US49.1 do backlog.
# Natureza: SIMULAÇÃO DE DOMÍNIO — a regra de disponibilidade é modelada no
#   World com a MESMA semântica da RPC `check_resource_availability`:
#   bloqueiam (a) reserva pending/approved sobreposta, ou (b) hold VIVO
#   (expires_at > now) de OUTRO usuário sobreposto. O próprio solicitante
#   nunca é bloqueado pelo seu hold (exclusão por auth.uid()). `now` é fixo
#   e o TTL reusa HOLD_TTL_MINUTES/holdExpiry de @/lib/holds.
Funcionalidade: Reserva temporária do recurso durante a solicitação

  Cenário: Iniciar a solicitação torna o recurso indisponível para outro usuário (CA01/CA02)
    Dado que a professora "Ana" inicia uma solicitação da sala "Lab 1" para o horário das "14:00" às "16:00"
    Quando o professor "Bruno" verifica a disponibilidade da sala "Lab 1" no mesmo horário
    Então a sala "Lab 1" está indisponível para "Bruno"

  Cenário: O próprio solicitante não é bloqueado pelo seu hold (CA09)
    Dado que a professora "Ana" inicia uma solicitação da sala "Lab 1" para o horário das "14:00" às "16:00"
    Quando a professora "Ana" verifica a disponibilidade da sala "Lab 1" no mesmo horário
    Então a sala "Lab 1" está disponível para "Ana"

  Cenário: O bloqueio vale só para o horário escolhido (CA03)
    Dado que a professora "Ana" inicia uma solicitação da sala "Lab 1" para o horário das "14:00" às "16:00"
    Quando o professor "Bruno" verifica a disponibilidade da sala "Lab 1" no horário das "16:00" às "18:00"
    Então a sala "Lab 1" está disponível para "Bruno"

  Cenário: Abandonar a solicitação expira e libera o recurso (CA04/CA05)
    Dado que a professora "Ana" iniciou uma solicitação da sala "Lab 1" para o horário das "14:00" às "16:00"
    E o hold de "Ana" expirou após o prazo de 10 minutos
    Quando o professor "Bruno" verifica a disponibilidade da sala "Lab 1" no mesmo horário
    Então a sala "Lab 1" está disponível para "Bruno"

  Cenário: Liberar explicitamente (voltar) libera o recurso (CA08)
    Dado que a professora "Ana" inicia uma solicitação da sala "Lab 1" para o horário das "14:00" às "16:00"
    E "Ana" volta e libera o recurso
    Quando o professor "Bruno" verifica a disponibilidade da sala "Lab 1" no mesmo horário
    Então a sala "Lab 1" está disponível para "Bruno"

  Cenário: Solicitação pendente mantém o recurso indisponível (CA06)
    Dado que a professora "Ana" enviou a solicitação da sala "Lab 1" para o horário das "14:00" às "16:00"
    E a solicitação de "Ana" está pendente de decisão
    Quando o professor "Bruno" verifica a disponibilidade da sala "Lab 1" no mesmo horário
    Então a sala "Lab 1" está indisponível para "Bruno"

  Cenário: Solicitação aprovada segue indisponível (CA07)
    Dado que a professora "Ana" enviou a solicitação da sala "Lab 1" para o horário das "14:00" às "16:00"
    E a solicitação de "Ana" foi aprovada
    Quando o professor "Bruno" verifica a disponibilidade da sala "Lab 1" no mesmo horário
    Então a sala "Lab 1" está indisponível para "Bruno"

  Cenário: Solicitação recusada libera o recurso (CA08)
    Dado que a professora "Ana" enviou a solicitação da sala "Lab 1" para o horário das "14:00" às "16:00"
    E a solicitação de "Ana" foi recusada
    Quando o professor "Bruno" verifica a disponibilidade da sala "Lab 1" no mesmo horário
    Então a sala "Lab 1" está disponível para "Bruno"
