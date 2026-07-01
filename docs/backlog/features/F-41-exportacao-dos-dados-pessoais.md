# F-41 — Exportação dos dados pessoais

> **Tipo**: Feature
> **Epic pai**: [EP-12 Configurações da Conta](../epics/EP-12-configuracoes-da-conta.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-012](../../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md)

---

## Descrição (visão de produto)

Na Zona de risco, a pessoa pode exportar seus próprios dados (perfil e reservas) em um arquivo, atendendo ao direito de portabilidade da LGPD. A exportação reúne apenas os dados da própria pessoa.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-012](../../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md) | Configurações da conta e preferências | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Exportar meus dados`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | A pessoa pode exportar seus dados pessoais em um arquivo para download. | — | 📝 |
| **CA02** | A exportação inclui o perfil e as reservas da própria pessoa. | — | 📝 |
| **CA03** | A exportação não inclui dados de outras pessoas. | — | 📝 |
| **CA04** | O arquivo gerado tem nome e formato legíveis (ex.: contendo identificação e data da exportação). | — | 📝 |

## User Stories

### US41.1 — Exportação dos próprios dados

> **Como** pessoa usuária do sistema, **quero** baixar uma cópia dos meus dados, **para** exercer meu direito de portabilidade previsto na LGPD.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Exportação dos dados pessoais

  Cenário: Exportar meus dados
    Dado que estou na seção Zona de risco
    Quando aciono "Exportar meus dados"
    Então é gerado um arquivo para download com meu perfil e minhas reservas

  Cenário: Exportação não vaza dados de terceiros
    Dado que existem reservas de outras pessoas no sistema
    Quando exporto meus dados
    Então o arquivo contém apenas dados meus
    E não contém dados de outras pessoas
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA01, CA02, CA03, CA04

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T41.1.1 | Reunir os dados do usuário atual (perfil + reservas filtradas pelo seu id) e serializar em um arquivo para download (CA01, CA02). | ⏳ |
| T41.1.2 | Garantir o isolamento por usuário na coleta dos dados, sem incluir registros de terceiros, conforme RNF-seguranca-privacidade (CA03). | ⏳ |
| T41.1.3 | Nomear o arquivo com identificação do usuário e data da exportação (CA04). | ⏳ |
