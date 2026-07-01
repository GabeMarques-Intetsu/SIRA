# RF-012 — Configurações da conta e preferências

> **Tipo**: Requisito Funcional
> **Prioridade**: 🟠 Alta
> **Status**: 📝 Proposto

---

## Enunciado de negócio (sem termo técnico)

> **O sistema permite que cada pessoa gerencie seu próprio perfil, suas preferências de interface, sua segurança, suas notificações e a saída segura de seus dados, em um único lugar de configurações.**

## Justificativa

A tela de configurações reúne tudo que pertence à conta da própria pessoa: dados de perfil (nome, foto, telefone, departamento — com o e-mail institucional apenas para leitura), preferências de uso (tema claro/escuro/sistema, idioma, densidade da interface e redução de animações), segurança (troca de senha, verificação em duas etapas e revisão das sessões abertas), notificações (escolha de como ser avisada para cada tipo de evento) e a zona de risco (exportar os próprios dados e excluir a conta). Dá autonomia à pessoa sobre seus dados e conforto de uso, alinhando-se à LGPD nos direitos de acesso, portabilidade e eliminação. A área de integrações com sistemas externos fica documentada como evolução futura, fora do escopo atual.

## Regra de segurança — 2FA exigido no acesso

Quando a pessoa ativa a **verificação em duas etapas**, ela passa a ser **exigida no acesso**: após validar a senha, o sistema pede o código do aplicativo autenticador **antes de liberar as áreas internas**. Enquanto o código não é confirmado, a pessoa não acessa o sistema. Sem essa exigência, o 2FA seria apenas _cadastrável_ e não protegeria de fato o acesso. Quem não tem 2FA ativo continua acessando direto após a senha. Detalhe verificável em [F-39](../../backlog/features/F-39-seguranca-da-conta.md); decisão de design em [ADR-010](../../planning/adrs/ADR-010-enforcement-de-2fa-no-acesso-aal2.md).

## Realizado por (rastreabilidade ↓)

| Epic                                                         | Feature(s)                                                                                         | Status |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ------ |
| [EP-12](../../backlog/epics/EP-12-configuracoes-da-conta.md) | [F-37 Edição do perfil pessoal](../../backlog/features/F-37-edicao-do-perfil-pessoal.md)           | 📝     |
| [EP-12](../../backlog/epics/EP-12-configuracoes-da-conta.md) | [F-38 Preferências de interface](../../backlog/features/F-38-preferencias-de-interface.md)         | 📝     |
| [EP-12](../../backlog/epics/EP-12-configuracoes-da-conta.md) | [F-39 Segurança da conta](../../backlog/features/F-39-seguranca-da-conta.md)                       | 📝     |
| [EP-12](../../backlog/epics/EP-12-configuracoes-da-conta.md) | [F-40 Preferências de notificação](../../backlog/features/F-40-preferencias-de-notificacao.md)     | 📝     |
| [EP-12](../../backlog/epics/EP-12-configuracoes-da-conta.md) | [F-41 Exportação dos dados pessoais](../../backlog/features/F-41-exportacao-dos-dados-pessoais.md) | 📝     |
| [EP-12](../../backlog/epics/EP-12-configuracoes-da-conta.md) | [F-42 Exclusão da própria conta](../../backlog/features/F-42-exclusao-da-propria-conta.md)         | 📝     |

## RNFs que limitam

- [RNF-seguranca-privacidade](../RNF/RNF-seguranca-privacidade.md) — isolamento e não-exposição de dados pessoais.
- [RNF-tema-persistente](../RNF/RNF-tema-persistente.md) — o tema escolhido nas preferências aplica-se sem piscar e sincroniza entre abas.
- [RNF-internacionalizacao](../RNF/RNF-internacionalizacao.md) — o idioma escolhido reflete-se em toda a interface.
- [RNF-acessibilidade](../RNF/RNF-acessibilidade.md) — controles operáveis por teclado, com foco visível e alvos de toque adequados.

## Restrições e fora-de-escopo

- A seção **Integrações** com sistemas externos é placeholder de evolução futura; não há requisito funcional ativo para ela.
- O e-mail institucional é somente leitura: a pessoa não pode alterá-lo por aqui.
- Detalhe verificável de cada capacidade vive nas CAs das Features acima.
