# F-20 — Exportação de reservas para CSV

> **Tipo**: Feature
> **Epic pai**: [EP-07 Minhas Reservas (CRUD)](../epics/EP-07-minhas-reservas-crud.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟢 Baixa
> **Origem (requisitos)**: [RF-007](../../requirements/RF/RF-007-gestao-das-proprias-reservas.md)
> **Origem (OpenProject)**: #27535

---

## Descrição (visão de produto)

Gera um arquivo de planilha com as reservas atualmente filtradas na listagem (data, horário, sala, status e justificativa), compatível com os editores de planilha mais comuns e com a acentuação preservada.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-007](../../requirements/RF/RF-007-gestao-das-proprias-reservas.md) | Gestão das próprias reservas | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Exportação das reservas`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | A exportação gera um arquivo com as reservas atualmente filtradas na lista. | — | 📝 |
| **CA02** | O arquivo contém data, horário de início, horário de fim, sala, status e justificativa. | — | 📝 |
| **CA03** | O arquivo abre corretamente em planilhas comuns, com acentuação preservada. | — | 📝 |
| **CA04** | Se a lista filtrada estiver vazia, a exportação avisa que não há dados para exportar. | — | 📝 |

## User Stories

### US20.1 — Planilha das próprias reservas

> **Como** professor, **quero** gerar uma planilha com as reservas que estou vendo na lista, **para** guardar e compartilhar meu histórico de reservas fora do sistema.

#### Cenários BDD

```gherkin
# language: pt
Funcionalidade: Exportação de reservas em planilha

  Cenário: Gerar planilha das reservas filtradas
    Dado que estou na lista das minhas reservas com três reservas exibidas
    Quando eu peço para gerar a planilha
    Então recebo um arquivo com as três reservas exibidas
    E cada reserva traz data, horário de início, horário de fim, sala, situação e justificativa

  Cenário: Tentar gerar planilha sem reservas na lista
    Dado que apliquei filtros que não retornaram nenhuma reserva
    Quando eu peço para gerar a planilha
    Então sou avisado de que não há dados para gerar a planilha
    E nenhum arquivo é gerado

  Cenário: Abrir a planilha com acentuação preservada
    Dado que gerei a planilha de uma reserva da sala "Laboratório de Informática" com a justificativa "Aula de revisão"
    Quando eu abro o arquivo em um editor de planilhas comum
    Então o conteúdo aparece corretamente com a acentuação preservada
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #29295
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Exportação de reservas em planilha

  Cenário: Gerar planilha das reservas filtradas
    Dado que estou na lista das minhas reservas com três reservas exibidas
    Quando eu peço para gerar a planilha
    Então recebo um arquivo com as três reservas exibidas
    E cada reserva traz data, horário de início, horário de fim, sala, situação e justificativa

  Cenário: Tentar gerar planilha sem reservas na lista
    Dado que apliquei filtros que não retornaram nenhuma reserva
    Quando eu peço para gerar a planilha
    Então sou avisado de que não há dados para gerar a planilha
    E nenhum arquivo é gerado

  Cenário: Abrir a planilha com acentuação preservada
    Dado que gerei a planilha de uma reserva da sala "Laboratório de Informática" com a justificativa "Aula de revisão"
    Quando eu abro o arquivo em um editor de planilhas comum
    Então o conteúdo aparece corretamente com a acentuação preservada
```

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T20.1.1 | Em exportCSV() de reservations.js, montar o array de linhas a partir da lista atualmente filtrada (mesmo conjunto exibido em refreshTable), e não da coleção completa (CA01). | ⏳ |
| T20.1.2 | Gerar o conteúdo CSV com colunas data, horário de início, horário de fim, sala, status e justificativa, escapando aspas/quebras de linha (CA02). | ⏳ |
| T20.1.3 | Prefixar o conteúdo com BOM UTF-8 (\uFEFF) e criar o Blob com type 'text/csv;charset=utf-8' para preservar acentuação ao abrir em planilhas (CA03). | ⏳ |
| T20.1.4 | Antes de gerar o arquivo, se a lista filtrada estiver vazia, exibir toast() avisando que não há dados e abortar sem criar o Blob (CA04). | ⏳ |
| T20.1.5 | Disparar o download via URL.createObjectURL(blob) em link <a download>, e chamar URL.revokeObjectURL() após o clique para liberar memória (CA01). | ⏳ |

