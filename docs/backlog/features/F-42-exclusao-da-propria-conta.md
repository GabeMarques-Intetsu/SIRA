# F-42 — Exclusão da própria conta

> **Tipo**: Feature
> **Epic pai**: [EP-12 Configurações da Conta](../epics/EP-12-configuracoes-da-conta.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-012](../../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md)

---

## Descrição (visão de produto)

Na Zona de risco, a pessoa pode excluir a própria conta. Por ser ação irreversível, exige confirmação explícita. Após a exclusão, a sessão é encerrada e o acesso deixa de existir, atendendo ao direito de eliminação da LGPD.

## Requisitos atendidos (rastreabilidade ↑)

| RF | Requisito | Relação |
| --- | --- | --- |
| [RF-012](../../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md) | Configurações da conta e preferências | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Excluir minha conta`

| ID | Critério | Como verificar | Status |
| --- | --- | --- | --- |
| **CA01** | A exclusão da conta exige uma confirmação explícita antes de ser efetivada. | — | 📝 |
| **CA02** | A confirmação deixa claro que a ação é irreversível. | — | 📝 |
| **CA03** | Após a exclusão, a sessão é encerrada e a pessoa não consegue mais acessar. | — | 📝 |
| **CA04** | A pessoa pode cancelar a confirmação e nada é excluído. | — | 📝 |
| **CA05** | A exclusão remove os dados pessoais da pessoa do sistema. | — | 📝 |

## User Stories

### US42.1 — Exclusão da conta com confirmação

> **Como** pessoa usuária do sistema, **quero** excluir minha conta com uma confirmação clara, **para** exercer meu direito de eliminação sem riscos de exclusão acidental.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Exclusão da própria conta

  Cenário: Excluir a conta após confirmar
    Dado que estou na seção Zona de risco
    Quando aciono "Excluir minha conta" e confirmo a ação irreversível
    Então minha conta é excluída
    E minha sessão é encerrada
    E não consigo mais acessar com essa conta

  Cenário: Cancelar a exclusão
    Dado que aciono "Excluir minha conta"
    Quando cancelo na tela de confirmação
    Então nada é excluído
    E continuo acessando normalmente
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05

#### Tasks (nível técnico — termo técnico permitido)

| ID | Task | Status |
| --- | --- | --- |
| T42.1.1 | Implementar diálogo de confirmação irreversível para exclusão da conta, com opção de cancelar (CA01, CA02, CA04). | ⏳ |
| T42.1.2 | Executar a exclusão dos dados pessoais do usuário e a remoção da conta no provedor de autenticação (CA05). | ⏳ |
| T42.1.3 | Encerrar a sessão e redirecionar para o login após a exclusão (CA03). | ⏳ |
