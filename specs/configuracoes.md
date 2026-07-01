# Spec — Configurações da conta

> **Rastreabilidade**
> - **RF**: [RF-012 — Configurações da conta e preferências](../requirements/RF/RF-012-configuracoes-da-conta-e-preferencias.md)
> - **Features**: [F-37 Perfil](../backlog/features/F-37-edicao-do-perfil-pessoal.md) · [F-38 Preferências de interface](../backlog/features/F-38-preferencias-de-interface.md) · [F-39 Segurança da conta](../backlog/features/F-39-seguranca-da-conta.md) · [F-40 Preferências de notificação](../backlog/features/F-40-preferencias-de-notificacao.md) · [F-41 Exportação de dados pessoais](../backlog/features/F-41-exportacao-dos-dados-pessoais.md) · [F-42 Exclusão da própria conta](../backlog/features/F-42-exclusao-da-propria-conta.md)
> - **Código**: `src/app/(app)/configuracoes/page.tsx` · `profile-form.tsx` · `preferences-panel.tsx` · `security-panel.tsx` · `notification-matrix.tsx` · `danger-zone.tsx` · `actions.ts` · `src/lib/preferences.ts` · `src/lib/mfa.ts` · `src/schemas/profile.ts`
> - **Mockup**: `docs/mockups/11-configuracoes.html`
> - **ADRs**: [ADR-004](../planning/adrs/ADR-004-tema-densidade-reducao-de-movimento-sem-script.md) (tema/densidade/redução de movimento)

> Sem `.feature` dedicado em `tests/features/` nesta versão; o comportamento de
> tema é coberto transversalmente por `US09.1-tema-da-interface.feature` e a
> privacidade por `US10.1-protecao-e-privacidade-de-informacoes-pessoais.feature`.

## User Stories

- **US37** — Como **usuário**, quero editar meu perfil (nome, departamento, telefone), para manter meus dados corretos.
- **US38** — Como **usuário**, quero ajustar preferências de interface (tema, densidade, redução de movimento), para adaptar a experiência.
- **US39** — Como **usuário**, quero gerenciar a segurança da conta (senha, MFA), para protegê-la.
- **US40** — Como **usuário**, quero configurar quais notificações recebo, para reduzir ruído.
- **US41** — Como **usuário**, quero exportar meus dados pessoais, para portabilidade (privacidade).
- **US42** — Como **usuário**, quero excluir minha própria conta, para encerrar meu uso.

## Critérios de Aceitação

| ID | Critério |
| --- | --- |
| CA01 | Perfil valida nome (≥ 2 chars) e telefone BR opcional (formato `(83) 99999-9999`). |
| CA02 | A troca de senha exige força mínima e confirmação coincidente. |
| CA03 | Preferências de tema/densidade/redução de movimento aplicam sem flash (sem `<script>`). |
| CA04 | A matriz de notificações define o que o usuário recebe por tipo. |
| CA05 | Exportação entrega os dados pessoais do próprio usuário. |
| CA06 | Exclusão da conta é uma ação destrutiva confirmada (zona de perigo). |

> Validação de perfil/senha em `src/schemas/profile.ts` (`profileSchema`,
> `BR_PHONE_RE`), delegando às regras de `src/lib/preferences.ts`
> (`isValidPhone`, `validatePasswordStrength`) e `src/lib/mfa.ts`. Tema/densidade
> aplicados via `next-themes` + atributos server-side, sem `<script>` (ADR-004);
> a matriz de notificação é montada por `buildMatrix` sobre `DEFAULT_PREFERENCES`.

## Cenário BDD

```gherkin
# language: pt
Funcionalidade: Configurações da conta

  Cenário: Atualizar o perfil com telefone válido
    Dado que estou em Configurações
    Quando informo um nome válido e o telefone "(83) 99999-9999" e salvo
    Então o perfil é atualizado

  Cenário: Trocar a senha com confirmação divergente é barrado
    Dado que estou no painel de segurança
    Quando informo uma nova senha e uma confirmação diferente
    Então o sistema exibe aviso e não altera a senha
```

## Estrutura da tela

```mermaid
flowchart TD
    A[/configuracoes] --> P[ProfileForm — F-37]
    A --> Pref[PreferencesPanel — F-38<br/>tema/densidade/reduce-motion]
    A --> Sec[SecurityPanel — F-39<br/>senha/MFA]
    A --> N[NotificationMatrix — F-40]
    A --> D[DangerZone — F-41 exportar · F-42 excluir conta]
    P --> S1[safeParse profileSchema → Server Action]
    Sec --> S2[validatePasswordStrength + confirmação]
```
