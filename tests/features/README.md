# Testes BDD — cenários executáveis

Arquivos `.feature` (Gherkin **pt-BR**, `# language: pt`) gerados a partir das
User Stories do backlog (`docs/backlog/features/`). Cada `.feature` = 1 User Story.

## Como executar (Cucumber-js)

```bash
npm i -D @cucumber/cucumber
npx cucumber-js tests/features --language pt
```

Os **step definitions** (a cola entre cada `Dado/Quando/Então` e o código) ainda
precisam ser implementados em `tests/features/steps/`. A skill engenharia-de-requisitos
traz modelos prontos para 6 stacks em
`~/.claude/skills/engenharia-de-requisitos/examples/feature-step-defs/`
(inclui `cucumber-js`).

> Fonte da verdade continua sendo `docs/backlog/`. Estes arquivos são uma
> projeção dos cenários BDD; ao mudar um cenário, ajuste no backlog e regenere
> com `python3 .py/op_features.py --apply`.
