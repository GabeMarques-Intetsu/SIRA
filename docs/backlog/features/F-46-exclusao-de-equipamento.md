# F-46 — Exclusão de equipamento

> **Tipo**: Feature
> **Epic pai**: [EP-09 Gestão de Recursos (Salas e Equipamentos)](../epics/EP-09-gestao-de-salas-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md)

---

## Descrição (visão de produto)

Permite ao administrador excluir um equipamento do catálogo. Por segurança, não é possível excluir equipamento com reservas futuras; a exclusão exige confirmação.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                           | Requisito                          | Relação |
| ---------------------------------------------------------------------------- | ---------------------------------- | ------- |
| [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md) | Gestão do catálogo de equipamentos | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Exclusão de equipamento`

| ID       | Critério                                                                            | Como verificar | Status |
| -------- | ----------------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | A exclusão é acessível apenas ao administrador.                                     | —              | 📝     |
| **CA02** | A exclusão exige uma confirmação explícita.                                         | —              | 📝     |
| **CA03** | Não é permitido excluir equipamento com reservas futuras; é exibido aviso.          | —              | 📝     |
| **CA04** | Após excluído, o equipamento deixa de aparecer na listagem e na busca para reserva. | —              | 📝     |
| **CA05** | A pessoa pode cancelar a confirmação e o equipamento não é excluído.                | —              | 📝     |

## User Stories

### US46.1 — Exclusão de equipamento

> **Como** administrador, **quero** excluir um equipamento sem reservas futuras, **para** manter o catálogo limpo sem afetar agendamentos existentes.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Exclusão de equipamento

  Cenário: Excluir equipamento sem reservas futuras
    Dado que o equipamento "Notebook 07" não possui reservas futuras
    Quando aciono a exclusão e confirmo
    Então o equipamento é excluído
    E deixa de aparecer na listagem e na busca para reserva

  Cenário: Bloquear exclusão com reservas futuras
    Dado que o equipamento "Projetor 04" possui reservas futuras
    Quando tento excluí-lo
    Então sou avisado de que não é possível excluir equipamento com reservas futuras
    E o equipamento não é excluído

  Cenário: Cancelar a exclusão
    Dado que aciono a exclusão de um equipamento
    Quando cancelo na confirmação
    Então o equipamento não é excluído
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                              | Status |
| ------- | ----------------------------------------------------------------------------------------------------------------- | ------ |
| T46.1.1 | Restringir a exclusão a administradores e exibir diálogo de confirmação com opção de cancelar (CA01, CA02, CA05). | ⏳     |
| T46.1.2 | Verificar reservas futuras do equipamento antes de excluir e bloquear com aviso caso existam (CA03).              | ⏳     |
| T46.1.3 | Remover o equipamento via deleteEquipment() e atualizar a grade e a base de busca de disponibilidade (CA04).      | ⏳     |
