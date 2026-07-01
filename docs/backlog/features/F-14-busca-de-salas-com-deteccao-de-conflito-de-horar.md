# F-14 — Busca de salas com detecção de conflito de horário

> **Tipo**: Feature
> **Epic pai**: [EP-06 Nova Reserva](../epics/EP-06-nova-reserva.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟠 Alta
> **Origem (requisitos)**: [RF-006](../../requirements/RF/RF-006-solicitacao-de-reserva-com-checagem-de-disponibi.md)
> **Origem (OpenProject)**: #27375

---

## Descrição (visão de produto)

Tela onde o usuário informa data, horário e recursos desejados e o sistema devolve apenas as salas disponíveis (sem conflito de horário) que atendem a todos os critérios, ordenadas por capacidade.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-006](../../requirements/RF/RF-006-solicitacao-de-reserva-com-checagem-de-disponibi.md) | Solicitação de reserva com checagem de disponibilidade | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Busca e disponibilidade`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | O formulário aceita data, horário de início, horário de fim e os recursos desejados. | — | 📝 |
| **CA02** | O horário de início deve ser anterior ao de fim; caso contrário, é exibido aviso. | — | 📝 |
| **CA03** | A data informada deve ser igual ou posterior ao dia atual. | — | 📝 |
| **CA04** | Os resultados não incluem salas com reserva aprovada que conflite com o horário informado. | — | 📝 |
| **CA05** | Reservas pendentes também são consideradas como conflito. | — | 📝 |
| **CA06** | Reservas canceladas ou recusadas não geram conflito. | — | 📝 |
| **CA07** | Só aparecem salas que possuam todos os recursos selecionados. | — | 📝 |
| **CA08** | Salas inativas nunca aparecem nos resultados. | — | 📝 |
| **CA09** | Conflito parcial de horário (sobreposição) também elimina a sala. | — | 📝 |
| **CA10** | Os resultados aparecem ordenados por capacidade crescente por padrão. | — | 📝 |
| **CA11** | Quando nenhuma sala atende, é exibida a mensagem "Nenhuma sala disponível para os critérios". | — | 📝 |

## User Stories

### US14.1 — Interface de Filtros e Restrições Básicas de Horários

> **Como** professor solicitante
> **Quero** filtrar as salas informando data, intervalo de horários e recursos de infraestrutura necessários
> **Para** obter uma listagem limpa e ordenada das opções compatíveis.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Interface de filtros e restrições básicas de horários

  Cenário: Busca com critérios válidos lista salas compatíveis
    Dado que o professor está na tela de nova reserva
    Quando informa a data de amanhã, das 14h às 16h, e marca o recurso "datashow"
    E confirma a busca
    Então o sistema lista apenas salas com datashow disponíveis no horário
    E as salas aparecem ordenadas por capacidade crescente

  Cenário: Horário de início posterior ao fim é barrado
    Dado que o professor está na tela de nova reserva
    Quando informa início às 16h e fim às 14h
    Então o sistema exibe aviso de horário inválido
    E não realiza a busca

  Cenário: Data anterior a hoje é barrada
    Dado que o professor está na tela de nova reserva
    Quando informa uma data anterior ao dia atual
    Então o sistema exibe aviso de data inválida
```.

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #28342
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05, CA06, CA07, CA08, CA09, CA10, CA11

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Interface de filtros e restrições básicas de horários

  Cenário: Busca com critérios válidos lista salas compatíveis
    Dado que o professor está na tela de nova reserva
    Quando informa a data de amanhã, das 14h às 16h, e marca o recurso "datashow"
    E confirma a busca
    Então o sistema lista apenas salas com datashow disponíveis no horário
    E as salas aparecem ordenadas por capacidade crescente

  Cenário: Horário de início posterior ao fim é barrado
    Dado que o professor está na tela de nova reserva
    Quando informa início às 16h e fim às 14h
    Então o sistema exibe aviso de horário inválido
    E não realiza a busca

  Cenário: Data anterior a hoje é barrada
    Dado que o professor está na tela de nova reserva
    Quando informa uma data anterior ao dia atual
    Então o sistema exibe aviso de data inválida
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T14.1.1 | Montar o formulário de busca em renderNovaReserva(page) (src/modules/novaReserva.js) com campos de data, horário de início, horário de fim e checkboxes de recursos, usando el() e formField(). | ⏳ |
| T14.1.2 | Validar antes de buscar: usar parseTimeStr() para barrar início >= fim com aviso de horário inválido, e parseDateLocal() para barrar data anterior ao dia atual com aviso de data inválida, sem disparar a busca. | ⏳ |
| T14.1.3 | Em searchRooms(type, container, formData), filtrar getRooms() removendo salas inativas e mantendo apenas as que possuem todos os recursos selecionados em formData. | ⏳ |
| T14.1.4 | Ordenar os resultados de searchRooms() por capacidade crescente e, quando o filtro resultar em lista vazia, renderizar a mensagem 'Nenhuma sala disponível para os critérios' via el(). | ⏳ |

### US14.2 — Motor Lógico de Detecção de Conflito e Ocupação

> **Como** professor solicitante
> **Quero** que o mecanismo de busca filtre e remova de forma automática qualquer sala que possua choque de horários parciais ou totais com reservas aprovadas ou pendentes
> **Para** evitar duplicidade de agendamento.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Detecção de conflito e ocupação

  Cenário: Sala com reserva aprovada conflitante é excluída
    Dado que a sala "Lab 1" tem uma reserva aprovada das 14h às 15h
    Quando o professor busca salas para o intervalo das 14h30 às 16h
    Então "Lab 1" não aparece nos resultados

  Cenário: Reserva pendente também gera conflito
    Dado que a sala "Lab 2" tem uma reserva pendente das 14h às 16h
    Quando o professor busca salas para esse mesmo horário
    Então "Lab 2" não aparece nos resultados

  Cenário: Reserva recusada não gera conflito
    Dado que a sala "Lab 3" tem apenas uma reserva recusada das 14h às 16h
    Quando o professor busca salas para esse horário
    Então "Lab 3" aparece nos resultados
```.

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #28343
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05, CA06, CA07, CA08, CA09, CA10, CA11

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Detecção de conflito e ocupação

  Cenário: Sala com reserva aprovada conflitante é excluída
    Dado que a sala "Lab 1" tem uma reserva aprovada das 14h às 15h
    Quando o professor busca salas para o intervalo das 14h30 às 16h
    Então "Lab 1" não aparece nos resultados

  Cenário: Reserva pendente também gera conflito
    Dado que a sala "Lab 2" tem uma reserva pendente das 14h às 16h
    Quando o professor busca salas para esse mesmo horário
    Então "Lab 2" não aparece nos resultados

  Cenário: Reserva recusada não gera conflito
    Dado que a sala "Lab 3" tem apenas uma reserva recusada das 14h às 16h
    Quando o professor busca salas para esse horário
    Então "Lab 3" aparece nos resultados
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T14.2.1 | Em searchRooms()/expandReservationDates() (src/modules/novaReserva.js), carregar as reservas existentes das salas candidatas e comparar intervalos com parseTimeStr() para detectar sobreposição total ou parcial de horário. | ⏳ |
| T14.2.2 | Considerar como conflito apenas reservas com status 'approved' ou 'pending', excluindo a sala dos resultados; ignorar reservas com status 'rejected' ou 'cancelled' (não geram conflito). | ⏳ |
| T14.2.3 | Implementar a checagem de sobreposição como predicado puro (início < fimExistente && fim > inícioExistente) aplicado via Array.filter, removendo qualquer sala com choque do conjunto retornado por searchRooms(). | ⏳ |
| T14.2.4 | Garantir que o motor de conflito seja a mesma função reutilizável usada também pela reserva express (performReservation), mantendo regra única de detecção de ocupação. | ⏳ |

---

## Ampliação (mockups) — Assistente em 4 passos, tipo de recurso e recorrência

> **Tipo**: Enriquecimento aditivo a partir do mockup `docs/mockups/04-nova-reserva.html`.
> Não altera as CAs/US existentes acima; adiciona o fluxo guiado, a escolha de tipo de recurso (sala ou equipamento) e a recorrência.

### CAs adicionais

**Grupo:** `CA - Assistente em 4 passos`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA12** | A nova reserva é conduzida em um assistente de quatro passos: (1) escolher o tipo de recurso, (2) informar data e horário, (3) escolher o recurso disponível, (4) revisar e confirmar. | — | 📝 |
| **CA13** | O passo seguinte só é liberado quando o passo atual está válido; é possível voltar ao passo anterior sem perder os dados já informados. | — | 📝 |
| **CA14** | O passo de revisão mostra um resumo de tudo o que foi escolhido antes de confirmar. | — | 📝 |

**Grupo:** `CA - Tipo de recurso`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA15** | No primeiro passo, a pessoa escolhe reservar uma sala ou um equipamento. | — | 📝 |
| **CA16** | A busca do passo 3 lista apenas recursos do tipo escolhido e disponíveis (sem conflito, ativos). | — | 📝 |

**Grupo:** `CA - Recorrência`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA17** | A pessoa pode marcar a reserva como recorrente, escolhendo entre diária, semanal ou personalizada. | — | 📝 |
| **CA18** | A recorrência gera as ocorrências dentro do intervalo definido; ocorrências em conflito são sinalizadas antes de confirmar. | — | 📝 |
| **CA19** | A reserva sem recorrência (única) continua sendo o comportamento padrão. | — | 📝 |

### User Stories adicionais

#### US14.3 — Assistente guiado de nova reserva em quatro passos

> **Como** professor, **quero** ser guiado em quatro passos ao criar uma reserva, **para** preencher cada parte com clareza e revisar antes de confirmar.

```gherkin
# language: pt
Funcionalidade: Assistente de nova reserva em quatro passos

  Cenário: Avançar pelos quatro passos até confirmar
    Dado que inicio uma nova reserva
    Quando escolho o tipo "Sala", informo data e horário válidos, seleciono uma sala disponível e reviso o resumo
    E confirmo no quarto passo
    Então a reserva é criada como pendente

  Cenário: Passo inválido bloqueia o avanço
    Dado que estou no passo de data e horário
    Quando informo um horário inválido
    Então não consigo avançar para o passo seguinte
    E sou avisado do que precisa ser corrigido

  Cenário: Voltar preserva os dados
    Dado que estou no passo de escolha do recurso
    Quando volto ao passo de data e horário
    Então a data e o horário já informados continuam preenchidos
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA12, CA13, CA14, CA15, CA16

#### US14.4 — Reserva recorrente

> **Como** professor, **quero** criar uma reserva que se repete (diária, semanal ou personalizada), **para** não precisar repetir o mesmo agendamento manualmente.

```gherkin
# language: pt
Funcionalidade: Reserva recorrente

  Cenário: Criar reserva semanal recorrente
    Dado que estou criando uma reserva
    Quando marco recorrência "Semanal" por quatro semanas
    Então o sistema prepara uma ocorrência por semana no horário escolhido

  Cenário: Conflito em uma ocorrência é sinalizado antes de confirmar
    Dado que defini uma recorrência semanal
    Quando uma das semanas tem o recurso já ocupado no horário
    Então essa ocorrência é sinalizada como em conflito antes de eu confirmar

  Cenário: Reserva única permanece o padrão
    Dado que estou criando uma reserva
    Quando não marco nenhuma recorrência
    Então é criada uma única reserva
```

- **Prioridade**: 🟢 Baixa · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA17, CA18, CA19

#### Tasks adicionais (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T14.3.1 | Refatorar renderNovaReserva(page) para um assistente de 4 passos (stepper) com estado por passo e navegação avançar/voltar preservando formData (CA12, CA13, CA14). | ⏳ |
| T14.3.2 | Adicionar no passo 1 a escolha de tipo (sala/equipamento) e fazer searchRooms()/searchEquipments() filtrar a busca do passo 3 pelo tipo escolhido (CA15, CA16). | ⏳ |
| T14.4.1 | Implementar opções de recorrência (diária/semanal/personalizada) e expandir as ocorrências dentro do intervalo via expandReservationDates() (CA17, CA19). | ⏳ |
| T14.4.2 | Aplicar o motor de conflito a cada ocorrência da recorrência e sinalizar as ocorrências em conflito no passo de revisão antes de confirmar (CA18). | ⏳ |

